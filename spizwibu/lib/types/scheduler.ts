// types/scheduler.ts
interface Person {
    id: string;
    name: string;
    constraints: {
      morningExclusions: Date[];
      eveningExclusions: Date[];
    };
  }
  
  interface Station {
    id: string;
    name: string;
    priority: 1 | 2 | 3;
    requiredSkills: string[];
  }
  
  interface Assignment {
    stationId: string;
    personId: string;
    start: Date;
    end: Date;
    overrideReason?: string;
  }
  