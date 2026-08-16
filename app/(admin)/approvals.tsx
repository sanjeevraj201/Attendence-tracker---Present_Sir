import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { getPendingFaculty, approveFaculty, rejectFaculty } from '../../src/services/firestore.service';
import { PendingFaculty } from '../../src/types/user.types';
import { Check, X, Users, RotateCcw } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ApprovalsScreen() {
  const adminUid = useAuthStore(state => state.user?.uid);
  const router = useRouter();
  const [pending, setPending] = useState<PendingFaculty[]>([]);
  const [subjectCodes, setSubjectCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingFaculty();
      setPending(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (uid: string) => {
    if (!adminUid) return;

    const assignedCodes = (subjectCodes[uid] || '')
      .split(',')
      .map((code) => code.trim())
      .filter(Boolean)
      .filter((code, index, codes) => codes.indexOf(code) === index);

    if (assignedCodes.length === 0) {
      Alert.alert('Subject codes required', 'Assign at least one subject code before approving this faculty member.');
      return;
    }

    try {
      await approveFaculty(uid, adminUid, assignedCodes);
      loadPending();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to approve faculty.');
    }
  };

  const handleReject = async (uid: string) => {
    try {
      await rejectFaculty(uid);
      loadPending();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to reject faculty.');
    }
  };

  const renderItem = ({ item }: { item: PendingFaculty }) => (
    <View className="bg-white p-4 rounded-2xl mb-4 border border-cardBorder shadow-sm flex-row flex-wrap items-center justify-between">
      <View className="flex-1">
        <Text className="font-bold text-lg text-gray-900 font-sans">{item.displayName}</Text>
        <Text className="text-sm text-gray-500 font-sans">{item.email}</Text>
        <Text className="text-xs text-primaryOrange font-sans mt-1">{item.department} • {item.staffId}</Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity 
          className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-2"
          onPress={() => handleReject(item.uid)}
        >
          <X color="#b91c1c" size={20} />
        </TouchableOpacity>
        <TouchableOpacity 
          className="w-10 h-10 bg-green-100 rounded-full items-center justify-center"
          onPress={() => handleApprove(item.uid)}
        >
          <Check color="#15803d" size={20} />
        </TouchableOpacity>
      </View>
      <Text className="w-full text-xs font-bold text-gray-500 uppercase font-sans mt-4 mb-2">Assigned Subject Codes</Text>
      <TextInput
        className="w-full h-11 bg-gray-50 rounded-xl px-3 border border-gray-100 text-gray-900 font-sans"
        placeholder="e.g. CS101, MA101"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="characters"
        value={subjectCodes[item.uid] || ''}
        onChangeText={(value) => setSubjectCodes((current) => ({ ...current, [item.uid]: value }))}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
      <View className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold font-sans text-gray-900 mb-6">Admin Dashboard</Text>
        
        <Text className="text-xl font-bold font-sans text-gray-900 mb-4">Pending Faculty Approvals</Text>

        {loading ? (
          <ActivityIndicator color="#F97316" size="large" className="mt-10" />
        ) : pending.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 font-sans">No pending faculty requests.</Text>
          </View>
        ) : (
          <FlatList
            data={pending}
            keyExtractor={item => item.uid}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
