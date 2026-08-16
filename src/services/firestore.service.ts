import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, Unsubscribe, deleteDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { Subject, TimetableSlot, AttendanceType } from '../types/attendance.types';
import { AppUser, UserRole, PendingFaculty } from '../types/user.types';
import { ClassSession, LiveAttendanceRecord, ODMLRequest, ODMLStatus, AttendanceCorrectionRequest, AttendanceAuditLog } from '../types/session.types';
import {
  addAttendanceRecord,
  removeAttendanceRecords,
  shortDayForDate,
  upsertAttendanceRecord,
} from '../utils/attendance-records.utils';

export const loadSubjects = async (uid: string): Promise<Subject[]> => {
  const docRef = doc(firestore, `users/${uid}/data/subjects`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data().subjects || []) : [];
};

/**
 * Real-time listener for a student's subjects. Calls `onUpdate` whenever Firestore
 * changes — used so admin/faculty corrections are reflected instantly on the student's
 * dashboard without requiring an app restart.
 */
export const listenToSubjects = (
  uid: string,
  onUpdate: (subjects: Subject[]) => void
): Unsubscribe => {
  const docRef = doc(firestore, `users/${uid}/data/subjects`);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate((snapshot.data().subjects || []) as Subject[]);
    }
  });
};

export const saveSubjects = async (uid: string, subjects: Subject[]): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}/data/subjects`);
  await setDoc(docRef, { subjects }, { merge: true });
};

export const loadTimetable = async (uid: string): Promise<TimetableSlot[]> => {
  const docRef = doc(firestore, `users/${uid}/data/timetable`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data().timetable || []) : [];
};

export const saveTimetable = async (uid: string, timetable: TimetableSlot[]): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}/data/timetable`);
  await setDoc(docRef, { timetable }, { merge: true });
};

export const loadProfile = async (uid: string): Promise<Partial<AppUser> | null> => {
  const docRef = doc(firestore, `users/${uid}`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as Partial<AppUser>) : null;
};

export const saveProfile = async (uid: string, displayName: string, photoUrl?: string): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}`);
  await updateDoc(docRef, { displayName, photoUrl });
};

export const listenToProfile = (
  uid: string,
  onUpdate: (profile: Partial<AppUser>) => void,
  onDeleted: () => void,
  onError: (err: any) => void
): Unsubscribe => {
  const docRef = doc(firestore, `users/${uid}`);
  return onSnapshot(docRef, (snapshot) => {
    if (!snapshot.exists()) {
      onDeleted();
      return;
    }
    onUpdate(snapshot.data() as Partial<AppUser>);
  }, onError);
};

export const markTutorialSeen = async (uid: string): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}`);
  await updateDoc(docRef, { hasSeenTutorial: true });
};

export const getUserRole = async (uid: string): Promise<UserRole> => {
  const docRef = doc(firestore, `users/${uid}`);
  const snapshot = await getDoc(docRef);
  return (snapshot.exists() && snapshot.data().role) ? snapshot.data().role : 'STUDENT';
};

export const setUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}`);
  await updateDoc(docRef, { role });
};

export const getBoundDeviceId = async (uid: string): Promise<string | undefined> => {
  const docRef = doc(firestore, `users/${uid}`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data().deviceId : undefined;
};

export const bindDevice = async (uid: string, deviceId: string): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}`);
  await setDoc(docRef, { deviceId }, { merge: true });
};

export const registerFaculty = async (uid: string, displayName: string, email: string, department: string, staffId: string): Promise<void> => {
  const docRef = doc(firestore, `pendingFaculty/${uid}`);
  await setDoc(docRef, {
    uid,
    displayName,
    email,
    department,
    staffId,
    createdAt: Date.now()
  });
};

export const getPendingFaculty = async (): Promise<PendingFaculty[]> => {
  const colRef = collection(firestore, 'pendingFaculty');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => doc.data() as PendingFaculty);
};

export const approveFaculty = async (uid: string, adminUid: string, subjectCodes: string[]): Promise<void> => {
  const userRef = doc(firestore, `users/${uid}`);
  const pendingRef = doc(firestore, `pendingFaculty/${uid}`);
  const facultySubjectsRef = doc(firestore, `users/${uid}/data/facultySubjects`);
  const batch = writeBatch(firestore);

  batch.update(userRef, {
    role: 'FACULTY',
    approvedBy: adminUid,
    approvedAt: Date.now(),
  });
  batch.set(facultySubjectsRef, { codes: subjectCodes }, { merge: true });
  batch.delete(pendingRef);

  await batch.commit();
};

