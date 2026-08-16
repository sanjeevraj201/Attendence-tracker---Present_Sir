import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { X } from 'lucide-react-native';

interface SubjectFormSheetProps {
  visible: boolean;
  initialCode?: string;
  initialName?: string;
  initialFaculty?: string;
  isEditing?: boolean;
  onSave: (code: string, name: string, faculty?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const SubjectFormSheet = ({
  visible,
  initialCode = '',
  initialName = '',
  initialFaculty = '',
  isEditing = false,
  onSave,
  onDelete,
  onClose
}: SubjectFormSheetProps) => {
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(initialName);
  const [faculty, setFaculty] = useState(initialFaculty);

  // Reset fields when opened for adding
  useEffect(() => {
    if (visible && !isEditing) {
      setCode('');
      setName('');
      setFaculty('');
    } else if (visible && isEditing) {
      setCode(initialCode);
      setName(initialName);
      setFaculty(initialFaculty);
    }
  }, [visible, isEditing, initialCode, initialName, initialFaculty]);

  const handleSave = () => {
    if (!code || !name) return;
    onSave(code, name, faculty);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/60 justify-center px-5"
      >
        <View className="bg-white dark:bg-cardDark rounded-[32px] p-7 shadow-2xl">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-[26px] font-black font-sans text-gray-900 dark:text-white tracking-tight">
              {isEditing ? 'Edit Subject' : 'Add Subject'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-gray-100 dark:bg-oledBlack border border-black/5 dark:border-white/5 rounded-full w-10 h-10 items-center justify-center" activeOpacity={0.7}>
              <X color="#9CA3AF" size={20} />
            </TouchableOpacity>
          </View>

          <View className="mb-5">
            <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-2 uppercase font-sans tracking-widest">Subject Code</Text>
            <TextInput
              className="h-[56px] bg-gray-50 dark:bg-oledBlack rounded-[20px] px-5 font-sans border border-black/5 dark:border-white/5 text-gray-900 dark:text-white text-[16px]"
              placeholder="e.g. CS101"
              placeholderTextColor="#6B7280"
              value={code}
              onChangeText={setCode}
            />
          </View>

          <View className="mb-5">
            <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-2 uppercase font-sans tracking-widest">Subject Name</Text>
            <TextInput
              className="h-[56px] bg-gray-50 dark:bg-oledBlack rounded-[20px] px-5 font-sans border border-black/5 dark:border-white/5 text-gray-900 dark:text-white text-[16px]"
              placeholder="e.g. Introduction to Programming"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-8">
            <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-2 ml-2 uppercase font-sans tracking-widest">Faculty Name (Optional)</Text>
            <TextInput
              className="h-[56px] bg-gray-50 dark:bg-oledBlack rounded-[20px] px-5 font-sans border border-black/5 dark:border-white/5 text-gray-900 dark:text-white text-[16px]"
              placeholder="e.g. Dr. Alan Turing"
              placeholderTextColor="#6B7280"
              value={faculty}
              onChangeText={setFaculty}
            />
          </View>

          <TouchableOpacity
            className={`h-[56px] rounded-full bg-primaryOrange items-center justify-center mb-3 shadow-sm ${(!code || !name) ? 'opacity-50' : ''}`}
            disabled={!code || !name}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text className="text-white font-black font-sans text-[17px] tracking-wide">Save Subject</Text>
          </TouchableOpacity>

          {isEditing && onDelete && (
            <TouchableOpacity
              className="h-[56px] rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 items-center justify-center mt-1"
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Text className="text-red-700 dark:text-red-500 font-bold font-sans text-[16px]">Delete Subject</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
