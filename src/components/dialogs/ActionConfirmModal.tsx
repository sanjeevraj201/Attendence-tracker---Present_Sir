import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, Easing } from 'react-native-reanimated';

interface ActionConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmModal = ({
  visible,
  title,
  message,
  confirmText = 'Proceed',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}: ActionConfirmModalProps) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View 
        entering={FadeIn.duration(400).easing(Easing.out(Easing.cubic))}
        exiting={FadeOut.duration(300)}
        className="flex-1 bg-black/60 justify-center px-6"
      >
        <Animated.View 
          entering={ZoomIn.duration(500).easing(Easing.bezier(0.16, 1, 0.3, 1))}
          exiting={ZoomOut.duration(350).easing(Easing.out(Easing.cubic))}
          className="bg-white dark:bg-cardDark rounded-[32px] p-7 shadow-2xl border border-black/5 dark:border-white/5"
        >
          <Text className="text-[22px] font-black font-sans text-gray-900 dark:text-white tracking-tight text-center mb-3">
            {title}
          </Text>
          <Text className="text-[15px] text-gray-500 dark:text-gray-400 font-sans text-center leading-6 mb-8">
            {message}
          </Text>

          <View className="flex-row space-x-3 w-full">
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              className="flex-1 h-[52px] bg-gray-100 dark:bg-oledBlack rounded-full items-center justify-center mr-2 border border-black/5 dark:border-white/5"
            >
              <Text className="text-[16px] font-bold font-sans text-gray-700 dark:text-gray-300">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              className={`flex-1 h-[52px] rounded-full items-center justify-center ml-2 shadow-sm ${
                isDestructive 
                  ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20' 
                  : 'bg-primaryOrange'
              }`}
            >
              <Text className={`text-[16px] font-bold font-sans ${
                isDestructive ? 'text-rose-700 dark:text-rose-500' : 'text-white'
              }`}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
