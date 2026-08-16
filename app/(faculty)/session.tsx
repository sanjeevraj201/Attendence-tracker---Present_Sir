import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../../src/stores/session.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { loadFacultySubjects } from '../../src/services/firestore.service';
import { Radio, MapPin, StopCircle, Key } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, Easing } from 'react-native-reanimated';

export default function SessionScreen() {
  const uid = useAuthStore(state => state.user?.uid);
  const { activeSession, startSession, endSession, isProcessing, updateSessionPin } = useSessionStore();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [radius, setRadius] = useState<number>(50); // meters
  
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (uid) {
      loadFacultySubjects(uid).then(codes => {
        setSubjects(codes);
        if (codes.length > 0) setSelectedSubject(codes[0]);
      });
    }
  }, [uid]);

  // Handle PIN Refresh Timer
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    
    if (activeSession) {
      let lastPinChange = Date.now();

      const tick = () => {
        const now = Date.now();
        const elapsed = now - lastPinChange;

        if (elapsed >= 60000) {
          const newPin = Math.floor(1000 + Math.random() * 9000).toString();
          updateSessionPin(newPin);
          lastPinChange = now;
          
          setSecondsRemaining(60);
          progress.value = 1;
          progress.value = withTiming(0, { duration: 60000, easing: Easing.linear });
        }

        timerId = setTimeout(tick, 1000);
      };

      // Initial setup
      progress.value = 1;
      setSecondsRemaining(60);
      progress.value = withTiming(0, { duration: 60000, easing: Easing.linear });
      
      timerId = setTimeout(tick, 1000);
    } else {
      progress.value = 1;
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [activeSession?.sessionId]); // Re-run if session starts/stops, but not on every render

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`
    };
  });

  const handleStart = async () => {
    if (!selectedSubject) return;
    await startSession(selectedSubject, `Subject ${selectedSubject}`, radius);
  };

  const handleEnd = async () => {
    await endSession();
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
              <View className="flex-1 px-4 pt-2">
          <Text className="text-3xl font-bold font-sans text-gray-900 mb-6">Live Session</Text>

        {!activeSession ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-cardBorder shadow-sm">
            <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-6">
              <Radio color="#F97316" size={40} />
            </View>
            
            <Text className="text-xl font-bold text-gray-900 font-sans mb-2 text-center">Start a Class Session</Text>
            <Text className="text-gray-500 font-sans text-center mb-6">
              Students within your geofence radius will be able to mark their attendance live.
            </Text>

            <View className="w-full mb-6">
              <Text className="text-xs font-bold text-gray-500 mb-2 uppercase font-sans">Subject Code</Text>
              <View className="h-12 bg-gray-50 rounded-xl px-4 border border-gray-100 justify-center">
                <Text className="font-sans text-gray-900">{selectedSubject || 'No subjects assigned'}</Text>
              </View>
            </View>

            <View className="w-full mb-8">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs font-bold text-gray-500 uppercase font-sans">Geofence Radius</Text>
                <Text className="text-xs font-bold text-primaryOrange font-sans">{radius} meters</Text>
              </View>
              {/* Slider would go here. For now using placeholder buttons */}
              <View className="flex-row justify-between">
                {[10, 20, 50, 100].map(r => (
                  <TouchableOpacity 
                    key={r}
                    onPress={() => setRadius(r)}
                    className={`flex-1 mx-1 py-2 rounded-lg items-center ${radius === r ? 'bg-primaryOrange' : 'bg-gray-100'}`}
                  >
                    <Text className={`font-bold font-sans ${radius === r ? 'text-white' : 'text-gray-600'}`}>{r}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              className={`w-full h-14 rounded-full bg-primaryOrange items-center justify-center flex-row ${(!selectedSubject || isProcessing) ? 'opacity-50' : ''}`}
              disabled={!selectedSubject || isProcessing}
              onPress={handleStart}
            >
              {isProcessing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <MapPin color="#fff" size={20} style={{ marginRight: 8 }}  />
                  <Text className="text-white font-bold font-sans text-lg">Start Live Session</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm relative overflow-hidden">
            <View className="absolute top-0 left-0 w-full h-2 bg-green-500" />
            
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-sm font-bold text-green-600 uppercase font-sans tracking-wider mb-1">Session Active</Text>
                <Text className="text-2xl font-bold font-sans text-gray-900">{activeSession.subjectCode}</Text>
              </View>
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
                <Radio color="#15803d" size={24} />
              </View>
            </View>

            <View className="bg-gray-50 p-4 rounded-xl mb-4 flex-row justify-between border border-gray-100">
              <View>
                <Text className="text-xs text-gray-500 font-sans">Started At</Text>
                <Text className="text-base font-bold text-gray-800 font-sans">
                  {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-gray-500 font-sans">Geofence Radius</Text>
                <Text className="text-base font-bold text-gray-800 font-sans">{activeSession.geofenceRadius}m</Text>
              </View>
            </View>

            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-8 border border-blue-100 dark:border-blue-800 overflow-hidden">
              <View className="p-4 items-center">
                <View className="flex-row items-center mb-1">
                  <Key color="#3B82F6" size={16} className="mr-2" />
                  <Text className="text-xs font-bold text-blue-600 uppercase font-sans tracking-wider">Dynamic Class PIN</Text>
                </View>
                <Text className="text-5xl font-bold font-mono text-blue-900 tracking-widest my-2">
                  {activeSession.overridePin || '----'}
                </Text>
                <Text className="text-xs text-blue-500 font-sans text-center px-4">
                  Students can use this PIN to mark attendance if Wi-Fi verification fails.
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View className="h-1 bg-blue-200 w-full">
                <Animated.View style={[{ height: '100%', backgroundColor: '#2563EB' }, progressStyle]} />
              </View>
            </View>

            <TouchableOpacity 
              className="w-full h-14 rounded-full bg-red-100 items-center justify-center flex-row border border-red-200"
              disabled={isProcessing}
              onPress={handleEnd}
            >
              {isProcessing ? <ActivityIndicator color="#b91c1c" /> : (
                <>
                  <StopCircle color="#b91c1c" size={20} className="mr-2" />
                  <Text className="text-red-700 font-bold font-sans text-lg">End Class Session</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
          </SafeAreaView>
  );
}