export const rejectFaculty = async (uid: string): Promise<void> => {
  const pendingRef = doc(firestore, `pendingFaculty/${uid}`);
  await deleteDoc(pendingRef);
};

export const startSession = async (session: ClassSession): Promise<void> => {
  const docRef = doc(firestore, `activeSessions/${session.subjectCode}`);
  await setDoc(docRef, session);
};

export const endSession = async (subjectCode: string): Promise<void> => {
  const docRef = doc(firestore, `activeSessions/${subjectCode}`);
  await updateDoc(docRef, { status: 'ENDED', endTime: Date.now() });
};

export const getActiveSession = async (subjectCode: string): Promise<ClassSession | null> => {
  const docRef = doc(firestore, `activeSessions/${subjectCode}`);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists() && snapshot.data().status === 'ACTIVE') {
    return snapshot.data() as ClassSession;
  }
  return null;
};

export const getActiveSessionForFaculty = async (facultyId: string): Promise<ClassSession | null> => {
  const sessionsRef = collection(firestore, 'activeSessions');
  const activeSessionsQuery = query(sessionsRef, where('facultyId', '==', facultyId));
  const snapshot = await getDocs(activeSessionsQuery);

  const activeSessions = snapshot.docs
    .map((sessionDoc) => sessionDoc.data() as ClassSession)
    .filter((session) => session.status === 'ACTIVE')
    .sort((a, b) => b.startTime - a.startTime);

  return activeSessions[0] ?? null;
};

export const updateSessionPin = async (subjectCode: string, overridePin: string): Promise<void> => {
  const docRef = doc(firestore, `activeSessions/${subjectCode}`);
  await updateDoc(docRef, { overridePin });
};

export const listenToSessionRecords = (subjectCode: string, callback: (records: LiveAttendanceRecord[]) => void): Unsubscribe => {
  const colRef = collection(firestore, `activeSessions/${subjectCode}/records`);
  return onSnapshot(colRef, (snapshot) => {
    const records = snapshot.docs.map(doc => doc.data() as LiveAttendanceRecord);
    callback(records);
  });
};

export const submitSessionRecord = async (subjectCode: string, record: LiveAttendanceRecord): Promise<void> => {
  const docRef = doc(firestore, `activeSessions/${subjectCode}/records/${record.uid}`);
  await setDoc(docRef, record);
};

export const flagRecord = async (subjectCode: string, studentUid: string, reason: string): Promise<void> => {
  const docRef = doc(firestore, `activeSessions/${subjectCode}/records/${studentUid}`);
  await updateDoc(docRef, { isFlagged: true, flagReason: reason });
};

export type CreateODMLRequestInput = Omit<ODMLRequest, 'requestId' | 'status' | 'createdAt'>;

export const createODMLRequest = async (input: CreateODMLRequestInput): Promise<ODMLRequest> => {
  const docRef = doc(collection(firestore, 'odmlRequests'));
  const request: ODMLRequest = {
    ...input,
    requestId: docRef.id,
    status: 'PENDING',
    createdAt: Date.now(),
  };
  await setDoc(docRef, request);
  return request;
};

