import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSessionStore } from '../../src/stores/session.store';
import { AlertTriangle, UserCheck } from 'lucide-react-native';
import { LiveAttendanceRecord } from '../../src/types/session.types';

export default function RadarScreen() {
  const { activeSession, liveRecords } = useSessionStore();

  const renderItem = ({ item }: { item: LiveAttendanceRecord }) => (
    <View className={`bg-white p-4 rounded-2xl mb-3 border shadow-sm flex-row items-center ${item.isFlagged ? 'border-red-300 bg-red-50' : 'border-cardBorder'}`}>
      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${item.isFlagged ? 'bg-red-200' : 'bg-green-100'}`}>
        {item.isFlagged ? <AlertTriangle color="#b91c1c" size={20} /> : <UserCheck color="#15803d" size={20} />}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-base text-gray-900 font-sans">{item.studentName}</Text>
        <Text className="text-xs text-gray-500 font-sans">
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.attendanceType}
        </Text>
        {item.isFlagged && (
          <Text className="text-xs text-red-600 font-sans mt-1 font-bold">{item.flagReason}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
              <View className="flex-1 px-4 pt-2">
          <Text className="text-3xl font-bold font-sans text-gray-900 mb-2">Radar</Text>
        <Text className="text-base text-gray-500 font-sans mb-6">Live attendance records from your students.</Text>

        {!activeSession ? (
          <View className="flex-1 items-center justify-center pb-20">
            <Text className="text-gray-500 font-sans text-center px-8">
              No active session. Start a session to see live records here.
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex-row items-center justify-between">
              <Text className="font-bold text-blue-800 font-sans">Total Present</Text>
              <Text className="font-bold text-xl text-blue-900 font-sans">{liveRecords.length}</Text>
            </View>
            <FlatList
              data={[...liveRecords].sort((a, b) => b.timestamp - a.timestamp)}
              keyExtractor={item => item.uid}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        )}
      </View>
          </SafeAreaView>
  );
}
