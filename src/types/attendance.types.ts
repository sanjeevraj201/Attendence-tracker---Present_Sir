export type AttendanceType = 'PRESENT' | 'ABSENT' | 'OD' | 'ML';

export interface AttendanceSnapshot {
  date: string; // ISO format YYYY-MM-DD
  dayOfWeek: string;
  periodIndex: number;
  type: AttendanceType;
  recordedAt: number; // Timestamp
  attended: number; // State at this snapshot
  total: number; // State at this snapshot
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  faculty?: string;
  period?: string; // e.g., 'Even Semester 2026'
  attended: number;
  total: number;
  history: AttendanceSnapshot[];
}

export interface TimetableSlot {
  id: string;
  day: string; // e.g., 'Monday'
  periodIndex: number;
  subjectId?: string; // Optional if it's a break or unassigned
  isBreak: boolean;
  title?: string; // e.g., 'Lunch Break'
  startTime: string; // 'HH:mm' 24h format
  endTime: string; // 'HH:mm' 24h format
}
