import { Subject } from '../types/attendance.types';
import { AttendanceStats } from '../types/app.types';

export const safePct = (attended: number, total: number): number => {
  if (total === 0) return -1;
  return Number(((attended / total) * 100).toFixed(2));
};

export const classesCanSkip = (attended: number, total: number, targetPct: number = 0.75): number => {
  if (total === 0) return 0;
  const skip = Math.floor(attended / targetPct - total);
  return Math.max(0, skip);
};

export const classesNeeded = (attended: number, total: number, targetPct: number = 0.75): number => {
  if (total === 0) return 0;
  const currentPct = attended / total;
  if (currentPct >= targetPct) return 0;
  const needed = Math.ceil((targetPct * total - attended) / (1 - targetPct));
  return Math.max(0, needed);
};

export const getAttendanceStatus = (pct: number): 'safe' | 'borderline' | 'critical' | 'severe' => {
  if (pct === -1) return 'safe';
  if (pct >= 85) return 'safe';
  if (pct >= 70) return 'borderline';
  if (pct >= 50) return 'critical';
  return 'severe';
};

export const getAttendanceStatusMessage = (attended: number, total: number): { status: 'safe' | 'borderline' | 'lacking', text: string, color: string } => {
  if (total === 0) return { status: 'safe', text: 'No classes yet', color: 'text-gray-500' };
  
  const pct = (attended / total) * 100;
  const needed75 = classesNeeded(attended, total, 0.75);
  
  if (pct < 70) {
    return {
      status: 'lacking',
      text: `Need ${needed75} more class${needed75 !== 1 ? 'es' : ''} to reach 75%`,
      color: 'text-red-600 dark:text-red-400'
    };
  }
  
  if (pct >= 70 && pct < 75) {
    return {
      status: 'borderline',
      text: `Need ${needed75} more class${needed75 !== 1 ? 'es' : ''} to reach 75%`,
      color: 'text-warning dark:text-orange-400'
    };
  }
  
  // Safe zone (>= 75%)
  const skip75 = classesCanSkip(attended, total, 0.75);
  if (skip75 === 0) {
    return {
      status: 'safe',
      text: `Skipping next class drops you below 75%`,
      color: 'text-green-600 dark:text-green-400'
    };
  } else {
    return {
      status: 'safe',
      text: `You can skip ${skip75} class${skip75 !== 1 ? 'es' : ''} safely`,
      color: 'text-green-600 dark:text-green-400'
    };
  }
};

export const computeStats = (subject: Subject): AttendanceStats => {
  const percentage = safePct(subject.attended, subject.total);
  return {
    attended: subject.attended,
    total: subject.total,
    percentage,
    canSkip: classesCanSkip(subject.attended, subject.total, 0.75),
    needToAttend: classesNeeded(subject.attended, subject.total, 0.75),
  };
};
