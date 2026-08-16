import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { sendPasswordReset } from '../../src/services/auth.service';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from '../../src/components/Button';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{type: 'error' | 'success', message: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    setIsLoading(true);
    setStatus(null);
    try {
      await sendPasswordReset(email);
      setStatus({ type: 'success', message: 'Password reset email sent. Check your inbox.' });
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to send reset email.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-offWhite dark:bg-oledBlack"
    >
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom }}>
        
        <TouchableOpacity 
          className="w-[44px] h-[44px] rounded-full bg-white dark:bg-[#1A1A1C] items-center justify-center border border-black/5 dark:border-white/5 mb-8 shadow-sm dark:shadow-none"
          onPress={() => router.back()}
        >
          <ArrowLeft color="#9CA3AF" size={22} />
        </TouchableOpacity>

        <Text className="text-4xl font-black font-sans text-gray-900 dark:text-white mb-2 tracking-tight">Reset Password</Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 font-sans mb-10 leading-6">Enter your registered email address and we'll send you a link to reset your password.</Text>

        {status && <StatusBanner type={status.type} message={status.message} />}

        <View className="bg-white dark:bg-cardDark p-5 rounded-[24px] shadow-sm dark:shadow-none border border-black/5 dark:border-white/5 mb-8">
          <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1 uppercase tracking-wider font-sans">Email Address</Text>
          <TextInput
            className="h-[56px] bg-gray-50/50 dark:bg-oledBlack rounded-[16px] px-5 font-sans border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white text-base"
            placeholder="student@college.edu"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => { setEmail(text); setStatus(null); }}
          />
        </View>

        <Button 
          label="Send Reset Link" 
          onPress={handleReset} 
          disabled={!email}
          isLoading={isLoading}
          className="mb-4 shadow-sm shadow-primaryOrange/20"
        />

      </View>
    </KeyboardAvoidingView>
  );
}
