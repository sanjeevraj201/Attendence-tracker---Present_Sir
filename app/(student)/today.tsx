import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { useSubjectsStore } from '../../src/stores/subjects.store';
import { useTimetableStore } from '../../src/stores/timetable.store';
import { PeriodCard } from '../../src/components/PeriodCard';
import { AttendanceBadge } from '../../src/components/AttendanceBadge';
import { currentDayOfWeekShort, todayDateString } from '../../src/utils/date.utils';
import { isMarkedOnDate } from '../../src/utils/subject.utils';
import { AttendanceType, Subject } from '../../src/types/attendance.types';
import { useSettingsStore } from '../../src/stores/settings.store';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { getActiveSession } from '../../src/services/firestore.service';
import { PinEntryModal } from '../../src/components/dialogs/PinEntryModal';
import { getCurrentLocation, calculateDistance } from '../../src/services/location.service';
import { submitLiveCheckIn } from '../../src/services/live-attendance.service';

export default function TodayScreen() {
  const user = useAuthStore(state => state.user);
  const uid = user?.uid;
  const { subjects, fetchSubjects, markAttendance, changeAttendance, syncToFirestore } = useSubjectsStore();
    const { timetable, fetchTimetable, isLoading: isTimetableLoading } = useTimetableStore();
  const { isWifiVerificationEnabled, collegeBssid } = useSettingsStore();
  
  const netInfo = useNetInfo();
  const [isWifiValid, setIsWifiValid] = useState(false);

  useEffect(() => {
    if (isWifiVerificationEnabled) {
      Location.requestForegroundPermissionsAsync();
    }
  }, [isWifiVerificationEnabled]);

  useEffect(() => {
    if (!isWifiVerificationEnabled) {
      setIsWifiValid(true);
      return;
    }
    if (netInfo.type === 'wifi' && netInfo.details && (netInfo.details as any).bssid) {
      const currentBssid = ((netInfo.details as any).bssid as string).toLowerCase();
      setIsWifiValid(currentBssid === collegeBssid?.toLowerCase());
    } else {
      setIsWifiValid(false);
    }
  }, [isWifiVerificationEnabled, collegeBssid, netInfo]);

  const [refreshing, setRefreshing] = useState(false);

  // PIN Override state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinIsLoading, setPinIsLoading] = useState(false);
  const [pendingPinContext, setPendingPinContext] = useState<any>(null);

  useEffect(() => {
    if (uid) {
      fetchSubjects(uid);
      fetchTimetable(uid);
    }
  }, [uid]);

  const onRefresh = async () => {
    if (!uid) return;
    setRefreshing(true);
    await Promise.all([fetchSubjects(uid, true), fetchTimetable(uid, true)]);
    setRefreshing(false);
  };

  const dayOfWeek = currentDayOfWeekShort(); // e.g., 'Mon'
  // Map short day to long day for matching timetable if timetable uses long names
  // Assuming timetable uses full names 'Monday', 'Tuesday', etc.
  const daysMap: Record<string, string> = {
    'Sun': 'Sunday', 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 
    'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday'
  };
  const fullDayName = daysMap[dayOfWeek];

  const todaySlots = timetable
    .filter(slot => slot.day === fullDayName)
    .sort((a, b) => a.periodIndex - b.periodIndex);

  const subjectsWithData = subjects.filter(s => s.total > 0);
  const overallPct = subjectsWithData.length === 0 
    ? null 
    : Number((subjectsWithData.reduce((acc, sub) => acc + (sub.attended / sub.total) * 100, 0) / subjectsWithData.length).toFixed(2));

  const handleMark = async (subject: Subject, type: AttendanceType, periodIndex: number) => {
    if (type === 'PRESENT' && isWifiVerificationEnabled && collegeBssid) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Location permission is required to verify you are on campus.');
          return;
        }

        const netInfo = await NetInfo.fetch();
        if (netInfo.type !== 'wifi' || !netInfo.details) {
          Alert.alert('Verification Failed', 'You must be connected to the campus Wi-Fi network to mark yourself present.');
          return;
        }

        const currentBssid = (netInfo.details as any).bssid;
        if (currentBssid !== collegeBssid) {
          const activeSession = await getActiveSession(subject.code);
          if (activeSession && activeSession.overridePin) {
            setPendingPinContext({
              subject,
              type,
              date: todayDateString(),
              dayOfWeek,
              periodIndex,
              activeSession
            });
            setPinModalVisible(true);
            return;
          } else {
            Alert.alert('Verification Failed', 'You are not connected to the correct campus Wi-Fi network.');
            return;
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to verify Wi-Fi connection.');
        return;
      }
    }

    const didMark = markAttendance(subject.id, type, todayDateString(), dayOfWeek, periodIndex);
    if (!didMark) return;

    if (uid) {
      syncToFirestore(uid).catch(console.error);
    }
    if (user) {
      submitLiveCheckIn({ subjectCode: subject.code, user, attendanceType: type }).catch(console.error);
    }
  };

  const handlePinSubmit = async (enteredPin: string) => {
    if (!pendingPinContext) return;
    setPinIsLoading(true);
    try {
      if (enteredPin !== pendingPinContext.activeSession.overridePin) {
        throw new Error('Incorrect Class PIN');
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission is required for verification.');
      }

      const userLoc = await getCurrentLocation();
      if (!userLoc) {
        throw new Error('Could not get your location.');
      }

      const distance = calculateDistance(
        userLoc.lat, userLoc.lng, 
        pendingPinContext.activeSession.geofenceLat, pendingPinContext.activeSession.geofenceLng
      );

      if (distance > pendingPinContext.activeSession.geofenceRadius) {
        throw new Error('You are outside the classroom geofence.');
      }

      const didMark = markAttendance(
        pendingPinContext.subject.id, 
        pendingPinContext.type, 
        pendingPinContext.date, 
        pendingPinContext.dayOfWeek, 
        pendingPinContext.periodIndex
      );

      if (!didMark) {
        setPinModalVisible(false);
        setPendingPinContext(null);
        return;
      }

      if (uid) {
        syncToFirestore(uid).catch(console.error);
      }
      if (user) {
        submitLiveCheckIn({
          subjectCode: pendingPinContext.subject.code,
          user,
          attendanceType: pendingPinContext.type,
          location: userLoc,
        }).catch(console.error);
      }

      setPinModalVisible(false);
      setPendingPinContext(null);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'An error occurred.');
    } finally {
      setPinIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-offWhite dark:bg-oledBlack">
              <ScrollView 
          className="flex-1 px-5 pt-3"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5E00" />}
      >
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-1 mr-4">
            <Text className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase font-sans tracking-widest mb-1.5">Today's Schedule</Text>
            <Text className="text-[34px] font-black font-sans text-gray-900 dark:text-white mb-3 tracking-tight">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
            </Text>
            <View className="flex-row items-center">
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} className="w-8 h-8 rounded-full mr-3 bg-gray-200" />
              ) : (
                <View className="w-8 h-8 rounded-full mr-3 bg-primaryOrange/10 items-center justify-center border border-primaryOrange/20">
                  <Text className="text-primaryOrange font-bold text-sm">{user?.displayName?.charAt(0) || 'S'}</Text>
                </View>
              )}
              <Text className="text-[17px] font-bold font-sans text-gray-900 dark:text-gray-300">Hi, {user?.displayName || 'Student'}</Text>
            </View>
          </View>
          <View className="min-w-[100px] flex-shrink-0">
            <AttendanceBadge percentage={overallPct} />
          </View>
        </View>

        {isTimetableLoading ? (
          <ActivityIndicator color="#FF5E00" size="large" className="mt-10" />
        ) : todaySlots.length === 0 ? (
          <View className="bg-white dark:bg-cardDark rounded-[24px] p-8 items-center border border-black/5 dark:border-white/5 mt-4 shadow-sm dark:shadow-none">
            <Text className="text-5xl mb-5">🎉</Text>
            <Text className="text-[22px] font-black text-gray-900 dark:text-white font-sans mb-2 text-center tracking-tight">No classes today!</Text>
            <Text className="text-[15px] text-gray-500 dark:text-gray-400 font-sans text-center leading-6">Enjoy your day off or use this time to catch up on assignments.</Text>
          </View>
        ) : (
          <View className="pb-10">
            {todaySlots.map(slot => {
              const subject = subjects.find(s => s.id === slot.subjectId);
              
              let markedType: AttendanceType | undefined;
              if (subject) {
                const historyRecord = subject.history.find(h => 
                  h.date === todayDateString() && h.periodIndex === slot.periodIndex
                );
                if (historyRecord) {
                  markedType = historyRecord.type;
                }
              }

              return (
                <PeriodCard 
                    key={slot.id}
                    slot={slot}
                    subject={subject}
                    markedType={markedType}
                    isWifiValid={isWifiValid}
                    isWifiVerificationEnabled={isWifiVerificationEnabled}
                    onMarkAttendance={(type) => {
                      if (subject) handleMark(subject, type, slot.periodIndex);
                    }}
                    onChangeAttendance={(type) => {
                      if (subject) {
                        const didChange = changeAttendance(subject.id, todayDateString(), slot.periodIndex, type);
                        if (didChange && uid) {
                          syncToFirestore(uid).catch(console.error);
                        }
                      }
                    }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <PinEntryModal 
        visible={pinModalVisible}
        onClose={() => {
          setPinModalVisible(false);
          setPendingPinContext(null);
        }}
        onSubmit={handlePinSubmit}
        isLoading={pinIsLoading}
      />
          </SafeAreaView>
  );
}
