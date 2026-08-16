import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { useThemeStore } from '../../src/stores/theme.store';
import { ProfileImage } from '../../src/components/ProfileImage';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile } from '../../src/services/auth.service';
import { LogOut, Moon, Sun, Monitor, Camera, Trash2 } from 'lucide-react-native';
import { ConfirmDeleteModal } from '../../src/components/ConfirmDeleteModal';

import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout, deleteAccount, rehydrateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      await updateUserProfile(displayName, result.assets[0].uri);
      rehydrateUser();
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    await updateUserProfile(displayName, user?.photoUrl);
    await rehydrateUser();
    setIsEditing(false);
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleDeleteAccount = async () => {
    setDeleteModalVisible(false);
    await deleteAccount();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-oledBlack">
              <ScrollView className="flex-1 px-5 pt-3">
          <Text className="text-[34px] font-black font-sans text-gray-900 dark:text-white mb-8 tracking-tight">Profile & Settings</Text>

        <View className="items-center mb-8">
          <TouchableOpacity onPress={handlePickImage} className="relative" activeOpacity={0.8}>
            <ProfileImage uri={user?.photoUrl} name={user?.displayName || ''} size={110} />
            <View className="absolute bottom-0 right-0 w-9 h-9 bg-primaryOrange rounded-full items-center justify-center border-4 border-offWhite dark:border-oledBlack">
              <Camera color="#fff" size={18} />
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-3 ml-2 uppercase font-sans tracking-widest">Account Details</Text>
        <View className="bg-white dark:bg-cardDark rounded-[24px] p-5 border border-black/5 dark:border-white/5 mb-8 shadow-sm dark:shadow-none">
          <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase font-sans tracking-widest">Full Name</Text>
          {isEditing ? (
            <View className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 h-[48px] bg-gray-50 dark:bg-oledBlack rounded-[16px] px-4 font-sans border border-black/5 dark:border-white/5 mr-3 text-[16px] font-bold text-gray-900 dark:text-white"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <TouchableOpacity onPress={handleSaveName} disabled={saving} className="bg-primaryOrange px-5 h-[48px] rounded-[16px] justify-center shadow-sm">
                <Text className="text-white font-black font-sans text-[15px]">{saving ? '...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center justify-between py-1 ml-1 mb-2">
              <Text className="text-[17px] font-bold font-sans text-gray-900 dark:text-white tracking-tight">{user?.displayName}</Text>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text className="text-primaryOrange font-black font-sans text-[15px]">Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          <View className="h-[1px] bg-black/5 dark:bg-white/5 my-3" />

          <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase font-sans tracking-widest mt-1">Email Address</Text>
          <Text className="text-[16px] font-bold font-sans text-gray-500 dark:text-gray-400 py-1 ml-1 tracking-tight">{user?.email}</Text>

          <View className="h-[1px] bg-black/5 dark:bg-white/5 my-3" />

          <Text className="text-[11px] font-black text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase font-sans tracking-widest mt-1">Account Type</Text>
          <Text className="text-[16px] font-bold font-sans text-gray-500 dark:text-gray-400 py-1 ml-1 capitalize tracking-tight">{user?.role.toLowerCase()}</Text>
        </View>



        <TouchableOpacity 
          className="flex-row items-center justify-center p-5 bg-red-50 dark:bg-red-500/10 rounded-[24px] mb-4 border border-red-100 dark:border-red-500/20"
          onPress={handleLogout}
        >
          <LogOut color="#ef4444" size={20} />
          <Text className="ml-3 font-black font-sans text-red-500 text-[16px]">Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center justify-center p-5 rounded-[24px] mb-12 border border-transparent"
          onPress={() => setDeleteModalVisible(true)}
        >
          <Trash2 color="#ef4444" size={20} />
          <Text className="ml-3 font-black font-sans text-red-500 text-[16px]">Delete Account</Text>
        </TouchableOpacity>

      </ScrollView>

      <ConfirmDeleteModal 
        visible={deleteModalVisible} 
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
        countdownSeconds={10}
      />
          </SafeAreaView>
  );
}
