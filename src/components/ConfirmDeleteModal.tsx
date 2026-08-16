import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';

interface ConfirmDeleteModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  countdownSeconds?: number;
}

export const ConfirmDeleteModal = ({ 
  visible, 
  onCancel, 
  onConfirm, 
  countdownSeconds = 10 
}: ConfirmDeleteModalProps) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (visible && timeLeft > 0 && !isDeleting) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [visible, timeLeft, isDeleting]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setTimeLeft(countdownSeconds);
      setIsDeleting(false);
    }
  }, [visible]);

  const handleConfirm = () => {
    setIsDeleting(true);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={isDeleting ? undefined : onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
              <Text className="text-red-600 text-3xl">⚠️</Text>
            </View>
            <Text className="text-xl font-bold font-sans text-gray-900 mb-2 text-center">
              Delete Account?
            </Text>
            <Text className="text-gray-500 font-sans text-center leading-relaxed">
              This action cannot be undone. All your subjects, timetable, and attendance history will be permanently deleted.
            </Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity 
              className={`py-4 rounded-2xl items-center justify-center ${
                timeLeft > 0 || isDeleting ? 'bg-gray-200' : 'bg-red-600'
              }`}
              disabled={timeLeft > 0 || isDeleting}
              onPress={handleConfirm}
            >
              {isDeleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className={`font-bold font-sans text-base ${
                  timeLeft > 0 ? 'text-gray-400' : 'text-white'
                }`}>
                  {timeLeft > 0 ? `Yes, Delete (${timeLeft}s)` : 'Yes, Delete Everything'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="py-4 rounded-2xl items-center justify-center bg-gray-100"
              disabled={isDeleting}
              onPress={onCancel}
            >
              <Text className="text-white font-bold font-sans text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
