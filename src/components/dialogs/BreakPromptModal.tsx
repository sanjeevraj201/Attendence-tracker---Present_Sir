import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';

interface BreakPromptModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (breakMins: number) => void;
}

export const BreakPromptModal = ({ visible, onCancel, onSubmit }: BreakPromptModalProps) => {
  const [mins, setMins] = useState('10');

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/60 justify-center items-center p-5">
        <View className="bg-white dark:bg-cardDark rounded-[32px] p-7 w-full max-w-sm shadow-2xl">
          <Text className="text-[22px] font-black font-sans text-gray-900 dark:text-white mb-3 text-center tracking-tight">
            Add a Break?
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 font-sans text-center mb-6 text-[14px] leading-5">
            Is there a break after this period? If yes, enter the minutes to automatically shift the next classes.
          </Text>

          <View className="flex-row items-center bg-gray-50 dark:bg-oledBlack rounded-[20px] px-5 mb-8 border border-black/5 dark:border-white/5">
            <TextInput
              className="flex-1 h-[56px] font-sans text-[20px] font-black tracking-wide text-center text-gray-900 dark:text-white"
              keyboardType="number-pad"
              value={mins}
              onChangeText={setMins}
              placeholder="0"
              placeholderTextColor="#6B7280"
            />
            <Text className="font-sans text-[15px] font-bold text-gray-500 dark:text-gray-400 ml-2">minutes</Text>
          </View>

          <View className="flex-row gap-4">
            <TouchableOpacity 
              className="flex-1 py-4 rounded-full items-center justify-center bg-gray-100 dark:bg-oledBlack border border-black/5 dark:border-white/5"
              onPress={() => onSubmit(0)}
              activeOpacity={0.7}
            >
              <Text className="text-gray-900 dark:text-white font-bold font-sans text-[15px]">No Break</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 py-4 rounded-full items-center justify-center bg-primaryOrange shadow-sm"
              onPress={() => onSubmit(parseInt(mins) || 0)}
              activeOpacity={0.8}
            >
              <Text className="text-white font-black font-sans text-[15px]">Save Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
