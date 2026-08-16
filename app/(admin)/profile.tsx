import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { ProfileImage } from '../../src/components/ProfileImage';
import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-oledBlack">
              <ScrollView className="flex-1 px-5 pt-3">
          <Text className="text-[34px] font-black font-sans text-gray-900 dark:text-white mb-8 tracking-tight">Admin Profile</Text>

          <View className="items-center mb-8">
            <View className="relative">
              <ProfileImage uri={user?.photoUrl} name={user?.displayName || 'Admin'} size={110} />
            </View>
          </View>

          <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-3 ml-2 uppercase font-sans tracking-widest">Account Details</Text>
          <View className="bg-white dark:bg-cardDark rounded-[24px] p-5 border border-black/5 dark:border-white/5 mb-8 shadow-sm dark:shadow-none">
            <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase font-sans tracking-widest">Full Name</Text>
            <View className="flex-row items-center justify-between py-1 ml-1 mb-2">
              <Text className="text-[17px] font-bold font-sans text-gray-900 dark:text-white tracking-tight">{user?.displayName}</Text>
            </View>

            <View className="h-[1px] bg-black/5 dark:bg-white/5 my-3" />

            <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase font-sans tracking-widest mt-1">Email Address</Text>
            <Text className="text-[16px] font-bold font-sans text-gray-500 dark:text-gray-400 py-1 ml-1 tracking-tight">{user?.email}</Text>

            <View className="h-[1px] bg-black/5 dark:bg-white/5 my-3" />

            <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase font-sans tracking-widest mt-1">Account Type</Text>
            <Text className="text-[16px] font-bold font-sans text-gray-500 dark:text-gray-400 py-1 ml-1 capitalize tracking-tight">{user?.role.toLowerCase()}</Text>
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center p-5 bg-red-50 dark:bg-red-500/10 rounded-[24px] mb-12 border border-red-100 dark:border-red-500/20"
            onPress={handleLogout}
          >
            <LogOut color="#ef4444" size={20} />
            <Text className="ml-3 font-black font-sans text-red-500 text-[16px]">Sign Out</Text>
          </TouchableOpacity>

        </ScrollView>
          </SafeAreaView>
  );
}
