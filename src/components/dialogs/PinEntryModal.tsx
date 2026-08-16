import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Key, X } from 'lucide-react-native';

interface PinEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<void>;
  isLoading?: boolean;
}

export function PinEntryModal({ visible, onClose, onSubmit, isLoading = false }: PinEntryModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setError('');
    try {
      await onSubmit(pin);
      setPin('');
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-5">
        <View className="bg-white dark:bg-cardDark rounded-[32px] w-full p-7 shadow-2xl relative overflow-hidden">
          <View className="absolute top-0 left-0 w-full h-2 bg-primaryOrange" />
          
          <View className="flex-row justify-between items-center mb-6 mt-3">
            <View className="flex-row items-center">
              <Key color="#FF5E00" size={24} className="mr-3" />
              <Text className="text-[22px] font-black text-gray-900 dark:text-white font-sans tracking-tight">Enter Class PIN</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isLoading} className="p-2 rounded-full bg-gray-50 dark:bg-oledBlack border border-black/5 dark:border-white/5">
              <X color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>
          
          <Text className="text-gray-500 dark:text-gray-400 font-sans mb-6 text-[14px] leading-5">
            Wi-Fi verification failed. Please enter the 4-digit PIN provided by your professor to mark attendance.
          </Text>

          <TextInput
            className="w-full bg-gray-50 dark:bg-oledBlack border border-black/5 dark:border-white/5 rounded-[24px] p-5 text-center text-4xl font-mono font-bold tracking-[0.5em] text-gray-900 dark:text-white mb-2"
            value={pin}
            onChangeText={(text) => {
              setPin(text.replace(/[^0-9]/g, '').slice(0, 4));
              setError('');
            }}
            keyboardType="number-pad"
            placeholder="----"
            placeholderTextColor="#6B7280"
            maxLength={4}
            editable={!isLoading}
            autoFocus
          />

          {error ? (
            <Text className="text-red-500 text-[14px] font-bold font-sans text-center mb-4">{error}</Text>
          ) : (
            <View className="h-4 mb-4" /> // Spacer
          )}

          <TouchableOpacity
            className={`w-full h-[56px] rounded-full bg-primaryOrange items-center justify-center shadow-sm ${
              (pin.length !== 4 || isLoading) ? 'opacity-50' : ''
            }`}
            onPress={handleSubmit}
            disabled={pin.length !== 4 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-black font-sans text-[17px] tracking-wide">Verify & Mark</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
