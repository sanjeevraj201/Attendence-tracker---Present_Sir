import { AttendanceType } from './attendance.types';

export type SessionStatus = 'ACTIVE' | 'ENDED';
export type ODMLStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClassSession {
  sessionId: string;
  facultyId: string;
  facultyName: string;
  subjectCode: string;
  subjectName: string;
  status: SessionStatus;
  geofenceLat: number;
  geofenceLng: number;
  geofenceRadius: number; // in meters
  startTime: number; // Timestamp
  endTime?: number; // Timestamp, populated when ended
  overridePin?: string; // 4-digit PIN for Wi-Fi fail-safe
}

export interface LiveAttendanceRecord {
  uid: string;
  studentName: string;
  deviceId: string;
  lat: number;
  lng: number;
  timestamp: number; // Timestamp
  attendanceType: AttendanceType;
  isFlagged: boolean;
  flagReason?: string;
}

export interface ODMLRequest {
  requestId: string;
  studentId: string;
  studentName: string;
  subjectCode: string;
  subjectName: string;
  dates: string[]; // Array of YYYY-MM-DD
  type: 'OD' | 'ML';
  reason: string;
  status: ODMLStatus;
  createdAt: number; // Timestamp
}

/**
 * Correction request: student asks faculty/admin to remove a wrongly-marked OD or ML.
 * On approval the OD/ML history entry is deleted and the slot is left unrecorded (no class).
 */
export interface AttendanceCorrectionRequest {
  requestId: string;
  studentId: string;
  studentName: string;
  subjectId: string;      // local subject id
  subjectCode: string;
  subjectName: string;
  date: string;           // YYYY-MM-DD
  currentType: 'OD' | 'ML';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;    // faculty or admin UID
}

/**
 * Immutable audit record written whenever admin/faculty manually changes a student's attendance.
 */
export interface AttendanceAuditLog {
  logId: string;
  editorId: string;       // admin or faculty UID
  editorName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectCode: string;
  date: string;           // YYYY-MM-DD
  periodIndex: number;
  previousType: string;   // AttendanceType before change
  newType: string;        // AttendanceType after change
  reason?: string;
  changedAt: number;
}

