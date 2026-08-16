import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { AppLogo } from '../../src/components/AppLogo';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [accountType, setAccountType] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [staffId, setStaffId] = useState('');

  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    const isFaculty = accountType === 'FACULTY';
    if (!email || !password || !displayName || (isFaculty && (!department.trim() || !staffId.trim()))) return;
    const finalRole = isFaculty ? 'PENDING_FACULTY' : 'STUDENT';
    
    await register(email, password, displayName, finalRole, department, staffId);
    
    if (!useAuthStore.getState().error) {
      router.replace('/');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-offWhite dark:bg-oledBlack"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top, paddingBottom: insets.bottom }}
        className="px-6"
        showsVerticalScrollIndicator={false}
      >
        
        <View className="items-center mb-10">
          <AppLogo size={88} />
          <Text className="text-4xl font-black font-sans text-gray-900 dark:text-white mt-5 tracking-tight">PresentSir</Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 font-sans mt-2">Create a new account</Text>
        </View>

        {error && <StatusBanner type="error" message={error} />}

        <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase tracking-wider font-sans">Account Type</Text>
        <View className="flex-row bg-gray-100 dark:bg-oledBlack p-1 rounded-[16px] mb-5 border border-gray-100 dark:border-white/5">
          <TouchableOpacity
            className={`flex-1 h-[48px] rounded-[12px] items-center justify-center ${accountType === 'STUDENT' ? 'bg-white dark:bg-cardDark' : ''}`}
            onPress={() => setAccountType('STUDENT')}
          >
            <Text className={`font-bold font-sans ${accountType === 'STUDENT' ? 'text-primaryOrange' : 'text-gray-500 dark:text-gray-400'}`}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 h-[48px] rounded-[12px] items-center justify-center ${accountType === 'FACULTY' ? 'bg-white dark:bg-cardDark' : ''}`}
            onPress={() => setAccountType('FACULTY')}
          >
            <Text className={`font-bold font-sans ${accountType === 'FACULTY' ? 'text-primaryOrange' : 'text-gray-500 dark:text-gray-400'}`}>Faculty</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white dark:bg-cardDark p-5 rounded-[24px] shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 mb-8">
          <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase tracking-wider font-sans">Full Name</Text>
          <TextInput
            className="h-[56px] bg-gray-50/50 dark:bg-oledBlack rounded-[16px] px-5 font-sans mb-5 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white text-base"
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            value={displayName}
            onChangeText={(text) => { setDisplayName(text); clearError(); }}
          />

          <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase tracking-wider font-sans">Email Address</Text>
          <TextInput
            className="h-[56px] bg-gray-50/50 dark:bg-oledBlack rounded-[16px] px-5 font-sans mb-5 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white text-base"
            placeholder="student@college.edu"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => { setEmail(text); clearError(); }}
          />

          <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase tracking-wider font-sans">Password</Text>
          <TextInput
            className="h-[56px] bg-gray-50/50 dark:bg-oledBlack rounded-[16px] px-5 font-sans border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white text-base"
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={(text) => { setPassword(text); clearError(); }}
          />

          {accountType === 'FACULTY' && (
            <>
              <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 mt-5 uppercase tracking-wider font-sans">Department</Text>
              <TextInput
                className="h-[56px] bg-gray-50/50 dark:bg-oledBlack rounded-[16px] px-5 font-sans mb-5 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white text-base"
                placeholder="Computer Science"
                placeholderTextColor="#9CA3AF"
                value={department}
                onChangeText={(text) => { setDepartment(text); clearError(); }}
              />

              <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase tracking-wider font-sans">Staff ID</Text>
              <TextInput
                className="h-[56px] bg-gray-50/50 dark:bg-oledBlack rounded-[16px] px-5 font-sans border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white text-base"
                placeholder="FAC-001"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                value={staffId}
                onChangeText={(text) => { setStaffId(text); clearError(); }}
              />
            </>
          )}
        </View>

        <Button 
          label="Sign Up" 
          onPress={handleRegister} 
          disabled={!email || !password || !displayName || (accountType === 'FACULTY' && (!department.trim() || !staffId.trim()))}
          isLoading={isLoading}
          className="mb-6 shadow-sm shadow-primaryOrange/20"
        />

        <View className="flex-row justify-center mt-2">
          <Text className="text-gray-500 dark:text-gray-400 font-sans text-[15px]">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-primaryOrange font-bold font-sans text-[15px]">Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
