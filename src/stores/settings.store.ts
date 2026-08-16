import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  isWifiVerificationEnabled: boolean;
  collegeBssid: string | null;
  collegeWifiName: string | null;
  setIsWifiVerificationEnabled: (enabled: boolean) => void;
  setCollegeBssid: (bssid: string | null, name?: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isWifiVerificationEnabled: false, // Default to false so it doesn't break existing users immediately
      collegeBssid: null,
      collegeWifiName: null,
      setIsWifiVerificationEnabled: (enabled) => set({ isWifiVerificationEnabled: enabled }),
      setCollegeBssid: (bssid, name) => set({ collegeBssid: bssid, collegeWifiName: name || null }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { auth } from '../../lib/firebase';
import * as firestoreService from '../services/firestore.service';

export const fetchSettings = async (uid: string) => {
  const data = await firestoreService.loadSettings(uid);
  if (data) {
    useSettingsStore.setState({
      isWifiVerificationEnabled: data.isWifiVerificationEnabled ?? false,
      collegeBssid: data.collegeBssid ?? null,
      collegeWifiName: data.collegeWifiName ?? null
    });
  }
};

useSettingsStore.subscribe((state, prevState) => {
  if (
    state.isWifiVerificationEnabled !== prevState.isWifiVerificationEnabled ||
    state.collegeBssid !== prevState.collegeBssid ||
    state.collegeWifiName !== prevState.collegeWifiName
  ) {
    const uid = auth.currentUser?.uid;
    if (uid) {
      firestoreService.saveSettings(uid, {
        isWifiVerificationEnabled: state.isWifiVerificationEnabled,
        collegeBssid: state.collegeBssid,
        collegeWifiName: state.collegeWifiName
      }).catch(console.error);
    }
  }
});
