import { create } from 'zustand';
import { auth } from '../../lib/firebase';
import { TimetableSlot } from '../types/attendance.types';
import * as firestoreService from '../services/firestore.service';
import { addMinutes, getDurationMins } from '../utils/date.utils';

interface TimetableState {
  timetable: TimetableSlot[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchTimetable: (uid: string, force?: boolean) => Promise<void>;
  addSlot: (day: string, startTime: string, endTime: string) => void;
  removeSlot: (id: string) => void;
  assignSubject: (slotId: string, subjectId?: string) => void;
  assignBreak: (slotId: string, title: string) => void;
  setSlotTime: (slotId: string, startTime: string, endTime: string, applyToAllToday?: boolean, breakMins?: number) => void;
  reorderSlots: (day: string, orderedIds: string[]) => void;
  syncToFirestore: () => Promise<void>;
  reset: () => void;
}

export const useTimetableStore = create<TimetableState>((set, get) => ({
  timetable: [],
  isLoading: false,
  hasFetched: false,

  fetchTimetable: async (uid, force = false) => {
    if (get().hasFetched && !force) return;
    set({ isLoading: true });
    try {
      const timetable = await firestoreService.loadTimetable(uid);
      set({ timetable, isLoading: false, hasFetched: true });
    } catch (error) {
      console.error('Failed to load timetable', error);
      set({ isLoading: false });
    }
  },

  addSlot: (day, startTime, endTime) => {
    set((state) => {
      const daySlots = state.timetable.filter(s => s.day === day);
      const periodIndex = daySlots.length > 0 ? Math.max(...daySlots.map(s => s.periodIndex)) + 1 : 0;
      
      const newSlot: TimetableSlot = {
        id: Math.random().toString(36).substr(2, 9),
        day,
        periodIndex,
        isBreak: false,
        startTime,
        endTime
      };
      
      return { timetable: [...state.timetable, newSlot] };
    });
    get().syncToFirestore();
  },

  removeSlot: (id) => {
    set((state) => ({
      timetable: state.timetable.filter(s => s.id !== id)
    }));
    get().syncToFirestore();
  },

  assignSubject: (slotId, subjectId) => {
    set((state) => ({
      timetable: state.timetable.map(s => 
        s.id === slotId ? { ...s, subjectId, isBreak: !subjectId, title: undefined } : s
      )
    }));
    get().syncToFirestore();
  },

  assignBreak: (slotId, title) => {
    set((state) => ({
      timetable: state.timetable.map(s => 
        s.id === slotId ? { ...s, subjectId: undefined, isBreak: true, title } : s
      )
    }));
    get().syncToFirestore();
  },

  setSlotTime: (slotId, startTime, endTime, applyToAllToday = false, breakMins = 0) => {
    set((state) => {
      const slot = state.timetable.find(s => s.id === slotId);
      if (!slot) return state;

      const newDurationMins = getDurationMins(startTime, endTime);
      let newTimetable = [...state.timetable];
      
      const daySlots = newTimetable
         .filter(s => s.day === slot.day)
         .sort((a, b) => a.periodIndex - b.periodIndex);
         
      const targetIndex = daySlots.findIndex(s => s.id === slotId);
      if (targetIndex === -1) return state;
      
      daySlots[targetIndex] = { ...daySlots[targetIndex], startTime, endTime };
      
      let currentExpectedStart = addMinutes(endTime, breakMins);
      
      const minutesBetween = (from: string, to: string) => {
        const [fh, fm] = from.split(':').map(Number);
        const [th, tm] = to.split(':').map(Number);
        return (th * 60 + tm) - (fh * 60 + fm);
      };
      
      for (let i = targetIndex + 1; i < daySlots.length; i++) {
         const currentSlot = daySlots[i];
         const prevOriginalSlot = state.timetable.find(s => s.id === daySlots[i - 1].id)!;
         const originalGap = Math.max(0, minutesBetween(prevOriginalSlot.endTime, currentSlot.startTime));
         
         if (i > targetIndex + 1) {
             currentExpectedStart = addMinutes(daySlots[i - 1].endTime, originalGap);
         }
         
         const duration = applyToAllToday ? newDurationMins : getDurationMins(currentSlot.startTime, currentSlot.endTime);
         
         let finalStartTime = currentSlot.startTime;
         
         if (applyToAllToday || breakMins > 0) {
             finalStartTime = currentExpectedStart;
         } else {
             const overlap = minutesBetween(finalStartTime, currentExpectedStart);
             if (overlap > 0) {
                 finalStartTime = currentExpectedStart;
             }
         }
         
         const finalEndTime = addMinutes(finalStartTime, duration);
         daySlots[i] = { ...currentSlot, startTime: finalStartTime, endTime: finalEndTime };
         currentExpectedStart = finalEndTime;
      }
      
      newTimetable = newTimetable.map(s => {
          const updated = daySlots.find(ds => ds.id === s.id);
          return updated ? updated : s;
      });

      return { timetable: newTimetable };
    });
    get().syncToFirestore();
  },

  reorderSlots: (day, orderedIds) => {
    set((state) => {
      const daySlots = state.timetable.filter(s => s.day === day);
      const otherSlots = state.timetable.filter(s => s.day !== day);
      
      // Assign new periodIndex based on the orderedIds
      const reorderedDaySlots = orderedIds.map((id, index) => {
        const slot = daySlots.find(s => s.id === id);
        return slot ? { ...slot, periodIndex: index } : null;
      }).filter((s): s is TimetableSlot => s !== null);

      return { timetable: [...otherSlots, ...reorderedDaySlots] };
    });
    get().syncToFirestore();
  },

  syncToFirestore: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      // JSON.stringify strips out 'undefined' values which Firestore rejects
      const cleanTimetable = JSON.parse(JSON.stringify(get().timetable));
      await firestoreService.saveTimetable(uid, cleanTimetable);
    } catch (error) {
      console.error('Failed to sync timetable to firestore', error);
      // Removed throw error to prevent unhandled promise rejections on background syncs
    }
  },

  reset: () => {
    set({ timetable: [], isLoading: false, hasFetched: false });
  }
}));

