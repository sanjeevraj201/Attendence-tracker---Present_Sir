import { create } from 'zustand';
import { AppUser } from '../types/user.types';
import { Subject } from '../types/attendance.types';
import * as firestoreService from '../services/firestore.service';

export type SubjectGroup = { code: string; name: string; students: AppUser[] };

interface AdminState {
  students: AppUser[];
  subjectsMap: Record<string, SubjectGroup>;
  allStudentSubjects: Record<string, Subject[]>;
  isLoading: boolean;
  hasFetched: boolean;
  
  loadAllData: (force?: boolean) => Promise<void>;
  updateStudentSubjectLocally: (studentId: string, updatedSubjects: Subject[]) => void;
  reset: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  students: [],
  subjectsMap: {},
  allStudentSubjects: {},
  isLoading: false,
  hasFetched: false,

  loadAllData: async (force = false) => {
    if (get().hasFetched && !force) return;
    
    set({ isLoading: true });
    try {
      const data = await firestoreService.getAllStudents();
      
      const studentSubjectsDict: Record<string, Subject[]> = {};
      const sMap: Record<string, SubjectGroup> = {};

      await Promise.all(data.map(async (s) => {
        const subs = await firestoreService.loadSubjects(s.uid);
        studentSubjectsDict[s.uid] = subs;

        subs.forEach(sub => {
          if (!sMap[sub.code]) {
            sMap[sub.code] = { code: sub.code, name: sub.name, students: [] };
          }
          if (!sMap[sub.code].students.find(existing => existing.uid === s.uid)) {
            sMap[sub.code].students.push(s);
          }
        });
      }));

      set({
        students: data,
        subjectsMap: sMap,
        allStudentSubjects: studentSubjectsDict,
        isLoading: false,
        hasFetched: true
      });

    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  updateStudentSubjectLocally: (studentId: string, updatedSubjects: Subject[]) => {
    set((state) => ({
      allStudentSubjects: {
        ...state.allStudentSubjects,
        [studentId]: updatedSubjects
      }
    }));
  },

  reset: () => {
    set({
      students: [],
      subjectsMap: {},
      allStudentSubjects: {},
      isLoading: false,
      hasFetched: false
    });
  }
}));