export const getODMLRequestsForFaculty = async (subjectCodes: string[]): Promise<ODMLRequest[]> => {
  if (subjectCodes.length === 0) return [];
  const colRef = collection(firestore, 'odmlRequests');
  const q = query(colRef, where('subjectCode', 'in', subjectCodes), where('status', '==', 'PENDING'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ODMLRequest);
};

export const getMyODMLRequests = async (studentId: string): Promise<ODMLRequest[]> => {
  const colRef = collection(firestore, 'odmlRequests');
  const q = query(colRef, where('studentId', '==', studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ODMLRequest);
};

export const updateODMLRequestStatus = async (requestId: string, status: ODMLStatus): Promise<void> => {
  const docRef = doc(firestore, `odmlRequests/${requestId}`);
  await updateDoc(docRef, { status });
};

/**
 * Withdraw (delete) a PENDING OD/ML request before the midnight cutoff.
 * This removes it from the faculty's inbox completely.
 */
export const withdrawODMLRequest = async (requestId: string, dateToRemove?: string): Promise<void> => {
  const docRef = doc(firestore, `odmlRequests/${requestId}`);

  if (!dateToRemove) {
    await deleteDoc(docRef);
    return;
  }

  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return;

  const request = snapshot.data() as ODMLRequest;
  if (request.status !== 'PENDING') {
    throw new Error('Only pending requests can be withdrawn');
  }

  const dates = request.dates.filter((date) => date !== dateToRemove);
  if (dates.length === request.dates.length) return;

  if (dates.length === 0) {
    await deleteDoc(docRef);
    return;
  }

  await updateDoc(docRef, { dates });
};

/**
 * Get all PENDING OD/ML requests for a specific student + subject.
 * Used to check which dates can still be undone.
 */
export const getPendingODMLForStudent = async (
  studentId: string,
  subjectCode: string,
  type?: 'OD' | 'ML'
): Promise<ODMLRequest[]> => {
  const colRef = collection(firestore, 'odmlRequests');
  const constraints: any[] = [
    where('studentId', '==', studentId),
    where('subjectCode', '==', subjectCode),
    where('status', '==', 'PENDING')
  ];
  if (type) {
    constraints.push(where('type', '==', type));
  }
  const q = query(colRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as ODMLRequest);
};


export const applyApprovedODML = async (request: ODMLRequest): Promise<void> => {
  const subjects = await loadSubjects(request.studentId);
  const subjectIndex = subjects.findIndex(s => s.code === request.subjectCode);
  
  if (subjectIndex !== -1) {
    const subject = subjects[subjectIndex];
    const updatedSubject = request.dates.reduce((currentSubject, date) => {
      // The request flow applies only to an otherwise unrecorded day. It does
      // not overwrite an existing class record.
      if (currentSubject.history.some((record) => record.date === date)) {
        return currentSubject;
      }

      return addAttendanceRecord(currentSubject, {
        date,
        dayOfWeek: shortDayForDate(date),
        periodIndex: 0,
        type: request.type,
      });
    }, subject);

    if (updatedSubject !== subject) {
      const updatedSubjects = [...subjects];
      updatedSubjects[subjectIndex] = updatedSubject;
      await saveSubjects(request.studentId, updatedSubjects);
    }
  }
};

export const loadFacultySubjects = async (uid: string): Promise<string[]> => {
  const docRef = doc(firestore, `users/${uid}/data/facultySubjects`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data().codes : [];
};

export const saveFacultySubjects = async (uid: string, codes: string[]): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}/data/facultySubjects`);
  await setDoc(docRef, { codes }, { merge: true });
};

export const deleteUserData = async (uid: string): Promise<void> => {
  // Delete known subcollection documents
  await deleteDoc(doc(firestore, `users/${uid}/data/subjects`));
  await deleteDoc(doc(firestore, `users/${uid}/data/timetable`));
  await deleteDoc(doc(firestore, `users/${uid}/data/facultySubjects`));
  
  // Delete the main user document
  await deleteDoc(doc(firestore, `users/${uid}`));
};

// ─────────────────────────────────────────────
// CORRECTION REQUESTS
// ─────────────────────────────────────────────

export const createCorrectionRequest = async (
  req: AttendanceCorrectionRequest
): Promise<void> => {
  const docRef = doc(firestore, `correctionRequests/${req.requestId}`);
  await setDoc(docRef, req);
};

/** Faculty: see correction requests for their own subjects */
export const getCorrectionRequestsForFaculty = async (
  subjectCodes: string[]
): Promise<AttendanceCorrectionRequest[]> => {
  if (subjectCodes.length === 0) return [];
  const colRef = collection(firestore, 'correctionRequests');
  const q = query(
    colRef,
    where('subjectCode', 'in', subjectCodes),
    where('status', '==', 'PENDING')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AttendanceCorrectionRequest);
};

/** Admin: see ALL pending correction requests */
export const getAllCorrectionRequests = async (): Promise<AttendanceCorrectionRequest[]> => {
  const colRef = collection(firestore, 'correctionRequests');
  const q = query(colRef, where('status', '==', 'PENDING'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AttendanceCorrectionRequest);
};

/**
 * Approve a correction request:
 * 1. Removes the OD/ML history entry from the student's subject
 * 2. Adjusts attended & total counts
 * 3. Saves updated subjects back to Firestore (student sees it in real-time)
 * 4. Marks the request as APPROVED
 * 5. Writes an audit log entry
 */
export const approveCorrectionRequest = async (
  req: AttendanceCorrectionRequest,
  editorId: string,
  editorName: string
): Promise<void> => {
  // Load student subjects
  const subjects = await loadSubjects(req.studentId);
  const idx = subjects.findIndex(s => s.id === req.subjectId);
  if (idx === -1) throw new Error('Subject not found for student');

  const subject = subjects[idx];
  const updatedSubject = removeAttendanceRecords(subject, (record) =>
    record.date === req.date && (record.type === 'OD' || record.type === 'ML')
  );

  // Remove the OD/ML record
  // OD & ML count as attended → subtract 1 from both attended and total
  subjects[idx] = updatedSubject;
  await saveSubjects(req.studentId, subjects); // ← real-time listener fires immediately

  // Mark request resolved
  await updateDoc(doc(firestore, `correctionRequests/${req.requestId}`), {
    status: 'APPROVED',
    resolvedAt: Date.now(),
    resolvedBy: editorId,
  });

  // Write audit log
  const logId = `${req.studentId}_${req.date}_${Date.now()}`;
  const logEntry: AttendanceAuditLog = {
    logId,
    editorId,
    editorName,
    studentId: req.studentId,
    studentName: req.studentName,
    subjectId: req.subjectId,
    subjectCode: req.subjectCode,
    date: req.date,
    periodIndex: 0,
    previousType: req.currentType,
    newType: 'REMOVED',
    reason: `Correction request approved: ${req.reason}`,
    changedAt: Date.now(),
  };
  await setDoc(doc(firestore, `attendanceAuditLog/${logId}`), logEntry);
};

export const rejectCorrectionRequest = async (
  requestId: string,
  editorId: string
): Promise<void> => {
  await updateDoc(doc(firestore, `correctionRequests/${requestId}`), {
    status: 'REJECTED',
    resolvedAt: Date.now(),
    resolvedBy: editorId,
  });
};

// ─────────────────────────────────────────────
// ADMIN ATTENDANCE EDITOR
// ─────────────────────────────────────────────

/**
 * Admin directly changes a single attendance record for a student.
 * Updates Firestore immediately (student's real-time listener fires) and writes an audit log.
 */
export const adminEditAttendance = async (params: {
  editorId: string;
  editorName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectCode: string;
  date: string;
  periodIndex: number;
  newType: AttendanceType;
  reason?: string;
}): Promise<void> => {
  const subjects = await loadSubjects(params.studentId);
  const idx = subjects.findIndex(s => s.id === params.subjectId);
  if (idx === -1) throw new Error('Subject not found');

  const subject = subjects[idx];
  const record = subject.history.find(
    h => h.date === params.date && h.periodIndex === params.periodIndex
  );

  const prevType: string = record?.type ?? 'NONE';
  const updatedSubject = upsertAttendanceRecord(subject, {
    date: params.date,
    dayOfWeek: shortDayForDate(params.date),
    periodIndex: params.periodIndex,
    type: params.newType,
  });

    // No existing record for this slot — insert new one
  subjects[idx] = updatedSubject;
  await saveSubjects(params.studentId, subjects);

  // Audit log
  const logId = `admin_${params.studentId}_${params.date}_${params.periodIndex}_${Date.now()}`;
  const logEntry: AttendanceAuditLog = {
    logId,
    editorId: params.editorId,
    editorName: params.editorName,
    studentId: params.studentId,
    studentName: params.studentName,
    subjectId: params.subjectId,
    subjectCode: params.subjectCode,
    date: params.date,
    periodIndex: params.periodIndex,
    previousType: prevType,
    newType: params.newType,
    reason: params.reason,
    changedAt: Date.now(),
  };
  await setDoc(doc(firestore, `attendanceAuditLog/${logId}`), logEntry);
};

/** List all student users (for admin student-picker) */
export const getAllStudents = async (): Promise<AppUser[]> => {
  const colRef = collection(firestore, 'users');
  const q = query(colRef, where('role', '==', 'STUDENT'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as AppUser);
};


export const saveSettings = async (uid: string, settings: any): Promise<void> => {
  const docRef = doc(firestore, `users/${uid}/data/settings`);
  await setDoc(docRef, settings, { merge: true });
};

export const loadSettings = async (uid: string): Promise<any> => {
  const docRef = doc(firestore, `users/${uid}/data/settings`);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

