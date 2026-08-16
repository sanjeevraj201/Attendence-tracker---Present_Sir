import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubjectsStore } from '../../src/stores/subjects.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useTimetableStore } from '../../src/stores/timetable.store';
import { SubjectCard } from '../../src/components/SubjectCard';
import { Plus, CheckCircle2, AlertTriangle, ShieldAlert, XOctagon } from 'lucide-react-native';
import { todayDateString, currentDayOfWeekShort } from '../../src/utils/date.utils';
import { SubjectFormSheet } from '../../src/components/dialogs/SubjectFormSheet';
import { CalendarActionModal } from '../../src/components/dialogs/CalendarActionModal';
import { Subject } from '../../src/types/attendance.types';
import { getAttendanceStatus, getAttendanceStatusMessage } from '../../src/utils/attendance.utils';
import { useSettingsStore } from '../../src/stores/settings.store';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { createODMLRequest, getActiveSession } from '../../src/services/firestore.service';
import { PinEntryModal } from '../../src/components/dialogs/PinEntryModal';
import { getCurrentLocation, calculateDistance } from '../../src/services/location.service';
import { submitLiveCheckIn } from '../../src/services/live-attendance.service';

// LayoutAnimation configuration is no longer needed in the New Architecture

export default function SubjectsScreen() {
  const { subjects, markAttendance, addSubject, editSubject, deleteSubject, syncToFirestore, subscribeToSubjects, unsubscribeFromSubjects } = useSubjectsStore();
  const { user } = useAuthStore();
  const { timetable, fetchTimetable } = useTimetableStore();
  const { isWifiVerificationEnabled, collegeBssid } = useSettingsStore();

  useEffect(() => {
    if (user?.uid) {
      fetchTimetable(user.uid);
      // Real-time listener: fires whenever admin/faculty changes this student's attendance
      subscribeToSubjects(user.uid);
    }
    return () => unsubscribeFromSubjects();
  }, [user?.uid]);

  // Modal state
  const [formVisible, setFormVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [activeModalType, setActiveModalType] = useState<'OD' | 'ML'>('OD');

  // PIN Override state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinIsLoading, setPinIsLoading] = useState(false);
  const [pendingPinContext, setPendingPinContext] = useState<any>(null);

  const handleAddPress = () => {
    setEditingSubject(null);
    setFormVisible(true);
  };

  const handleLongPress = (subject: Subject) => {
    setEditingSubject(subject);
    setFormVisible(true);
  };

  const handleSaveSubject = async (code: string, name: string, faculty?: string) => {
    if (editingSubject) {
      editSubject(editingSubject.id, code, name, faculty);
    } else {
      addSubject(code, name, faculty);
    }
    setFormVisible(false);
    setEditingSubject(null);
    if (user?.uid) {
      try {
        await syncToFirestore(user.uid);
      } catch (error) {
        console.error("Failed to sync subject", error);
      }
    }
  };

  const handleDeleteSubject = async () => {
    if (editingSubject) {
      deleteSubject(editingSubject.id);
      setFormVisible(false);
      setEditingSubject(null);
      if (user?.uid) {
        try {
          await syncToFirestore(user.uid);
        } catch (error) {
          console.error("Failed to sync subject deletion", error);
        }
      }
    }
  };

  const handleODMLSubmit = async (dates: string[], reason: string) => {
    if (!activeSubject || !user?.uid) return;

    await createODMLRequest({
      studentId: user.uid,
      studentName: user.displayName || 'Student',
      subjectCode: activeSubject.code,
      subjectName: activeSubject.name,
      dates,
      type: activeModalType,
      reason: reason.trim(),
    });
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

      if (user?.uid) {
        syncToFirestore(user.uid).catch(console.error);
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

  // Compute consolidated stats
  // Use the AVERAGE of per-subject percentages (not total-attended ÷ total-classes).
  // This prevents a subject with 80 classes from dominating over a subject with 10.
  const subjectsWithData = subjects.filter(s => s.total > 0);
  const consolidatedPct = subjectsWithData.length === 0
    ? -1
    : subjectsWithData.reduce((sum, s) => sum + (s.attended / s.total) * 100, 0) / subjectsWithData.length;
  const consolidatedStatus = getAttendanceStatus(consolidatedPct);
  
  const getStatusColor = (status: string) => {
    if (status === 'safe') return 'text-green-700 dark:text-green-500'; 
    if (status === 'borderline') return 'text-amber-700 dark:text-amber-500'; 
    if (status === 'severe') return 'text-rose-200 dark:text-rose-300'; 
    return 'text-red-700 dark:text-red-500'; 
  };
  const getThemeClasses = (status: string) => {
    switch (status) {
      case 'safe':
        return {
          bg: 'bg-emerald-50 dark:bg-cardDark',
          border: 'border-emerald-100 dark:border-white/5',
          label: 'text-emerald-700 dark:text-emerald-500',
          valueText: 'text-emerald-700 dark:text-white',
          iconBg: 'bg-emerald-500',
          wrapperShape: 'rounded-full' 
        };
      case 'severe':
        return {
          bg: 'bg-rose-50 dark:bg-cardDark',
          border: 'border-rose-100 dark:border-white/5',
          label: 'text-rose-700 dark:text-rose-500',
          valueText: 'text-rose-700 dark:text-white',
          iconBg: 'bg-rose-500', 
          wrapperShape: 'rounded-[16px]'
        };
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-cardDark',
          border: 'border-red-100 dark:border-white/5',
          label: 'text-red-700 dark:text-red-500',
          valueText: 'text-red-700 dark:text-white',
          iconBg: 'bg-red-500',
          wrapperShape: 'rounded-[16px]'
        };
      case 'borderline':
      default:
        return {
          bg: 'bg-amber-50 dark:bg-cardDark',
          border: 'border-amber-100 dark:border-white/5',
          label: 'text-amber-700 dark:text-amber-500',
          valueText: 'text-amber-700 dark:text-white',
          iconBg: 'bg-amber-500',
          wrapperShape: 'rounded-[20px]' 
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle2 color="#fff" size={32} strokeWidth={2.5} />;
      case 'borderline': return <AlertTriangle color="#fff" size={30} strokeWidth={2.5} />;
      case 'severe': return <XOctagon color="#fff" size={30} strokeWidth={2.5} />;
      case 'critical': 
      default: 
        return <ShieldAlert color="#fff" size={30} strokeWidth={2.5} />;
    }
  };

  const renderHeader = () => {
    if (subjects.length === 0) return null;
    
    const theme = getThemeClasses(consolidatedStatus);

    return (
      <View className={`mb-6 rounded-[20px] p-5 border ${theme.bg} ${theme.border}`}>
        <Text className={`text-[11px] font-bold font-sans tracking-wider mb-2 uppercase ${theme.label}`}>
          Consolidated Attendance
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-baseline">
            <Text className={`text-5xl font-bold font-sans tracking-tighter ${theme.valueText}`}>
              {consolidatedPct === -1 ? '-' : consolidatedPct.toFixed(2)}%
            </Text>
            {consolidatedPct !== -1 && (
              <Text className={`ml-2 text-sm font-bold font-sans ${getStatusColor(consolidatedStatus)}`}>
                {consolidatedStatus.charAt(0).toUpperCase() + consolidatedStatus.slice(1)}
              </Text>
            )}
          </View>
          
          <View className={`w-12 h-12 items-center justify-center ${theme.wrapperShape} ${theme.iconBg}`}>
            {getStatusIcon(consolidatedStatus)}
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const dayOfWeek = currentDayOfWeekShort(); // e.g., 'Mon'
    const daysMap: Record<string, string> = {
      'Sun': 'Sunday', 'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 
      'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday'
    };
    const fullDayName = daysMap[dayOfWeek];

    const scheduledSlotsToday = timetable
      .filter(slot => slot.day === fullDayName && slot.subjectId === item.id)
      .sort((a, b) => a.periodIndex - b.periodIndex);
      
    const markedRecordsToday = item.history.filter((h: any) => h.date === todayDateString());
    const markedIndicesToday = markedRecordsToday.map((h: any) => h.periodIndex);
    
    const unmarkedSlots = scheduledSlotsToday.filter(slot => !markedIndicesToday.includes(slot.periodIndex));
    
    const isLocked = unmarkedSlots.length === 0;
    const nextPeriodIndex = unmarkedSlots.length > 0 ? unmarkedSlots[0].periodIndex : 0;

    return (
      <SubjectCard 
        subject={item}
        isLocked={isLocked}
        onLongPress={() => handleLongPress(item)}
        onMarkAttendance={async (type) => {
          if (type === 'OD' || type === 'ML') {
            setActiveSubject(item);
            setActiveModalType(type);
            setModalVisible(true);
            return;
          }

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
                // Wi-Fi check failed. Fallback to PIN if active session exists.
                const activeSession = await getActiveSession(item.code);
                if (activeSession && activeSession.overridePin) {
                  setPendingPinContext({
                    subject: item,
                    type,
                    date: todayDateString(),
                    dayOfWeek,
                    periodIndex: nextPeriodIndex,
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

          const didMark = markAttendance(item.id, type, todayDateString(), dayOfWeek, nextPeriodIndex);
          if (!didMark) return;

          if (user?.uid) {
            try {
              await syncToFirestore(user.uid);
            } catch (error) {
              console.error("Failed to sync attendance", error);
            }
          }
          if (user) {
            submitLiveCheckIn({ subjectCode: item.code, user, attendanceType: type }).catch(console.error);
          }
        }}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-offWhite dark:bg-oledBlack">
              <View className="flex-1 px-5 pt-3">
          {/* Header matching the template */}
        <View className="flex-row justify-between items-start mb-8 mt-2">
          <View>
            <Text className="text-[34px] font-black font-sans text-gray-900 dark:text-white tracking-tight">Subjects</Text>
            <Text className="text-[14px] text-gray-400 dark:text-gray-500 font-sans mt-1">Long-press a card to edit</Text>
          </View>
          <TouchableOpacity 
            className="h-10 px-5 bg-primaryOrange rounded-full flex-row items-center justify-center shadow-sm"
            onPress={handleAddPress}
          >
            <Plus color="#fff" size={18} style={{ marginRight: 6 }}  />
            <Text className="text-white font-sans font-bold text-[15px]">Add</Text>
          </TouchableOpacity>
        </View>

        {subjects.length === 0 ? (
          <View className="flex-1 items-center justify-center pb-20">
            <Text className="text-gray-500 dark:text-gray-400 font-sans text-center px-8">
              You haven't added any subjects yet. Tap the + Add button to get started.
            </Text>
          </View>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
      
      <SubjectFormSheet
        visible={formVisible}
        isEditing={!!editingSubject}
        initialCode={editingSubject?.code}
        initialName={editingSubject?.name}
        initialFaculty={editingSubject?.faculty}
        onSave={handleSaveSubject}
        onDelete={handleDeleteSubject}
        onClose={() => {
          setFormVisible(false);
          setEditingSubject(null);
        }}
      />

      <CalendarActionModal
        visible={modalVisible}
        subject={activeSubject}
        type={activeModalType}
        onClose={() => setModalVisible(false)}
        onSubmit={handleODMLSubmit}
      />

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
