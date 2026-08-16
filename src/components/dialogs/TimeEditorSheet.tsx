import React, { useState, forwardRef, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import BottomSheet, { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { addMinutes, getDurationMins } from '../../utils/date.utils';
import { Check, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { BreakPromptModal } from './BreakPromptModal';

interface TimeEditorSheetProps {
  initialStartTime?: string;
  initialEndTime?: string;
  onSave: (startTime: string, endTime: string, applyToAll: boolean, breakMins: number) => void;
  onClose: () => void;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES_5 = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const AMPM = ['AM', 'PM'];
const DURATION_PRESETS = [60, 90];

const ITEM_HEIGHT = 50;

const TimeSpinner = ({
  data,
  selectedValue,
  onValueChange,
  formatLabel = (v: any) => v.toString(),
  circular = false
}: {
  data: any[];
  selectedValue: any;
  onValueChange: (v: any) => void;
  formatLabel?: (v: any) => string;
  circular?: boolean;
}) => {
  const flatListRef = useRef<FlatList>(null);
  
  const REPEAT = circular ? 100 : 1;
  const listData = useMemo(() => {
    if (!circular) return data;
    const arr = [];
    for (let i = 0; i < REPEAT; i++) {
      arr.push(...data);
    }
    return arr;
  }, [data, circular]);

  const [virtualIndex, setVirtualIndex] = useState(() => {
    const baseIdx = data.indexOf(selectedValue);
    if (baseIdx === -1) return 0;
    return circular ? (Math.floor(REPEAT / 2) * data.length + baseIdx) : baseIdx;
  });

  const currentIndexRef = useRef(virtualIndex);
  const isInternalChangeRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  // Sync external changes (e.g. initial prop changes)
  useEffect(() => {
    if (!isReady) return;
    
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const baseIdx = data.indexOf(selectedValue);
    if (baseIdx !== -1 && listData[currentIndexRef.current] !== selectedValue) {
      const newIdx = circular ? (Math.floor(REPEAT / 2) * data.length + baseIdx) : baseIdx;
      currentIndexRef.current = newIdx;
      setVirtualIndex(newIdx);
      flatListRef.current?.scrollToOffset({ offset: newIdx * ITEM_HEIGHT, animated: true });
    }
  }, [selectedValue, isReady, circular, data, listData, REPEAT]);

  const handleUp = () => {
    if (currentIndexRef.current > 0) {
      isInternalChangeRef.current = true;
      const newIdx = currentIndexRef.current - 1;
      currentIndexRef.current = newIdx;
      setVirtualIndex(newIdx);
      flatListRef.current?.scrollToOffset({ offset: newIdx * ITEM_HEIGHT, animated: true });
      onValueChange(listData[newIdx]);
    }
  };

  const handleDown = () => {
    if (currentIndexRef.current < listData.length - 1) {
      isInternalChangeRef.current = true;
      const newIdx = currentIndexRef.current + 1;
      currentIndexRef.current = newIdx;
      setVirtualIndex(newIdx);
      flatListRef.current?.scrollToOffset({ offset: newIdx * ITEM_HEIGHT, animated: true });
      onValueChange(listData[newIdx]);
    }
  };

  return (
    <View className="items-center bg-gray-50 dark:bg-oledBlack px-1 py-1 rounded-[24px] border border-black/5 dark:border-white/5">
      <TouchableOpacity onPress={handleUp} className="p-3" activeOpacity={0.5}>
        <ChevronUp color="#9CA3AF" size={28} />
      </TouchableOpacity>
      
      <View style={{ height: ITEM_HEIGHT, width: 80, overflow: 'hidden' }}>
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(_, i) => i.toString()}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
          initialScrollIndex={virtualIndex}
          onLayout={() => setIsReady(true)}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            if (listData[index] !== undefined && index !== currentIndexRef.current) {
              isInternalChangeRef.current = true;
              currentIndexRef.current = index;
              setVirtualIndex(index);
              onValueChange(listData[index]);
            }
          }}
          renderItem={({ item }) => (
            <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text className="text-[32px] font-black font-sans text-gray-900 dark:text-white tracking-tighter">
                {formatLabel(item)}
              </Text>
            </View>
          )}
        />
      </View>
      
      <TouchableOpacity onPress={handleDown} className="p-3" activeOpacity={0.5}>
        <ChevronDown color="#9CA3AF" size={28} />
      </TouchableOpacity>
    </View>
  );
};

export const TimeEditorSheet = forwardRef<BottomSheetModal, TimeEditorSheetProps>(
  ({ initialStartTime = '09:00', initialEndTime = '10:00', onSave, onClose }, ref) => {
    const snapPoints = useMemo(() => ['75%'], []);
    
    // Extracted times
    const [hour12, setHour12] = useState(() => {
      let h = parseInt(initialStartTime.split(':')[0]);
      return h % 12 || 12;
    });
    const [minute, setMinute] = useState(parseInt(initialStartTime.split(':')[1]));
    const [ampm, setAmpm] = useState(() => {
      let h = parseInt(initialStartTime.split(':')[0]);
      return h < 12 ? 'AM' : 'PM';
    });
    
    const [duration, setDuration] = useState(getDurationMins(initialStartTime, initialEndTime));
    
    const [isCustomDuration, setIsCustomDuration] = useState(false);
    const [customMins, setCustomMins] = useState('');

    const [applyToAll, setApplyToAll] = useState(false);
    const { colorScheme } = useColorScheme();
    
    const [showBreakPrompt, setShowBreakPrompt] = useState(false);

    useEffect(() => {
      let h = parseInt(initialStartTime.split(':')[0]);
      setHour12(h % 12 || 12);
      setMinute(parseInt(initialStartTime.split(':')[1]));
      setAmpm(h < 12 ? 'AM' : 'PM');
      
      const initialDur = getDurationMins(initialStartTime, initialEndTime);
      if (DURATION_PRESETS.includes(initialDur)) {
        setDuration(initialDur);
        setIsCustomDuration(false);
      } else {
        setDuration(0);
        setIsCustomDuration(true);
        setCustomMins(initialDur.toString());
      }
      
      setApplyToAll(false);
    }, [initialStartTime, initialEndTime]);

    const formatTime = (h: number, m: number) => {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleInitialSave = () => {
      setShowBreakPrompt(true);
    };

    const handleFinalSave = (breakMins: number) => {
      setShowBreakPrompt(false);
      
      // Convert 12h + AM/PM back to 24h
      let finalH = hour12 === 12 ? 0 : hour12;
      if (ampm === 'PM') finalH += 12;
      
      const startTime = formatTime(finalH, minute);
      const finalDur = isCustomDuration ? (parseInt(customMins) || 60) : duration;
      const endTime = addMinutes(startTime, finalDur);
      
      onSave(startTime, endTime, applyToAll, breakMins);
      onClose();
    };

    return (
      <>
        <BottomSheetModal
          ref={ref}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose
          onDismiss={onClose}
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
          )}
          backgroundStyle={{ backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#ffffff', borderRadius: 32 }}
          handleIndicatorStyle={{ backgroundColor: colorScheme === 'dark' ? '#3A3A3C' : '#E5E7EB', width: 48, height: 5 }}
        >
          <View className="flex-1 px-7 pt-4 pb-8">
            <Text className="text-[26px] font-black font-sans text-gray-900 dark:text-white mb-6 tracking-tight text-center">Set Class Time</Text>

            <BottomSheetScrollView showsVerticalScrollIndicator={false}>
              
              {/* TIME SPINNERS */}
              <View className="flex-row justify-center items-center mb-8">
                <View className="items-center">
                  <Text className="text-[12px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase font-sans tracking-widest">Hour</Text>
                  <TimeSpinner 
                    data={HOURS_12} 
                    selectedValue={hour12} 
                    onValueChange={setHour12} 
                    circular={true}
                  />
                </View>
                
                <Text className="text-[32px] font-black text-gray-300 dark:text-gray-600 mx-3 mt-6">:</Text>
                
                <View className="items-center">
                  <Text className="text-[12px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase font-sans tracking-widest">Minute</Text>
                  <TimeSpinner 
                    data={MINUTES_5} 
                    selectedValue={minute} 
                    onValueChange={setMinute} 
                    formatLabel={(v) => v.toString().padStart(2, '0')}
                    circular={true}
                  />
                </View>

                <View className="w-2" />
                
                <View className="items-center">
                  <Text className="text-[12px] font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase font-sans tracking-widest">AM/PM</Text>
                  <TimeSpinner 
                    data={AMPM} 
                    selectedValue={ampm} 
                    onValueChange={setAmpm} 
                    circular={false}
                  />
                </View>
              </View>

              {/* DURATION */}
              <View className="mb-8">
                <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 mb-3 ml-1 uppercase font-sans tracking-widest text-center">Class Duration</Text>
                <View className="flex-row flex-wrap justify-center gap-3 mb-3">
                  {DURATION_PRESETS.map(mins => (
                    <TouchableOpacity
                      key={`d-${mins}`}
                      onPress={() => {
                        setDuration(mins);
                        setIsCustomDuration(false);
                      }}
                      className={`px-5 py-3 rounded-full border ${
                        !isCustomDuration && duration === mins ? 'bg-primaryOrange border-primaryOrange' : 'bg-white dark:bg-oledBlack border-black/5 dark:border-white/5'
                      }`}
                    >
                      <Text className={`font-bold font-sans text-[15px] ${!isCustomDuration && duration === mins ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {mins} min
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* CUSTOM BUTTON */}
                  <TouchableOpacity
                    onPress={() => setIsCustomDuration(true)}
                    className={`px-5 py-3 rounded-full border ${
                      isCustomDuration ? 'bg-primaryOrange border-primaryOrange' : 'bg-white dark:bg-oledBlack border-black/5 dark:border-white/5'
                    }`}
                  >
                    <Text className={`font-bold font-sans text-[15px] ${isCustomDuration ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Custom input field */}
                {isCustomDuration && (
                  <View className="flex-row items-center bg-gray-50 dark:bg-oledBlack rounded-[20px] px-5 py-2 border border-black/5 dark:border-white/5 mt-2 mx-4">
                    <TextInput
                      className="flex-1 h-[48px] font-sans text-[18px] font-black tracking-wide text-gray-900 dark:text-white"
                      keyboardType="number-pad"
                      value={customMins}
                      onChangeText={setCustomMins}
                      placeholder="Enter minutes..."
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text className="font-sans text-[15px] font-bold text-gray-500 ml-2">minutes</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                className="flex-row items-center mb-8 bg-gray-50 dark:bg-oledBlack p-5 rounded-[20px] border border-black/5 dark:border-white/5 mx-2"
                onPress={() => setApplyToAll(!applyToAll)}
                activeOpacity={0.7}
              >
                <View className={`w-6 h-6 rounded-[8px] border items-center justify-center mr-4 ${applyToAll ? 'bg-primaryOrange border-primaryOrange' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-cardDark'}`}>
                  {applyToAll && <Check color="#fff" size={16} />}
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900 dark:text-white font-sans text-[15px] mb-1">Apply duration to ALL periods today</Text>
                  <Text className="text-[13px] text-gray-500 dark:text-gray-400 font-sans">Subsequent classes will be shifted automatically.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="h-[56px] rounded-full bg-primaryOrange items-center justify-center mb-10 shadow-sm mx-2"
                onPress={handleInitialSave}
                activeOpacity={0.8}
              >
                <Text className="text-white font-black font-sans text-[17px] tracking-wide">Save Time</Text>
              </TouchableOpacity>
            </BottomSheetScrollView>
          </View>
        </BottomSheetModal>
        
        <BreakPromptModal 
          visible={showBreakPrompt} 
          onCancel={() => setShowBreakPrompt(false)} 
          onSubmit={handleFinalSave} 
        />
      </>
    );
  }
);

TimeEditorSheet.displayName = 'TimeEditorSheet';
