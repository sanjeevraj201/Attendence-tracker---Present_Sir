import React, { useMemo, forwardRef } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isDestructive?: boolean;
}

// Wrapper for cross-platform usage
export const showConfirm = (props: ConfirmDialogProps) => {
  if (Platform.OS === 'ios') {
    Alert.alert(
      props.title,
      props.message,
      [
        {
          text: props.cancelText || 'Cancel',
          style: 'cancel',
          onPress: props.onCancel,
        },
        {
          text: props.confirmText || 'Confirm',
          style: props.isDestructive ? 'destructive' : 'default',
          onPress: props.onConfirm,
        },
      ]
    );
    return true; // Indicates native alert was shown
  }
  return false; // Indicates Android, need to trigger bottom sheet
};

// Android fallback bottom sheet
export const ConfirmSheet = forwardRef<BottomSheet, ConfirmDialogProps & { onClose: () => void }>(
  ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, isDestructive, onClose }, ref) => {
    const snapPoints = useMemo(() => ['30%'], []);

    const handleConfirm = () => {
      onConfirm();
      onClose();
    };

    const handleCancel = () => {
      if (onCancel) onCancel();
      onClose();
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleCancel}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
      >
        <View className="flex-1 p-6 items-center">
          <Text className="text-xl font-bold font-sans text-gray-900 mb-2">{title}</Text>
          <Text className="text-base text-gray-500 font-sans text-center mb-8">{message}</Text>
          
          <View className="flex-row w-full space-x-4">
            <TouchableOpacity 
              className="flex-1 h-12 items-center justify-center bg-gray-100 rounded-full mr-2"
              onPress={handleCancel}
            >
              <Text className="font-bold font-sans text-gray-700">{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-1 h-12 items-center justify-center rounded-full ml-2 ${isDestructive ? 'bg-red-600' : 'bg-primaryOrange'}`}
              onPress={handleConfirm}
            >
              <Text className="font-bold font-sans text-white">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    );
  }
);

ConfirmSheet.displayName = 'ConfirmSheet';
