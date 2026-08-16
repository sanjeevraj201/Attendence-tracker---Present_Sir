import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#FF5E00" />
      </View>
    );
  }
  
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role === 'PENDING_FACULTY') {
    return <Redirect href="/pending-approval" />;
  }

  if (user.role === 'STUDENT') {
    return <Redirect href="/(student)/today" />;
  }

  if (user.role === 'FACULTY') {
    return <Redirect href="/(faculty)/session" />;
  }

  if (user.role === 'ADMIN') {
    return <Redirect href="/(admin)/approvals" />;
  }

  // Fallback
  return <Redirect href="/(auth)/login" />;
}
