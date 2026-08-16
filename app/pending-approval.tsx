import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { Clock } from 'lucide-react-native';

export default function PendingApprovalScreen() {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'PENDING_FACULTY') {
      router.replace('/');
    }
  }, [user?.role]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-6">
          <Clock color="#d97706" size={40} />
        </View>
        <Text className="text-2xl font-bold font-sans text-gray-900 mb-2 text-center">Approval Pending</Text>
        <Text className="text-base text-gray-500 font-sans text-center mb-8">
          Your faculty account has been created and is awaiting administrator approval. You will gain access to the faculty dashboard once approved.
        </Text>

        <TouchableOpacity
          className="h-12 px-8 rounded-[22px] bg-white border border-gray-200 items-center justify-center"
          onPress={handleLogout}
        >
          <Text className="text-gray-700 font-bold font-sans">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
