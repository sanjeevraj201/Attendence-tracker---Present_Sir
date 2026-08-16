import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../stores/auth.store';
import { UserRole } from '../types/user.types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

/**
 * Keeps role-specific route groups from rendering while persisted auth is still
 * loading or when a user reaches a route for a different role.
 *
 * Firebase Security Rules must still enforce the same authorization server-side.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-offWhite dark:bg-oledBlack">
        <ActivityIndicator color="#FF5E00" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}
