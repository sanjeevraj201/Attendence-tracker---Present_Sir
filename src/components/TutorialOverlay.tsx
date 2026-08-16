import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, Animated, Dimensions } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface TutorialOverlayProps {
  visible: boolean;
  steps: TutorialStep[];
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ visible, steps, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!visible) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <BlurView intensity={20} tint="dark" className="flex-1 justify-center items-center px-6">
        <SafeAreaView className="flex-1 justify-center items-center w-full">
          <View className="bg-white dark:bg-gray-900 w-full rounded-[24px] p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            
            <View className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6 mx-auto">
              {step.icon}
            </View>

            <Text className="text-2xl font-bold font-sans text-gray-900 dark:text-white text-center mb-3">
              {step.title}
            </Text>

            <Text className="text-base text-gray-500 dark:text-gray-400 font-sans text-center mb-8 leading-relaxed">
              {step.description}
            </Text>

            <View className="flex-row justify-center mb-8">
              {steps.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full mx-1 transition-all ${
                    index === currentStep 
                      ? 'w-6 bg-primaryOrange' 
                      : 'w-2 bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleNext}
              className="w-full h-12 bg-primaryOrange rounded-xl items-center justify-center shadow-sm"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold font-sans text-base">
                {currentStep === steps.length - 1 ? "Let's Go!" : 'Next'}
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
};

