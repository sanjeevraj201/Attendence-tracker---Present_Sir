import { create } from 'zustand';
import { Subject, AttendanceType } from '../types/attendance.types';
import * as firestoreService from '../services/firestore.service';
import {
  addAttendanceRecord,
  changeAttendanceType,
  removeAttendanceRecords,
  removeLatestAttendanceRecord,
  shortDayForDate,
} from '../utils/attendance-records.utils';

let subjectsUnsubscribe: (() => void) | null = null;

interface SubjectsState {
  subjects: Subject[];
  isLoading: boolean;
  isSyncing: boolean;
  hasFetched: boolean;
  fetchSubjects: (uid: string, force?: boolean) => Promise<void>;
  subscribeToSubjects: (uid: string) => void;
  unsubscribeFromSubjects: () => void;
  markAttendance: (subjectId: string, type: AttendanceType, date: string, dayOfWeek: string, periodIndex: number) => boolean;
  changeAttendance: (subjectId: string, date: string, periodIndex: number, newType: AttendanceType) => boolean;
  undoLast: (subjectId: string) => boolean;
  addSubject: (code: string, name: string, faculty?: string) => void;
  editSubject: (id: string, code: string, name: string, faculty?: string) => void;
  deleteSubject: (id: string) => void;
  markODML: (subjectId: string, type: 'OD' | 'ML', dates: string[]) => boolean;
  undoODML: (subjectId: string, datesToRemove: string[]) => boolean;
  syncToFirestore: (uid: string) => Promise<void>;
  reset: () => void;
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  isLoading: false,
  isSyncing: false,
  hasFetched: false,

  fetchSubjects: async (uid, force = false) => {
    if (get().hasFetched && !force) return;
    set({ isLoading: true });
    try {
      const subjects = await firestoreService.loadSubjects(uid);
      set({ subjects, isLoading: false, hasFetched: true });
    } catch (error) {
      console.error('Failed to load subjects', error);
      set({ isLoading: false });
    }
  },

  subscribeToSubjects: (uid) => {
    // Cancel any existing subscription first
    if (subjectsUnsubscribe) {
      subjectsUnsubscribe();
      subjectsUnsubscribe = null;
    }
    subjectsUnsubscribe = firestoreService.listenToSubjects(uid, (subjects) => {
      set({ subjects });
    });
  },

  unsubscribeFromSubjects: () => {
    if (subjectsUnsubscribe) {
      subjectsUnsubscribe();
      subjectsUnsubscribe = null;
    }
  },

  markAttendance: (subjectId, type, date, dayOfWeek, periodIndex) => {
    let didChange = false;
    const subjects = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const updatedSubject = addAttendanceRecord(subject, {
        date,
        dayOfWeek,
        periodIndex,
        type,
      });
      didChange = updatedSubject !== subject;
      return updatedSubject;
    });

    if (didChange) set({ subjects });
    return didChange;
  },

  changeAttendance: (subjectId, date, periodIndex, newType) => {
    let didChange = false;
    const subjects = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const updatedSubject = changeAttendanceType(subject, date, periodIndex, newType);
      didChange = updatedSubject !== subject;
      return updatedSubject;
    });

    if (didChange) set({ subjects });
    return didChange;
  },

  undoLast: (subjectId) => {
    let didChange = false;
    const subjects = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const updatedSubject = removeLatestAttendanceRecord(subject);
      didChange = updatedSubject !== subject;
      return updatedSubject;
    });

    if (didChange) set({ subjects });
    return didChange;
  },

  addSubject: (code, name, faculty) => {
    set((state) => ({
      subjects: [...state.subjects, {
        id: Math.random().toString(36).substr(2, 9),
        code,
        name,
        faculty,
        attended: 0,
        total: 0,
        history: []
      }]
    }));
  },

  editSubject: (id, code, name, faculty) => {
    set((state) => ({
      subjects: state.subjects.map(sub => 
        sub.id === id ? { ...sub, code, name, faculty } : sub
      )
    }));
  },

  deleteSubject: (id) => {
    set((state) => ({
      subjects: state.subjects.filter(sub => sub.id !== id)
    }));
  },

  markODML: (subjectId, type, dates) => {
    let didChange = false;
    const subjects = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;

      const updatedSubject = dates.reduce(
        (currentSubject, date) => addAttendanceRecord(currentSubject, {
          date,
          dayOfWeek: shortDayForDate(date),
          periodIndex: 0,
          type,
        }),
        subject
      );
      didChange = updatedSubject !== subject;
      return updatedSubject;
    });

    if (didChange) set({ subjects });
    return didChange;
  },

  /**
   * Remove specific OD/ML history entries for given dates.
   * Called when a student withdraws a pending request within the midnight cutoff.
   */
  undoODML: (subjectId, datesToRemove) => {
    let didChange = false;
    const subjects = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject;
      const updatedSubject = removeAttendanceRecords(subject, (record) =>
        (record.type === 'OD' || record.type === 'ML') && datesToRemove.includes(record.date)
      );
      didChange = updatedSubject !== subject;
      return updatedSubject;
    });

    if (didChange) set({ subjects });
    return didChange;
  },

  syncToFirestore: async (uid) => {
    set({ isSyncing: true });
    try {
      await firestoreService.saveSubjects(uid, get().subjects);
      set({ isSyncing: false });
    } catch (error) {
      console.error('Failed to sync subjects to firestore', error);
      set({ isSyncing: false });
      throw error;
    }
  },

  reset: () => {
    const { unsubscribeFromSubjects } = get();
    unsubscribeFromSubjects();
    set({ subjects: [], isLoading: false, isSyncing: false, hasFetched: false });
  },
}));

