// lib/scheduling/engine.ts
import { Person, Station, Assignment, ScheduleConfig } from '../types/person';

export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time: 'Morning' | 'Evening';
  dayIndex: number;
  timeIndex: number;
  date: string; // ISO date string for this specific time slot
}

export interface ScheduleConstraints {
  persons: Person[];
  stations: Station[];
  scheduleConfig: ScheduleConfig;
}

export interface ScheduleResult {
  assignments: Assignment[];
  fairnessMetrics: FairnessMetrics;
  success: boolean;
  errors: string[];
}

export interface FairnessMetrics {
  assignmentsPerPerson: Record<string, number>;
  assignmentsPerStation: Record<string, number>;
  minAssignments: number;
  maxAssignments: number;
  fairnessScore: number; // 0-1, where 1 is perfectly fair
}

class SchedulingEngine {
  private persons: Person[] = [];
  private stations: Station[] = [];
  private timeSlots: TimeSlot[] = [];
  private assignments: Assignment[] = [];

  // Generate time slots based on the schedule configuration
  private generateTimeSlots(config: ScheduleConfig): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);
    
    // Helper function to get day name from date
    const getDayName = (date: Date): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[date.getDay()];
      if (dayName === 'Sunday') {
        throw new Error('Sunday is not supported in the schedule');
      }
      return dayName as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    };

    // Iterate through each day in the date range
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      // Skip Sundays
      if (currentDate.getDay() === 0) continue;
      
      const dayName = getDayName(currentDate);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayIndex = currentDate.getDay() === 1 ? 0 : currentDate.getDay() - 1; // Monday = 0, Tuesday = 1, etc.
      
      // Add morning shift (unless it's the start date and we're excluding start morning)
      if (!(currentDate.getTime() === startDate.getTime() && !config.includeStartMorning)) {
        slots.push({
          day: dayName,
          time: 'Morning',
          dayIndex,
          timeIndex: 0,
          date: dateString
        });
      }
      
      // Add evening shift (unless it's the end date and we're excluding end evening)
      if (!(currentDate.getTime() === endDate.getTime() && !config.includeEndEvening)) {
        slots.push({
          day: dayName,
          time: 'Evening',
          dayIndex,
          timeIndex: 1,
          date: dateString
        });
      }
    }

    return slots;
  }

  private canPersonWorkSlot(person: Person, timeSlot: TimeSlot): boolean {
    if (timeSlot.time === 'Morning' && person.excludeMorningShifts) {
      return false;
    }
    if (timeSlot.time === 'Evening' && person.excludeEveningShifts) {
      return false;
    }
    return true;
  }

  private getPersonAssignmentCount(personId: string): number {
    return this.assignments.filter(a => a.personId === personId).length;
  }

  private getStationAssignmentCount(stationId: string): number {
    return this.assignments.filter(a => a.stationId === stationId).length;
  }

  private isPersonAvailableForSlot(personId: string, timeSlot: TimeSlot): boolean {
    // Check if person is already assigned to this time slot
    return !this.assignments.some(a => 
      a.personId === personId && 
      a.dayOfWeek === timeSlot.day && 
      a.timeSlot === timeSlot.time
    );
  }

  private findBestPersonsForSlot(timeSlot: TimeSlot, count: number = 2): Person[] {
    const availablePersons = this.persons.filter(person => 
      this.canPersonWorkSlot(person, timeSlot) &&
      this.isPersonAvailableForSlot(person.id, timeSlot)
    );

    if (availablePersons.length === 0) {
      return [];
    }

    // Sort by assignment count (ascending) to ensure fair distribution
    availablePersons.sort((a, b) => 
      this.getPersonAssignmentCount(a.id) - this.getPersonAssignmentCount(b.id)
    );

    // Return up to 'count' persons (default 2)
    return availablePersons.slice(0, Math.min(count, availablePersons.length));
  }

  private calculateFairnessMetrics(): FairnessMetrics {
    const assignmentsPerPerson: Record<string, number> = {};
    const assignmentsPerStation: Record<string, number> = {};

    // Initialize counters
    this.persons.forEach(person => {
      assignmentsPerPerson[person.id] = 0;
    });
    this.stations.forEach(station => {
      assignmentsPerStation[station.id] = 0;
    });

    // Count assignments
    this.assignments.forEach(assignment => {
      assignmentsPerPerson[assignment.personId]++;
      assignmentsPerStation[assignment.stationId]++;
    });

    const assignmentCounts = Object.values(assignmentsPerPerson);
    const minAssignments = Math.min(...assignmentCounts);
    const maxAssignments = Math.max(...assignmentCounts);

    // Calculate fairness score (1 = perfectly fair, 0 = very unfair)
    const range = maxAssignments - minAssignments;
    const totalSlots = this.timeSlots.length * this.stations.length * 2; // 2 persons per station
    const idealAssignmentsPerPerson = totalSlots / this.persons.length;
    const idealRange = Math.ceil(idealAssignmentsPerPerson) - Math.floor(idealAssignmentsPerPerson);
    const fairnessScore = idealRange === 0 ? 1 : Math.max(0, 1 - (range / (idealRange + 2)));

    return {
      assignmentsPerPerson,
      assignmentsPerStation,
      minAssignments,
      maxAssignments,
      fairnessScore
    };
  }

  public generateSchedule(constraints: ScheduleConstraints): ScheduleResult {
    this.persons = constraints.persons;
    this.stations = constraints.stations.filter(s => s.active);
    this.timeSlots = this.generateTimeSlots(constraints.scheduleConfig);
    this.assignments = [];

    const errors: string[] = [];

    // Validate inputs
    if (this.persons.length === 0) {
      errors.push('Keine Personen verfügbar');
    }
    if (this.stations.length === 0) {
      errors.push('Keine aktiven Stationen konfiguriert');
    }

    // Check if we have enough persons for 2 per station per time slot
    const totalSlotsNeeded = this.timeSlots.length * this.stations.length * 2;
    const maxPossibleAssignments = this.persons.length * this.timeSlots.length;
    
    if (totalSlotsNeeded > maxPossibleAssignments) {
      errors.push(`Nicht genügend Personen verfügbar. Benötigt: ${totalSlotsNeeded} Zuweisungen (2 pro Station), Maximum möglich: ${maxPossibleAssignments}`);
    }

    if (errors.length > 0) {
      return {
        assignments: [],
        fairnessMetrics: this.calculateFairnessMetrics(),
        success: false,
        errors
      };
    }

    // Generate assignments for each time slot and station (2 persons per station)
    for (const timeSlot of this.timeSlots) {
      for (const station of this.stations) {
        const persons = this.findBestPersonsForSlot(timeSlot, 2);
        
        if (persons.length >= 2) {
          // Assign both persons to this station
          persons.forEach(person => {
            this.assignments.push({
              dayOfWeek: timeSlot.day,
              timeSlot: timeSlot.time,
              stationId: station.id,
              personId: person.id
            });
          });
        } else if (persons.length === 1) {
          // Only one person available
          this.assignments.push({
            dayOfWeek: timeSlot.day,
            timeSlot: timeSlot.time,
            stationId: station.id,
            personId: persons[0].id
          });
          errors.push(
            `Nur eine Person verfügbar für ${timeSlot.day} ${timeSlot.time} - ${station.name} (2 benötigt)`
          );
        } else {
          // No persons available
          errors.push(
            `Keine verfügbaren Personen für ${timeSlot.day} ${timeSlot.time} - ${station.name} (2 benötigt)`
          );
        }
      }
    }

    const fairnessMetrics = this.calculateFairnessMetrics();

    return {
      assignments: this.assignments,
      fairnessMetrics,
      success: errors.length === 0,
      errors
    };
  }

  // Helper method to get assignments for display
  public static getAssignmentsByDay(assignments: Assignment[]): Record<string, Assignment[]> {
    const result: Record<string, Assignment[]> = {};
    
    assignments.forEach(assignment => {
      const key = assignment.dayOfWeek;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(assignment);
    });

    return result;
  }

  public static getAssignmentsByPerson(assignments: Assignment[]): Record<string, Assignment[]> {
    const result: Record<string, Assignment[]> = {};
    
    assignments.forEach(assignment => {
      const key = assignment.personId;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(assignment);
    });

    return result;
  }

  public static getAssignmentsByStation(assignments: Assignment[]): Record<string, Assignment[]> {
    const result: Record<string, Assignment[]> = {};
    
    assignments.forEach(assignment => {
      const key = assignment.stationId;
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(assignment);
    });

    return result;
  }
}

export default SchedulingEngine;
