export type AppTheme = 'SYSTEM' | 'LIGHT' | 'DARK';

export interface AttendanceStats {
  attended: number;
  total: number;
  percentage: number;
  canSkip: number;
  needToAttend: number;
}
