import { AttendanceType } from '../types/attendance.types';
import { AppUser } from '../types/user.types';
import { getActiveSession, submitSessionRecord } from './firestore.service';
import { calculateDistance, getCurrentLocation } from './location.service';
import { getDeviceId } from './device.service';

type LiveCheckInInput = {
  subjectCode: string;
  user: AppUser;
  attendanceType: AttendanceType;
  location?: { lat: number; lng: number };
};

/**
 * Mirrors a verified Present mark into an active faculty session. A failed live
 * check-in never rolls back the student's normal attendance mark; it simply
 * leaves the faculty's live radar unchanged.
 */
export const submitLiveCheckIn = async ({
  subjectCode,
  user,
  attendanceType,
  location,
}: LiveCheckInInput): Promise<boolean> => {
  if (attendanceType !== 'PRESENT') return false;

  const session = await getActiveSession(subjectCode);
  if (!session) return false;

  const currentLocation = location ?? await getCurrentLocation();
  if (!currentLocation) return false;

  const distance = calculateDistance(
    currentLocation.lat,
    currentLocation.lng,
    session.geofenceLat,
    session.geofenceLng
  );
  if (distance > session.geofenceRadius) return false;

  await submitSessionRecord(subjectCode, {
    uid: user.uid,
    studentName: user.displayName || 'Student',
    deviceId: await getDeviceId(),
    lat: currentLocation.lat,
    lng: currentLocation.lng,
    timestamp: Date.now(),
    attendanceType,
    isFlagged: false,
  });

  return true;
};
