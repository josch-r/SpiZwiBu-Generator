// lib/hooks/use-session-storage.ts
import { useSessionStorage } from 'usehooks-ts';

type SessionData = {
  people: Person[];
  stations: Station[];
  assignments: Assignment[];
};

export function useSchedulerSession() {
  const [data, setData, clearData] = useSessionStorage<SessionData>(
    'scheduler-session',
    { people: [], stations: [], assignments: [] }
  );

  const importPeople = (people: Person[]) => 
    setData(current => ({ ...current, people }));
    
  // Additional mutation methods...

  return { 
    ...data,
    importPeople,
    clearSession: () => clearData()
  };
}
