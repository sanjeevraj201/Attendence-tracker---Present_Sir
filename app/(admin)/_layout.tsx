import { Tabs } from 'expo-router';
import { UserCheck, FileEdit, AlertCircle, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { RoleGuard } from '../../src/components/RoleGuard';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
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
        name="attendance-editor"
        options={{
          title: 'Editor',
          tabBarIcon: ({ color, size }) => <FileEdit color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="correction-requests"
        options={{
          title: 'Corrections',
          tabBarIcon: ({ color, size }) => <AlertCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} />,
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
    </RoleGuard>
  );
}
