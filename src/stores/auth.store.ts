import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUser, UserRole } from '../types/user.types';
import * as authService from '../services/auth.service';
import * as firestoreService from '../services/firestore.service';
import * as deviceService from '../services/device.service';
import { fetchSettings } from './settings.store';

interface AuthState {
  user: AppUser | null;
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role: UserRole, department?: string, staffId?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  rehydrateUser: () => Promise<void>; // Fetch full profile if only uid/role were persisted
  syncProfile: (profile: Partial<AppUser>) => void;
  completeTutorial: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      hasHydrated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { uid, role } = await authService.signIn(email, password);
          
          if (role === 'STUDENT') {
            const currentDeviceId = await deviceService.getDeviceId();
            const boundDeviceId = await firestoreService.getBoundDeviceId(uid);
            
            if (!boundDeviceId) {
              await firestoreService.bindDevice(uid, currentDeviceId);
            } else if (boundDeviceId !== currentDeviceId) {
              await authService.signOut();
              set({ isLoading: false, error: 'This account is registered to a different device. Contact admin to reset.' });
              return;
            }
          }

          const profile = await firestoreService.loadProfile(uid);
          
          fetchSettings(uid).catch(console.error);
          set({
            user: {
              uid,
              role,
              email,
              displayName: profile?.displayName || '',
              photoUrl: profile?.photoUrl,
              deviceId: profile?.deviceId,
              hasSeenTutorial: profile?.hasSeenTutorial ?? true,
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Failed to login' });
        }
      },

      register: async (email, password, displayName, role, department, staffId) => {
        set({ isLoading: true, error: null });
        try {
          const { uid } = await authService.signUp(email, password, displayName, role, department, staffId);
          
          if (role === 'STUDENT') {
            const currentDeviceId = await deviceService.getDeviceId();
            await firestoreService.bindDevice(uid, currentDeviceId);
          }

          fetchSettings(uid).catch(console.error);
          set({
            user: {
              uid,
              role,
              email,
              displayName,
              hasSeenTutorial: false,
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Failed to register' });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          const { useSubjectsStore } = require('./subjects.store');
          const { useSessionStore } = require('./session.store');
          const { useTimetableStore } = require('./timetable.store');
          
          useSubjectsStore.getState().reset();
          useSessionStore.getState().reset();
          useTimetableStore.getState().reset();
          await authService.signOut();
          set({ user: null, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Failed to logout' });
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          const { useSubjectsStore } = require('./subjects.store');
          const { useSessionStore } = require('./session.store');
          const { useTimetableStore } = require('./timetable.store');
          
          useSubjectsStore.getState().reset();
          useSessionStore.getState().reset();
          useTimetableStore.getState().reset();
          await authService.deleteAccount();
          set({ user: null, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Failed to delete account. You may need to log out and log back in first.' });
        }
      },

      clearError: () => set({ error: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      syncProfile: (profile) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, ...profile } });
        }
      },

      rehydrateUser: async () => {
        const user = get().user;
        if (user?.uid) {
          try {
            const profile = await firestoreService.loadProfile(user.uid);
            fetchSettings(user.uid).catch(console.error);
            if (profile) {
              set({ user: { ...user, ...profile, hasSeenTutorial: profile.hasSeenTutorial ?? true } });
            }
          } catch (error) {
            console.error('Failed to rehydrate user profile', error);
          }
        }
      },
      completeTutorial: async () => {
        const user = get().user;
        if (user?.uid) {
          try {
            await firestoreService.markTutorialSeen(user.uid);
            set({ user: { ...user, hasSeenTutorial: true } });
          } catch (error) {
            console.error('Failed to mark tutorial as seen', error);
          }
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user ? { uid: state.user.uid, role: state.user.role } : null 
      }), // Persist uid + role only
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

