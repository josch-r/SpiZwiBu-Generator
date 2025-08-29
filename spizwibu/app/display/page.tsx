'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Person, Station, Assignment } from '@/lib/types/person';
import { sessionStorageUtils } from '@/lib/utils/storage';
import SchedulingEngine, { FairnessMetrics } from '@/lib/scheduling/engine';
import { AlertCircle, Calendar, Download, RotateCcw, Eye, BarChart3 } from 'lucide-react';

type ViewMode = 'calendar' | 'person' | 'station' | 'fairness';

export default function DisplayPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetrics | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionStorageUtils.isSessionStorageAvailable()) {
      setError('Session storage is not available. Please enable it to use this application.');
      return;
    }    const loadedPersons = sessionStorageUtils.loadPersons();
    const loadedStations = sessionStorageUtils.loadStations();
    const loadedAssignments = sessionStorageUtils.loadAssignments();
    const loadedFairnessMetrics = sessionStorageUtils.loadFairnessMetrics();

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
    setFairnessMetrics(loadedFairnessMetrics);
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
      // Validate required data
      if (!assignments.length) {
        throw new Error('Keine Zuweisungen zum Exportieren gefunden');
      }
      
      // Helper function to escape CSV fields
      const escapeCsvField = (field: string): string => {
        if (!field) return '';
        // If field contains semicolon, comma, quote, or newline, wrap in quotes and escape internal quotes
        if (field.includes(';') || field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };
      
      // Get all unique dates and sort them chronologically
      const uniqueDates = [...new Set(assignments.map(a => a.date))].sort();
      
      // Get formatted dates and day names for headers
      const dateHeaders = uniqueDates.map(date => {
        const dateObj = new Date(date + 'T12:00:00.000Z');
        const dayName = new Intl.DateTimeFormat('de-DE', { 
          weekday: 'short',
          timeZone: 'UTC'
        }).format(dateObj);
        const formattedDate = `${dateObj.getUTCDate().toString().padStart(2, '0')}.${(dateObj.getUTCMonth() + 1).toString().padStart(2, '0')}`;
        return `${dayName} ${formattedDate}`;
      });
      
      // Create CSV headers: Station, Zeit, then each date
      const csvHeaders = ['Station', 'Zeit', ...dateHeaders];
      
      // Create a data structure organized by station and time slot
      const scheduleMatrix: Record<string, Record<string, string[]>> = {};
      
      // Initialize the matrix
      stations.forEach(station => {
        scheduleMatrix[station.id] = {};
        ['Morning', 'Evening'].forEach(timeSlot => {
          scheduleMatrix[station.id][timeSlot] = new Array(uniqueDates.length).fill('');
        });
      });
      
      // Fill the matrix with assignments
      assignments.forEach(assignment => {
        const dateIndex = uniqueDates.indexOf(assignment.date);
        if (dateIndex !== -1) {
          const personName = getPersonName(assignment.personId);
          const currentValue = scheduleMatrix[assignment.stationId][assignment.timeSlot][dateIndex];
          
          // Add person to the list (multiple persons per station/time slot)
          if (currentValue) {
            scheduleMatrix[assignment.stationId][assignment.timeSlot][dateIndex] = `${currentValue}, ${personName}`;
          } else {
            scheduleMatrix[assignment.stationId][assignment.timeSlot][dateIndex] = personName;
          }
        }
      });
      
      // Convert matrix to CSV rows
      const csvRows: string[][] = [];
      
      stations.forEach(station => {
        const stationName = getStationName(station.id);
        
        // Add morning shift row
        const morningRow = [
          escapeCsvField(stationName),
          escapeCsvField('Frühdienst'),
          ...scheduleMatrix[station.id]['Morning'].map(persons => escapeCsvField(persons || '-'))
        ];
        csvRows.push(morningRow);
        
        // Add evening shift row
        const eveningRow = [
          escapeCsvField(''), // Empty station name for evening row to avoid duplication
          escapeCsvField('Spätdienst'),
          ...scheduleMatrix[station.id]['Evening'].map(persons => escapeCsvField(persons || '-'))
        ];
        csvRows.push(eveningRow);
      });
      
      // Validate we have data to export
      if (csvRows.length === 0) {
        throw new Error('Keine gültigen Daten zum Exportieren gefunden');
      }

      // Build CSV content with proper line endings
      const csvContent = [
        csvHeaders.map(header => escapeCsvField(header)).join(';'),
        ...csvRows.map(row => row.join(';'))
      ].join('\r\n'); // Use Windows line endings for better Excel compatibility

      // Create blob with UTF-8 BOM for proper German character encoding in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Create download with descriptive filename including date range
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with current date and date range
      const today = new Date();
      const startDate = uniqueDates[0] ? uniqueDates[0].replace(/-/g, '') : '';
      const endDate = uniqueDates[uniqueDates.length - 1] ? uniqueDates[uniqueDates.length - 1].replace(/-/g, '') : '';
      const filename = `SpiZwiBu-Plan_${startDate}-${endDate}_${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      URL.revokeObjectURL(url);

      // Success logging
      console.log(`CSV export successful: ${csvRows.length} rows exported with ${uniqueDates.length} days`);

      // Clear all data after export as per requirements
      setTimeout(() => {
        sessionStorageUtils.clearAllData();
        router.push('/');
      }, 1000);
      
    } catch (error) {
      console.error('Export error:', error);
      setError('Fehler beim Exportieren: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    }
  };
  const renderCalendarView = () => {
    // Group assignments by date instead of just day of week
    const assignmentsByDate = assignments.reduce((acc, assignment) => {
      const date = assignment.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(assignment);
      return acc;
    }, {} as Record<string, Assignment[]>);

    // Sort dates chronologically
    const sortedDates = Object.keys(assignmentsByDate).sort();

    return (
      <div className="space-y-6">
        {sortedDates.map(date => {
          const dateAssignments = assignmentsByDate[date];
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
          const formattedDate = dateObj.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
          
          return (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {dayName} - {formattedDate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Morning', 'Evening'].map(timeSlot => {
                    const slotAssignments = dateAssignments.filter(a => a.timeSlot === timeSlot);
                    
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
          
          // Sort assignments by date and time
          const sortedAssignments = personAssignments.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            // If same date, Morning comes before Evening
            return a.timeSlot === 'Morning' ? -1 : 1;
          });
          
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
                  {sortedAssignments.map((assignment, index) => {
                    const dateObj = new Date(assignment.date);
                    const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'short' });
                    const formattedDate = dateObj.toLocaleDateString('de-DE', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    });
                    
                    return (
                      <div key={index} className="border rounded p-3 text-sm">
                        <div className="font-medium">{dayName} {formattedDate}</div>
                        <div className="text-gray-600">
                          {assignment.timeSlot === 'Morning' ? 'Frühdienst' : 'Spätdienst'}
                        </div>
                        <div className="text-gray-600">{getStationName(assignment.stationId)}</div>
                      </div>
                    );
                  })}
                </div>
                {personAssignments.length === 0 && (
                  <div className="text-gray-400 text-sm">Keine Dienste zugewiesen</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );  };
  const renderStationView = () => {
    const assignmentsByStation = SchedulingEngine.getAssignmentsByStation(assignments);

    return (
      <div className="space-y-4">
        {stations.map(station => {
          const stationAssignments = assignmentsByStation[station.id] || [];
          
          // Group station assignments by date
          const assignmentsByDate = stationAssignments.reduce((acc, assignment) => {
            const date = assignment.date;
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(assignment);
            return acc;
          }, {} as Record<string, Assignment[]>);

          // Sort dates chronologically
          const sortedDates = Object.keys(assignmentsByDate).sort();
          
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
                  {sortedDates.map(date => {
                    const dateAssignments = assignmentsByDate[date];
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
                    const formattedDate = dateObj.toLocaleDateString('de-DE', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    });

                    return (
                      <div key={date} className="border rounded p-3">
                        <div className="font-medium text-sm mb-2">
                          {dayName} - {formattedDate}
                        </div>
                        <div className="space-y-2">
                          {['Morning', 'Evening'].map(timeSlot => {
                            const slotAssignments = dateAssignments.filter(a => a.timeSlot === timeSlot);
                            
                            if (slotAssignments.length === 0) return null;
                            
                            return (
                              <div key={timeSlot} className="flex justify-between items-center">
                                <span className="text-sm">
                                  {timeSlot === 'Morning' ? 'Frühdienst' : 'Spätdienst'}
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-gray-600">
                                    {slotAssignments.map(a => getPersonName(a.personId)).join(', ')}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    slotAssignments.length >= 2 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {slotAssignments.length}/2
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
  const renderFairnessView = () => {
    if (!fairnessMetrics) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Keine Fairness-Metriken verfügbar</p>
          <p className="text-gray-400 text-sm mt-2">
            Die Fairness-Metriken werden nur angezeigt, wenn sie während der Planerstellung gespeichert wurden.
          </p>
        </div>
      );
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fairness-Analyse
          </CardTitle>
          <CardDescription>
            Analyse der Planverteilung und Fairness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(fairnessMetrics.fairnessScore * 100)}%
              </div>
              <div className="text-sm text-gray-600">Fairness Score</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-blue-600">
                {fairnessMetrics.minAssignments}
              </div>
              <div className="text-sm text-gray-600">Min. Zuweisungen</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-orange-600">
                {fairnessMetrics.maxAssignments}
              </div>
              <div className="text-sm text-gray-600">Max. Zuweisungen</div>
            </div>
            <div className="text-center p-4 border rounded">
              <div className="text-2xl font-bold text-purple-600">
                {fairnessMetrics.maxAssignments - fairnessMetrics.minAssignments}
              </div>
              <div className="text-sm text-gray-600">Zuweisungs-Spanne</div>
            </div>
          </div>

          {/* Person Assignment Distribution */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Verteilung pro Person</h4>
            <div className="space-y-2">
              {Object.entries(fairnessMetrics.assignmentsPerPerson)
                .sort(([,a], [,b]) => b - a)
                .map(([personId, count]) => {
                  const person = persons.find(p => p.id === personId);
                  const percentage = fairnessMetrics.maxAssignments > 0 ? (count / fairnessMetrics.maxAssignments) * 100 : 0;
                  
                  return (
                    <div key={personId} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium truncate">
                        {person?.name || 'Unbekannt'}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-gray-600 text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Station Assignment Distribution */}
          <div>
            <h4 className="font-medium mb-3">Verteilung pro Station</h4>
            <div className="space-y-2">
              {Object.entries(fairnessMetrics.assignmentsPerStation)
                .sort(([,a], [,b]) => b - a)
                .map(([stationId, count]) => {
                  const station = stations.find(s => s.id === stationId);
                  const maxStationAssignments = Math.max(...Object.values(fairnessMetrics.assignmentsPerStation));
                  const percentage = maxStationAssignments > 0 ? (count / maxStationAssignments) * 100 : 0;
                  
                  return (
                    <div key={stationId} className="flex items-center gap-3">
                      <div className="w-32 text-sm font-medium truncate">
                        {station?.name || 'Unbekannt'}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-gray-600 text-right">
                        {count}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
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
            </Button>            <Button
              variant={viewMode === 'station' ? 'default' : 'outline'}
              onClick={() => setViewMode('station')}
              size="sm"
              className={viewMode === 'station' ? 'bg-gray-900 text-white' : ''}
            >
              <Eye className="w-4 h-4 mr-2" />
              Nach Stationen
            </Button>
            <Button
              variant={viewMode === 'fairness' ? 'default' : 'outline'}
              onClick={() => setViewMode('fairness')}
              size="sm"
              className={viewMode === 'fairness' ? 'bg-gray-900 text-white' : ''}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Fairness-Analyse
            </Button>
          </div>
        </CardContent>
      </Card>      {/* Schedule Display */}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'person' && renderPersonView()}
      {viewMode === 'station' && renderStationView()}
      {viewMode === 'fairness' && renderFairnessView()}

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
