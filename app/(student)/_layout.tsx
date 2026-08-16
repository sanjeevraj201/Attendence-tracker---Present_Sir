import { Tabs } from 'expo-router';
import { Calendar as CalendarIcon, Book, Clock, User, Hand, ShieldCheck } from 'lucide-react-native';
import { Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../src/stores/auth.store';
import { TutorialOverlay, TutorialStep } from '../../src/components/TutorialOverlay';
import { RoleGuard } from '../../src/components/RoleGuard';

const STUDENT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Present Sir!',
    description: "Let's take a quick tour of your new attendance tracker.",
    icon: <Hand color="#FF5E00" size={32} />
  },
  {
    title: 'Today\'s Schedule',
    description: 'The Today tab shows your upcoming classes. You can scan the geofence and mark your attendance here.',
    icon: <CalendarIcon color="#FF5E00" size={32} />
  },
  {
    title: 'Subjects & Attendance',
    description: 'The Subjects tab shows your overall attendance percentage and allows you to request OD or Medical leaves.',
    icon: <Book color="#FF5E00" size={32} />
  },
  {
    title: 'Timetable',
    description: 'View your weekly class schedule at a glance in the Timetable tab.',
    icon: <Clock color="#FF5E00" size={32} />
  },
  {
    title: 'Profile & Settings',
    description: 'Manage your account, change your theme, and update your profile picture in the Profile tab.',
    icon: <User color="#FF5E00" size={32} />
  }
];

export default function StudentLayout() {
  const { user, completeTutorial } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Show tutorial ONLY if explicitly set to false (meaning they are a brand new signup).
  // Existing users will default to true, bypassing the tutorial on login.
  const showTutorial = user && user.hasSeenTutorial === false;

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF5E00',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            borderTopColor: isDark ? '#1C1C1E' : '#F3F4F6',
            height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 12,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
            fontSize: 11,
            fontWeight: '700',
          },
          tabBarButton: (props: any) => (
            <Pressable
              {...props}
              android_ripple={null}
              style={props.style}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="today"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="subjects"
          options={{
            title: 'Subjects',
            tabBarIcon: ({ color, size }) => <Book color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="timetable"
          options={{
            title: 'Timetable',
            tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>

      <TutorialOverlay 
        visible={!!showTutorial} 
        steps={STUDENT_TUTORIAL_STEPS} 
        onComplete={completeTutorial} 
      />
    </RoleGuard>
  );
}

