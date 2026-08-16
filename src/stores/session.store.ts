import { create } from 'zustand';
import { ClassSession, LiveAttendanceRecord } from '../types/session.types';
import * as firestoreService from '../services/firestore.service';
import * as locationService from '../services/location.service';
import { Unsubscribe } from 'firebase/firestore';
import { useAuthStore } from './auth.store';

interface SessionState {
  activeSession: ClassSession | null;
  liveRecords: LiveAttendanceRecord[];
  isProcessing: boolean;
  listenerUnsubscribe: Unsubscribe | null;
  startSession: (subjectCode: string, subjectName: string, geofenceRadius: number) => Promise<void>;
  endSession: () => Promise<void>;
  restoreActiveSession: () => Promise<void>;
  listenToRecords: (subjectCode: string) => void;
  flagStudent: (studentUid: string, reason: string) => Promise<void>;
  updateSessionPin: (newPin: string) => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  liveRecords: [],
  isProcessing: false,
  listenerUnsubscribe: null,

  startSession: async (subjectCode, subjectName, geofenceRadius) => {
    set({ isProcessing: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Not authenticated");

      const location = await locationService.getCurrentLocation();
      if (!location) throw new Error("Location permission denied or unavailable");

      const session: ClassSession = {
        sessionId: Math.random().toString(36).substr(2, 9),
        facultyId: user.uid,
        facultyName: user.displayName,
        subjectCode,
        subjectName,
        status: 'ACTIVE',
        geofenceLat: location.lat,
        geofenceLng: location.lng,
        geofenceRadius,
        startTime: Date.now(),
        overridePin: Math.floor(1000 + Math.random() * 9000).toString(),
      };

      await firestoreService.startSession(session);
      
      set({ activeSession: session, isProcessing: false });
      
      // Start listening to incoming records
      get().listenToRecords(subjectCode);
      
    } catch (error) {
      console.error('Failed to start session', error);
      set({ isProcessing: false });
      throw error;
    }
  },

  endSession: async () => {
    const { activeSession, listenerUnsubscribe } = get();
    if (!activeSession) return;

    set({ isProcessing: true });
    try {
      await firestoreService.endSession(activeSession.subjectCode);
      
      if (listenerUnsubscribe) {
        listenerUnsubscribe();
      }

      set({ activeSession: null, liveRecords: [], isProcessing: false, listenerUnsubscribe: null });
    } catch (error) {
      console.error('Failed to end session', error);
      set({ isProcessing: false });
      throw error;
    }
  },

  restoreActiveSession: async () => {
    if (get().activeSession) return;

    const user = useAuthStore.getState().user;
    if (!user || user.role !== 'FACULTY') return;

    try {
      const session = await firestoreService.getActiveSessionForFaculty(user.uid);
      if (!session) return;

      set({ activeSession: session });
      get().listenToRecords(session.subjectCode);
    } catch (error) {
      console.error('Failed to restore active session', error);
    }
  },

  listenToRecords: (subjectCode) => {
    const { listenerUnsubscribe } = get();
    if (listenerUnsubscribe) {
      listenerUnsubscribe();
    }

    const unsubscribe = firestoreService.listenToSessionRecords(subjectCode, (records) => {
      set({ liveRecords: records });
    });

    set({ listenerUnsubscribe: unsubscribe });
  },

  flagStudent: async (studentUid, reason) => {
    const { activeSession } = get();
    if (!activeSession) return;

    try {
      await firestoreService.flagRecord(activeSession.subjectCode, studentUid, reason);
      // Local state will update via the listener automatically
    } catch (error) {
      console.error('Failed to flag student', error);
      throw error;
    }
  },

  updateSessionPin: async (newPin) => {
    const { activeSession } = get();
    if (!activeSession) return;
    
    try {
      await firestoreService.updateSessionPin(activeSession.subjectCode, newPin);
      set({ activeSession: { ...activeSession, overridePin: newPin } });
    } catch (error) {
      console.error('Failed to update session PIN', error);
    }
  },

  reset: () => {
    const { listenerUnsubscribe } = get();
    if (listenerUnsubscribe) {
      listenerUnsubscribe();
    }
    set({ activeSession: null, liveRecords: [], isProcessing: false, listenerUnsubscribe: null });
  }
}));
