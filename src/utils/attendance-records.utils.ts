import { AttendanceSnapshot, AttendanceType, Subject } from '../types/attendance.types';

type AttendanceRecordInput = Omit<AttendanceSnapshot, 'attended' | 'total' | 'recordedAt'> & {
  recordedAt?: number;
};

const COUNTED_TYPES: ReadonlySet<AttendanceType> = new Set([
  'PRESENT',
  'OD',
  'ML',
]);

const recordKey = (record: Pick<AttendanceSnapshot, 'date' | 'periodIndex'>) =>
  `${record.date}:${record.periodIndex}`;

const compareRecords = (left: AttendanceSnapshot, right: AttendanceSnapshot) => {
  if (left.date !== right.date) return left.date.localeCompare(right.date);
  if (left.periodIndex !== right.periodIndex) return left.periodIndex - right.periodIndex;
  return left.recordedAt - right.recordedAt;
};

export const countsAsAttended = (type: AttendanceType): boolean => COUNTED_TYPES.has(type);

/**
 * Rebuild derived totals from the authoritative history. This keeps the
 * subject-level totals and legacy per-record snapshots correct after an older
 * record is changed or removed.
 */
export const recalculateAttendance = (subject: Subject): Subject => {
  let attended = 0;
  let total = 0;

  const history = [...subject.history]
    .sort(compareRecords)
    .map((record) => {
      total += 1;
      if (countsAsAttended(record.type)) attended += 1;

      return {
        ...record,
        attended,
        total,
      };
    });

  return { ...subject, attended, total, history };
};

/**
 * Adds a record only when that class slot has not already been recorded. A
 * date + period is the attendance identity used throughout the mobile app.
 */
export const addAttendanceRecord = (
  subject: Subject,
  input: AttendanceRecordInput
): Subject => {
  const inputKey = recordKey(input);
  if (subject.history.some((record) => recordKey(record) === inputKey)) {
    return subject;
  }

  return recalculateAttendance({
    ...subject,
    history: [
      ...subject.history,
      {
        ...input,
        recordedAt: input.recordedAt ?? Date.now(),
        attended: 0,
        total: 0,
      },
    ],
  });
};

/** Updates an existing class slot without silently creating a new one. */
export const changeAttendanceType = (
  subject: Subject,
  date: string,
  periodIndex: number,
  type: AttendanceType
): Subject => {
  let found = false;
  let changed = false;

  const history = subject.history.map((record) => {
    if (record.date !== date || record.periodIndex !== periodIndex) return record;
    found = true;
    if (record.type === type) return record;
    changed = true;
    return { ...record, type };
  });

  return found && changed ? recalculateAttendance({ ...subject, history }) : subject;
};

/** Creates a missing class slot or changes the type of an existing one. */
export const upsertAttendanceRecord = (
  subject: Subject,
  input: AttendanceRecordInput
): Subject => {
  const existing = subject.history.find((record) => recordKey(record) === recordKey(input));
  if (!existing) return addAttendanceRecord(subject, input);

  return changeAttendanceType(subject, input.date, input.periodIndex, input.type);
};

export const removeAttendanceRecords = (
  subject: Subject,
  predicate: (record: AttendanceSnapshot) => boolean
): Subject => {
  const history = subject.history.filter((record) => !predicate(record));
  return history.length === subject.history.length
    ? subject
    : recalculateAttendance({ ...subject, history });
};

export const removeLatestAttendanceRecord = (subject: Subject): Subject => {
  if (subject.history.length === 0) return subject;

  const latest = subject.history.reduce((latestRecord, record) =>
    record.recordedAt > latestRecord.recordedAt ? record : latestRecord
  );

  return removeAttendanceRecords(subject, (record) => record === latest);
};

export const shortDayForDate = (date: string): string =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
