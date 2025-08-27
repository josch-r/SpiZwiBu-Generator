// lib/scheduling/engine.ts
import { Person, Station, Assignment, ScheduleConfig } from '../types/person';

export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  time: 'Morning' | 'Evening';
  dayIndex: number;
  timeIndex: number;
  date: string; // ISO date string for this specific time slot
  weekNumber: number; // Track which week this slot belongs to
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
      
      // Calculate which week this day belongs to (starting from week 0)
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysDiff / 7);
      
      // Add morning shift (unless it's the start date and we're excluding start morning)
      if (!(currentDate.getTime() === startDate.getTime() && !config.includeStartMorning)) {
        slots.push({
          day: dayName,
          time: 'Morning',
          dayIndex,
          timeIndex: 0,
          date: dateString,
          weekNumber
        });
      }
      
      // Add evening shift (unless it's the end date and we're excluding end evening)
      if (!(currentDate.getTime() === endDate.getTime() && !config.includeEndEvening)) {
        slots.push({
          day: dayName,
          time: 'Evening',
          dayIndex,
          timeIndex: 1,
          date: dateString,
          weekNumber
        });
      }
    }

    return slots;
  }
  private canPersonWorkSlot(person: Person, timeSlot: TimeSlot): boolean {
    // Check shift type exclusions
    if (timeSlot.time === 'Morning' && person.excludeMorningShifts) {
      return false;
    }
    if (timeSlot.time === 'Evening' && person.excludeEveningShifts) {
      return false;
    }
    
    // Check date availability constraints
    const slotDate = timeSlot.date;
    
    // If availableDates is specified, person can only work on those dates
    if (person.availableDates && person.availableDates.length > 0) {
      if (!person.availableDates.includes(slotDate)) {
        return false;
      }
    }
    
    // If unavailableDates is specified, person cannot work on those dates
    if (person.unavailableDates && person.unavailableDates.length > 0) {
      if (person.unavailableDates.includes(slotDate)) {
        return false;
      }
    }
    
    return true;
  }

  private getPersonAssignmentCount(personId: string): number {
    return this.assignments.filter(a => a.personId === personId).length;
  }

  private getStationAssignmentCount(stationId: string): number {
    return this.assignments.filter(a => a.stationId === stationId).length;
  }  private isPersonAvailableForSlot(personId: string, timeSlot: TimeSlot): boolean {
    // Check if person is already assigned to this specific date and time
    return !this.assignments.some(a => 
      a.personId === personId && 
      a.dayOfWeek === timeSlot.day && 
      a.timeSlot === timeSlot.time &&
      a.date === timeSlot.date
    );
  }

  private getPersonStationCount(personId: string, stationId: string): number {
    return this.assignments.filter(a => a.personId === personId && a.stationId === stationId).length;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private findBestPersonsForSlot(timeSlot: TimeSlot, stationId: string, count: number = 2): Person[] {
    const availablePersons = this.persons.filter(person => 
      this.canPersonWorkSlot(person, timeSlot) &&
      this.isPersonAvailableForSlot(person.id, timeSlot)
    );

    if (availablePersons.length === 0) {
      return [];
    }

    // Create a scoring system for fair distribution
    const scoredPersons = availablePersons.map(person => {
      const totalAssignments = this.getPersonAssignmentCount(person.id);
      const stationAssignments = this.getPersonStationCount(person.id, stationId);
      
      // Lower scores are better (fewer assignments = higher priority)
      // Prioritize: 1) People with fewer total assignments 2) People with fewer assignments at this station
      const score = totalAssignments * 10 + stationAssignments * 5;
      
      return { person, score };
    });

    // Sort by score (ascending) and add randomization for ties
    scoredPersons.sort((a, b) => {
      if (a.score === b.score) {
        // For ties, use randomization to avoid alphabetical bias
        return Math.random() - 0.5;
      }
      return a.score - b.score;
    });

    // Group by score to handle ties better
    const lowestScore = scoredPersons[0].score;
    const bestCandidates = scoredPersons.filter(sp => sp.score === lowestScore);
    
    if (bestCandidates.length >= count) {
      // If we have enough people with the same (best) score, shuffle and pick
      const shuffledBest = this.shuffleArray(bestCandidates);
      return shuffledBest.slice(0, count).map(sp => sp.person);
    } else {
      // Take all best candidates and fill remaining slots with next best
      const selected = bestCandidates.map(sp => sp.person);
      const remaining = scoredPersons.slice(bestCandidates.length);
      const shuffledRemaining = this.shuffleArray(remaining);
      
      return [
        ...selected,
        ...shuffledRemaining.slice(0, count - selected.length).map(sp => sp.person)
      ];
    }
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
    
    // Handle edge case where no assignments exist
    if (assignmentCounts.length === 0 || assignmentCounts.every(count => count === 0)) {
      return {
        assignmentsPerPerson,
        assignmentsPerStation,
        minAssignments: 0,
        maxAssignments: 0,
        fairnessScore: 1 // No assignments = perfectly fair
      };
    }

    const minAssignments = Math.min(...assignmentCounts);
    const maxAssignments = Math.max(...assignmentCounts);

    // Calculate fairness score (1 = perfectly fair, 0 = very unfair)
    const range = maxAssignments - minAssignments;
    
    // If everyone has the same number of assignments, it's perfectly fair
    if (range === 0) {
      return {
        assignmentsPerPerson,
        assignmentsPerStation,
        minAssignments,
        maxAssignments,
        fairnessScore: 1
      };
    }

    // Calculate total assignments and ideal distribution
    const totalAssignments = this.assignments.length;
    const idealAssignmentsPerPerson = totalAssignments / this.persons.length;
    
    // Calculate variance from ideal distribution
    const variance = assignmentCounts.reduce((sum, count) => {
      const diff = count - idealAssignmentsPerPerson;
      return sum + (diff * diff);
    }, 0) / assignmentCounts.length;
    
    // Convert variance to fairness score (0-1 scale)
    // Lower variance = higher fairness score
    // Use exponential decay to make the score more sensitive
    const maxReasonableVariance = idealAssignmentsPerPerson; // Reasonable upper bound
    const fairnessScore = Math.max(0, Math.min(1, Math.exp(-variance / maxReasonableVariance)));

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
    }    // Generate assignments using improved distribution algorithm
    const algorithmErrors = this.generateOptimizedAssignments();
    errors.push(...algorithmErrors);

    const fairnessMetrics = this.calculateFairnessMetrics();

    return {
      assignments: this.assignments,
      fairnessMetrics,
      success: errors.length === 0,
      errors
    };
  }

  private generateOptimizedAssignments(): string[] {
    // Create a more sophisticated assignment algorithm
    const maxIterations = 3; // Try multiple passes for better distribution
    const errors: string[] = [];
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      console.log(`Assignment iteration ${iteration + 1}`);
      
      // Clear assignments for retry iterations
      if (iteration > 0) {
        this.assignments = [];
      }
      
      // Shuffle time slots to avoid systematic bias
      const shuffledTimeSlots = this.shuffleArray(this.timeSlots);
      
      // Group slots by week but process in shuffled order within each week
      const slotsByWeek = shuffledTimeSlots.reduce((acc, slot) => {
        const weekKey = slot.weekNumber;
        if (!acc[weekKey]) acc[weekKey] = [];
        acc[weekKey].push(slot);
        return acc;
      }, {} as Record<number, TimeSlot[]>);

      const currentIterationErrors: string[] = [];

      // Process weeks in order but slots within weeks are already shuffled
      for (const [weekNumber, weekSlots] of Object.entries(slotsByWeek)) {
        console.log(`Processing week ${weekNumber} with ${weekSlots.length} slots`);
        
        // For each slot, try to assign optimally
        for (const timeSlot of weekSlots) {
          // Shuffle stations to ensure fair rotation
          const shuffledStations = this.shuffleArray(this.stations);
          
          for (const station of shuffledStations) {
            const persons = this.findBestPersonsForSlot(timeSlot, station.id, 2);
            
            if (persons.length >= 2) {
              // Assign both persons to this station
              persons.forEach(person => {
                this.assignments.push({
                  dayOfWeek: timeSlot.day,
                  timeSlot: timeSlot.time,
                  stationId: station.id,
                  personId: person.id,
                  date: timeSlot.date
                });
              });
            } else if (persons.length === 1) {
              // Only one person available
              this.assignments.push({
                dayOfWeek: timeSlot.day,
                timeSlot: timeSlot.time,
                stationId: station.id,
                personId: persons[0].id,
                date: timeSlot.date
              });
              currentIterationErrors.push(
                `Nur eine Person verfügbar für ${timeSlot.day} ${timeSlot.time} - ${station.name} (2 benötigt)`
              );
            } else {
              // No persons available
              currentIterationErrors.push(
                `Keine verfügbaren Personen für ${timeSlot.day} ${timeSlot.time} - ${station.name} (2 benötigt)`
              );
            }
          }
        }
      }
      
      // Check if this iteration produced better results
      const currentMetrics = this.calculateFairnessMetrics();
      
      // Store errors from the best iteration
      if (iteration === 0 || currentMetrics.fairnessScore > 0.8) {
        errors.splice(0, errors.length, ...currentIterationErrors);
      }
      
      // If we achieved good fairness or this is the last iteration, stop
      if (currentMetrics.fairnessScore > 0.8 || iteration === maxIterations - 1) {
        console.log(`Stopping at iteration ${iteration + 1}, fairness score: ${currentMetrics.fairnessScore}`);
        break;
      }
    }
    
    return errors;
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
