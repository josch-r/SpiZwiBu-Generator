// types/person.ts
export interface Person {
  id: string;
  name: string;
  excludeMorningShifts: boolean;
  excludeEveningShifts: boolean;
}

export interface Station {
  id: string;
  name: string;
  active: boolean;
}

export interface Assignment {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlot: 'Morning' | 'Evening';
  stationId: string;
  personId: string;
  date: string; // ISO date string to distinguish between weeks
}

export interface ScheduleConfig {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  includeStartMorning: boolean; // Include morning shift on start date
  includeEndEvening: boolean; // Include evening shift on end date
}
