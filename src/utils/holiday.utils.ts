/**
 * Returns a static map of major Indian public and festival holidays
 * covering current year ±2 years. Keys are YYYY-MM-DD.
 */
export const getIndianPublicHolidays = (): Record<string, string> => {
  const currentYear = new Date().getFullYear();
  const holidays: Record<string, string> = {};

  const baseHolidays = [
    { month: '01', day: '26', name: 'Republic Day' },
    { month: '05', day: '01', name: 'Labour Day' },
    { month: '08', day: '15', name: 'Independence Day' },
    { month: '10', day: '02', name: 'Gandhi Jayanti' },
    { month: '12', day: '25', name: 'Christmas Day' },
  ];

  // Populate fixed date holidays for currentYear +/- 2
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    baseHolidays.forEach((h) => {
      holidays[`${year}-${h.month}-${h.day}`] = h.name;
    });
    
    // Note: In a production app, festival dates (Diwali, Holi, Eid) shift every year 
    // based on lunar calendars. For this utility, we would either hardcode them 
    // per year or use an external API. Here we provide a representative sample.
    if (year === 2024) {
      holidays['2024-03-25'] = 'Holi';
      holidays['2024-08-19'] = 'Raksha Bandhan';
      holidays['2024-10-31'] = 'Diwali';
    } else if (year === 2025) {
      holidays['2025-03-14'] = 'Holi';
      holidays['2025-08-09'] = 'Raksha Bandhan';
      holidays['2025-10-20'] = 'Diwali';
    } else if (year === 2026) {
      holidays['2026-03-03'] = 'Holi';
      holidays['2026-08-28'] = 'Raksha Bandhan';
      holidays['2026-11-08'] = 'Diwali';
    }
  }

  return holidays;
};
