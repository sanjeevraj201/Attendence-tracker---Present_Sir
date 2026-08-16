export type UserRole = 'STUDENT' | 'FACULTY' | 'PENDING_FACULTY' | 'ADMIN';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  deviceId?: string; // Used for students to bind account to device
  hasSeenTutorial?: boolean;
  staffId?: string;
  department?: string;
}

export interface PendingFaculty {
  uid: string;
  email: string;
  displayName: string;
  department: string;
  staffId: string;
  createdAt: number; // Timestamp
}

