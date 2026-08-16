export const todayDateString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const nowTimestampString = (): string => {
  return new Date().toISOString();
};

export const currentDayOfWeekShort = (): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
};

export const parseTime = (time: string): { h: number; m: number } => {
  const [hStr, mStr] = time.split(':');
  return { h: parseInt(hStr, 10), m: parseInt(mStr, 10) };
};

export const formatTime = (h: number, m: number): string => {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const addMinutes = (time: string, mins: number): string => {
  const { h, m } = parseTime(time);
  let totalMinutes = h * 60 + m + mins;
  
  // Clamp to 23:59 (1439 minutes) to avoid midnight rollover glitches in the timetable
  if (totalMinutes > 1439) {
    totalMinutes = 1439;
  }
  
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  
  return formatTime(newH, newM);
};

export const getDurationMins = (start: string, end: string): number => {
  const startParsed = parseTime(start);
  const endParsed = parseTime(end);
  
  const startMins = startParsed.h * 60 + startParsed.m;
  const endMins = endParsed.h * 60 + endParsed.m;
  
  return endMins >= startMins ? endMins - startMins : (endMins + 24 * 60) - startMins;
};


