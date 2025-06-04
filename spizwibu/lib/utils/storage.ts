// lib/utils/storage.ts
import { Person, Station, Assignment, ScheduleConfig } from '../types/person';
import { FairnessMetrics } from '../scheduling/engine';

const PERSONS_STORAGE_KEY = 'spizwibu_persons';
const STATIONS_STORAGE_KEY = 'spizwibu_stations';
const ASSIGNMENTS_STORAGE_KEY = 'spizwibu_assignments';
const SCHEDULE_CONFIG_STORAGE_KEY = 'spizwibu_schedule_config';
const FAIRNESS_METRICS_STORAGE_KEY = 'spizwibu_fairness_metrics';

// Default stations as specified in requirements
const DEFAULT_STATIONS: Station[] = [
  { id: '1', name: 'Pool', active: true },
  { id: '2', name: 'TT-Platten', active: true },
  { id: '3', name: 'Klettergerüst', active: true },
  { id: '4', name: 'Spieletheke', active: true }
];

export const sessionStorageUtils = {
  // Person utilities
  savePersons: (persons: Person[]): void => {
    try {
      sessionStorage.setItem(PERSONS_STORAGE_KEY, JSON.stringify(persons));
    } catch (error) {
      console.error('Failed to save persons to session storage:', error);
    }
  },

  loadPersons: (): Person[] => {
    try {
      const stored = sessionStorage.getItem(PERSONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load persons from session storage:', error);
      return [];
    }
  },

  clearPersons: (): void => {
    try {
      sessionStorage.removeItem(PERSONS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear persons from session storage:', error);
    }
  },

  // Station utilities
  saveStations: (stations: Station[]): void => {
    try {
      sessionStorage.setItem(STATIONS_STORAGE_KEY, JSON.stringify(stations));
    } catch (error) {
      console.error('Failed to save stations to session storage:', error);
    }
  },

  loadStations: (): Station[] => {
    try {
      const stored = sessionStorage.getItem(STATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_STATIONS;
    } catch (error) {
      console.error('Failed to load stations from session storage:', error);
      return DEFAULT_STATIONS;
    }
  },

  clearStations: (): void => {
    try {
      sessionStorage.removeItem(STATIONS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stations from session storage:', error);
    }
  },

  // Assignment utilities
  saveAssignments: (assignments: Assignment[]): void => {
    try {
      sessionStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    } catch (error) {
      console.error('Failed to save assignments to session storage:', error);
    }
  },

  loadAssignments: (): Assignment[] => {
    try {
      const stored = sessionStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load assignments from session storage:', error);
      return [];
    }
  },

  clearAssignments: (): void => {
    try {
      sessionStorage.removeItem(ASSIGNMENTS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear assignments from session storage:', error);
    }
  },

  // ScheduleConfig utilities
  saveScheduleConfig: (config: ScheduleConfig): void => {
    try {
      sessionStorage.setItem(SCHEDULE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save schedule config to session storage:', error);
    }
  },

  loadScheduleConfig: (): ScheduleConfig => {
    try {
      const stored = sessionStorage.getItem(SCHEDULE_CONFIG_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Return default config - next Monday to Saturday
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
      const nextSaturday = new Date(nextMonday);
      nextSaturday.setDate(nextMonday.getDate() + 5);
      
      return {
        startDate: nextMonday.toISOString().split('T')[0],
        endDate: nextSaturday.toISOString().split('T')[0],
        includeStartMorning: false, // Start with Monday evening
        includeEndEvening: true // End with Saturday evening
      };
    } catch (error) {
      console.error('Failed to load schedule config from session storage:', error);
      // Return default config
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7);
      const nextSaturday = new Date(nextMonday);
      nextSaturday.setDate(nextMonday.getDate() + 5);
      
      return {
        startDate: nextMonday.toISOString().split('T')[0],
        endDate: nextSaturday.toISOString().split('T')[0],
        includeStartMorning: false,
        includeEndEvening: true
      };
    }
  },
  clearScheduleConfig: (): void => {
    try {
      sessionStorage.removeItem(SCHEDULE_CONFIG_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear schedule config from session storage:', error);
    }
  },

  // Fairness Metrics utilities
  saveFairnessMetrics: (metrics: FairnessMetrics): void => {
    try {
      sessionStorage.setItem(FAIRNESS_METRICS_STORAGE_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.error('Failed to save fairness metrics to session storage:', error);
    }
  },

  loadFairnessMetrics: (): FairnessMetrics | null => {
    try {
      const stored = sessionStorage.getItem(FAIRNESS_METRICS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load fairness metrics from session storage:', error);
      return null;
    }
  },

  clearFairnessMetrics: (): void => {
    try {
      sessionStorage.removeItem(FAIRNESS_METRICS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear fairness metrics from session storage:', error);
    }
  },

  // General utilities
  isSessionStorageAvailable: (): boolean => {
    try {
      return typeof Storage !== 'undefined' && sessionStorage !== undefined;
    } catch {
      return false;
    }
  },
  // Clear all application data
  clearAllData: (): void => {
    try {
      sessionStorage.removeItem(PERSONS_STORAGE_KEY);
      sessionStorage.removeItem(STATIONS_STORAGE_KEY);
      sessionStorage.removeItem(ASSIGNMENTS_STORAGE_KEY);
      sessionStorage.removeItem(SCHEDULE_CONFIG_STORAGE_KEY);
      sessionStorage.removeItem(FAIRNESS_METRICS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear all data from session storage:', error);
    }
  }
};
