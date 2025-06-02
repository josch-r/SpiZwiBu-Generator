'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Person, Station, Assignment } from '@/lib/types/person';
import { sessionStorageUtils } from '@/lib/utils/storage';
import SchedulingEngine from '@/lib/scheduling/engine';
import { AlertCircle, Calendar, Download, RotateCcw, Eye } from 'lucide-react';

type ViewMode = 'calendar' | 'person' | 'station';

export default function DisplayPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionStorageUtils.isSessionStorageAvailable()) {
      setError('Session storage is not available. Please enable it to use this application.');
      return;
    }

    const loadedPersons = sessionStorageUtils.loadPersons();
    const loadedStations = sessionStorageUtils.loadStations();
    const loadedAssignments = sessionStorageUtils.loadAssignments();

    if (loadedPersons.length === 0) {
      setError('Keine Personen gefunden. Bitte gehen Sie zurück zum Import.');
      return;
    }

    if (loadedAssignments.length === 0) {
      setError('Kein SpiZwiBu-Plan gefunden. Bitte generieren Sie erst einen SpiZwiBu-Plan.');
      return;
    }

    setPersons(loadedPersons);
    setStations(loadedStations.filter(s => s.active));
    setAssignments(loadedAssignments);
  }, []);

  const getPersonName = (personId: string): string => {
    const person = persons.find(p => p.id === personId);
    return person ? person.name : 'Unbekannt';
  };

  const getStationName = (stationId: string): string => {
    const station = stations.find(s => s.id === stationId);
    return station ? station.name : 'Unbekannt';
  };

  const handleExportCSV = () => {
    try {
      const csvHeaders = ['Tag', 'Zeit', 'Station', 'Person 1', 'Person 2'];
      
      // Group assignments by day, time, and station
      const groupedAssignments: Record<string, Assignment[]> = {};
      
      assignments.forEach(assignment => {
        const key = `${assignment.dayOfWeek}-${assignment.timeSlot}-${assignment.stationId}`;
        if (!groupedAssignments[key]) {
          groupedAssignments[key] = [];
        }
        groupedAssignments[key].push(assignment);
      });

      const csvRows = Object.entries(groupedAssignments).map(([key, assignments]) => {
        const [day, timeSlot, stationId] = key.split('-');
        const person1 = assignments[0] ? getPersonName(assignments[0].personId) : '';
        const person2 = assignments[1] ? getPersonName(assignments[1].personId) : '';
        
        return [
          day,
          timeSlot === 'Morning' ? 'Frühdienst' : 'Spätdienst',
          getStationName(stationId),
          person1,
          person2
        ];
      });

      const csvContent = [
        csvHeaders.join(';'),
        ...csvRows.map(row => row.join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `SpiZwiBu-Plan_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clear all data after export as per requirements
      setTimeout(() => {
        sessionStorageUtils.clearAllData();
        router.push('/');
      }, 1000);
    } catch (error) {
      setError('Fehler beim Exportieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };

  const renderCalendarView = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const timeSlots = ['Morning', 'Evening'] as const;

    return (
      <div className="space-y-6">
        {days.map(day => {
          const dayAssignments = assignments.filter(a => a.dayOfWeek === day);
          
          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {timeSlots.map(timeSlot => {
                    const slotAssignments = dayAssignments.filter(a => a.timeSlot === timeSlot);
                    
                    return (
                      <div key={timeSlot} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">
                          {timeSlot === 'Morning' ? 'Frühdienst' : 'Spätdienst'}
                        </h4>
                        <div className="space-y-2">
                          {slotAssignments.length > 0 ? (
                            // Group assignments by station
                            Object.entries(
                              slotAssignments.reduce((acc, assignment) => {
                                const stationId = assignment.stationId;
                                if (!acc[stationId]) {
                                  acc[stationId] = [];
                                }
                                acc[stationId].push(assignment);
                                return acc;
                              }, {} as Record<string, Assignment[]>)
                            ).map(([stationId, stationAssignments]) => (
                              <div key={stationId} className="border-l-2 border-gray-300 pl-3">
                                <div className="font-medium text-sm mb-1">
                                  {getStationName(stationId)}
                                </div>
                                <div className="space-y-1">
                                  {stationAssignments.map((assignment, index) => (
                                    <div key={index} className="text-sm text-gray-600">
                                      {getPersonName(assignment.personId)}
                                    </div>
                                  ))}
                                  {stationAssignments.length === 1 && (
                                    <div className="text-xs text-red-500 italic">
                                      (Nur 1 Person - 2 benötigt)
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-400">Keine Dienste</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderPersonView = () => {
    const assignmentsByPerson = SchedulingEngine.getAssignmentsByPerson(assignments);

    return (
      <div className="space-y-4">
        {persons.map(person => {
          const personAssignments = assignmentsByPerson[person.id] || [];
          
          return (
            <Card key={person.id}>
              <CardHeader>
                <CardTitle className="text-lg">{person.name}</CardTitle>
                <CardDescription>
                  {personAssignments.length} Dienste
                  {person.excludeMorningShifts && ' • Kein Frühdienst'}
                  {person.excludeEveningShifts && ' • Kein Spätdienst'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {personAssignments.map((assignment, index) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="font-medium">{assignment.dayOfWeek}</div>
                      <div className="text-gray-600">
                        {assignment.timeSlot === 'Morning' ? 'Frühdienst' : 'Spätdienst'}
                      </div>
                      <div className="text-gray-600">{getStationName(assignment.stationId)}</div>
                    </div>
                  ))}
                </div>
                {personAssignments.length === 0 && (
                  <div className="text-gray-400 text-sm">Keine Dienste zugewiesen</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderStationView = () => {
    const assignmentsByStation = SchedulingEngine.getAssignmentsByStation(assignments);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
    const timeSlots = ['Morning', 'Evening'] as const;

    return (
      <div className="space-y-4">
        {stations.map(station => {
          const stationAssignments = assignmentsByStation[station.id] || [];
          
          return (
            <Card key={station.id}>
              <CardHeader>
                <CardTitle className="text-lg">{station.name}</CardTitle>
                <CardDescription>
                  {stationAssignments.length} Dienste insgesamt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {days.map(day => 
                    timeSlots.map(timeSlot => {
                      const slotAssignments = stationAssignments.filter(a => 
                        a.dayOfWeek === day && a.timeSlot === timeSlot
                      );
                      
                      if (slotAssignments.length === 0) return null;
                      
                      return (
                        <div key={`${day}-${timeSlot}`} className="border rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">
                              {day} - {timeSlot === 'Morning' ? 'Frühdienst' : 'Spätdienst'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              slotAssignments.length >= 2 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {slotAssignments.length}/2 Personen
                            </span>
                          </div>
                          <div className="space-y-1">
                            {slotAssignments.map((assignment, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                {getPersonName(assignment.personId)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {stationAssignments.length === 0 && (
                  <div className="text-gray-400 text-sm">Keine Dienste zugewiesen</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push('/schedule')} variant="outline">
            ← Zurück zur SpiZwiBu-Planerstellung
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SpiZwiBu-Plan</h1>
        <p className="text-gray-600">
          Überprüfe den generierten SpiZwiBu-Plan und exportiere ihn als CSV-Datei.
        </p>
      </div>

      {/* Stats Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{assignments.length}</div>
              <div className="text-sm text-gray-600">Dienste gesamt</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{persons.length}</div>
              <div className="text-sm text-gray-600">Personen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stations.length}</div>
              <div className="text-sm text-gray-600">Stationen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">11</div>
              <div className="text-sm text-gray-600">Zeitslots</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
              size="sm"
              className={viewMode === 'calendar' ? 'bg-gray-900 text-white' : ''}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Kalenderansicht
            </Button>
            <Button
              variant={viewMode === 'person' ? 'default' : 'outline'}
              onClick={() => setViewMode('person')}
              size="sm"
              className={viewMode === 'person' ? 'bg-gray-900 text-white' : ''}
            >
              <Eye className="w-4 h-4 mr-2" />
              Nach Personen
            </Button>
            <Button
              variant={viewMode === 'station' ? 'default' : 'outline'}
              onClick={() => setViewMode('station')}
              size="sm"
              className={viewMode === 'station' ? 'bg-gray-900 text-white' : ''}
            >
              <Eye className="w-4 h-4 mr-2" />
              Nach Stationen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Display */}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'person' && renderPersonView()}
      {viewMode === 'station' && renderStationView()}

      <Separator className="my-8" />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/schedule')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Zurück zur Generierung
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorageUtils.clearAssignments();
              router.push('/schedule');
            }}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Neu generieren
          </Button>
        </div>
        <Button
          onClick={handleExportCSV}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Als CSV exportieren
        </Button>
      </div>

      {/* Export Notice */}
      <Card className="mt-8 border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Hinweis:</strong> Nach dem CSV-Export werden alle Daten automatisch gelöscht und Sie 
            kehren zur Startseite zurück. Dies gewährleistet den Datenschutz und die Einhaltung der DSGVO.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
