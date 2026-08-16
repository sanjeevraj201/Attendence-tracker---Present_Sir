import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Radio, Users, Inbox, User, Hand } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { TutorialOverlay, TutorialStep } from '../../src/components/TutorialOverlay';
import { RoleGuard } from '../../src/components/RoleGuard';
import { useSessionStore } from '../../src/stores/session.store';

import { useColorScheme } from 'nativewind';

const FACULTY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Present Sir!',
    description: "Let's take a quick tour of your new faculty dashboard.",
    icon: <Hand color="#FF5E00" size={32} />
  },
  {
    title: 'Manage Sessions',
    description: 'The Session tab is where you start live classes and configure geofence radius for student check-ins.',
    icon: <Radio color="#FF5E00" size={32} />
  },
  {
    title: 'Radar View',
    description: 'The Radar tab gives you a real-time view of students marking attendance during an active session.',
    icon: <Users color="#FF5E00" size={32} />
  },
  {
    title: 'Inbox & Approvals',
    description: 'The Inbox tab is where you can review and approve student attendance correction requests.',
    icon: <Inbox color="#FF5E00" size={32} />
  },
  {
    title: 'Profile',
    description: 'Manage your settings and log out from the Profile tab.',
    icon: <User color="#FF5E00" size={32} />
  }
];

export default function FacultyLayout() {
  const { user, completeTutorial } = useAuthStore();
  const restoreActiveSession = useSessionStore(state => state.restoreActiveSession);
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Show tutorial ONLY if explicitly set to false (meaning they are a brand new signup).
  const showTutorial = user && user.hasSeenTutorial === false;

  useEffect(() => {
    if (user?.role === 'FACULTY') {
      restoreActiveSession();
    }
  }, [user?.role, restoreActiveSession]);

  return (
    <RoleGuard allowedRoles={['FACULTY']}>
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
          }
        }}
      >
        <Tabs.Screen
          name="session"
          options={{
            title: 'Session',
            tabBarIcon: ({ color, size }) => <Radio color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="radar"
          options={{
            title: 'Radar',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Inbox',
            tabBarIcon: ({ color, size }) => <Inbox color={color} size={size} />,
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
        steps={FACULTY_TUTORIAL_STEPS} 
        onComplete={completeTutorial} 
      />
    </RoleGuard>
  );
}
