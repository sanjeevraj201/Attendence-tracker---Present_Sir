import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { 
  getAllCorrectionRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest
} from '../../src/services/firestore.service';
import { AttendanceCorrectionRequest } from '../../src/types/session.types';
import { Check, X, RotateCcw, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AdminCorrectionRequestsScreen() {
  const { user } = useAuthStore();
  const uid = user?.uid;
  const displayName = user?.displayName || 'Admin';
  const router = useRouter();

  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllRequests = async () => {
    setLoading(true);
    try {
      const corrData = await getAllCorrectionRequests();
      setCorrections(corrData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, []);

  const handleApproveCorrection = async (item: AttendanceCorrectionRequest) => {
    if (!uid) return;
    try {
      await approveCorrectionRequest(item, uid, displayName);
      loadAllRequests();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to approve correction request.');
    }
  };

  const handleRejectCorrection = async (requestId: string) => {
    if (!uid) return;
    try {
      await rejectCorrectionRequest(requestId, uid);
      loadAllRequests();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to reject correction request.');
    }
  };

  const renderCorrectionItem = ({ item }: { item: AttendanceCorrectionRequest }) => (
    <View className="bg-white p-4 rounded-2xl mb-4 border border-cardBorder shadow-sm">
      <View className="flex-row justify-between mb-2">
        <View className="bg-orange-100 px-2 py-1 rounded flex-row items-center">
          <RotateCcw color="#4338ca" size={12} className="mr-1" />
          <Text className="text-xs font-bold text-orange-800 font-sans">CORRECTION</Text>
        </View>
        <Text className="text-xs text-gray-500 font-sans">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text className="font-bold text-lg text-gray-900 font-sans">{item.studentName}</Text>
      <Text className="text-sm text-gray-600 font-sans mb-1">
        {item.subjectCode} • Request to remove <Text className="font-bold">{item.currentType}</Text>
      </Text>
      <Text className="text-sm text-gray-600 font-sans mb-3">
        Date: {item.date}
      </Text>
      
      <View className="bg-gray-50 p-3 rounded-lg mb-4 border-l-4 border-orange-400">
        <Text className="text-xs font-bold text-gray-500 uppercase font-sans mb-1">Student's Reason</Text>
        <Text className="text-sm text-gray-800 font-sans italic">"{item.reason}"</Text>
      </View>

      <View className="flex-row justify-end space-x-2">
        <TouchableOpacity 
          className="px-4 py-2 bg-red-50 rounded-lg flex-row items-center border border-red-200 mr-2"
          onPress={() => handleRejectCorrection(item.requestId)}
        >
          <X color="#b91c1c" size={16} className="mr-1" />
          <Text className="text-red-700 font-bold font-sans text-sm">Keep {item.currentType}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-4 py-2 bg-green-50 rounded-lg flex-row items-center border border-green-200"
          onPress={() => handleApproveCorrection(item)}
        >
          <Check color="#15803d" size={16} style={{ marginRight: 4 }}  />
          <Text className="text-green-700 font-bold font-sans text-sm">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
      <View className="flex-1 px-4 pt-2">
        <View className="flex-row items-center mb-6">
          <Text className="text-2xl font-bold font-sans text-gray-900">Correction Requests</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator color="#F97316" size="large" className="mt-10" />
        ) : corrections.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <RotateCcw color="#9CA3AF" size={32} />
            </View>
            <Text className="text-gray-500 font-sans">No pending correction requests across all subjects.</Text>
          </View>
        ) : (
          <FlatList
            data={corrections}
            keyExtractor={item => item.requestId}
            renderItem={renderCorrectionItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
