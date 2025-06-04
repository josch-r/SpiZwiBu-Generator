'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Person, Station, ScheduleConfig } from '@/lib/types/person';
import { sessionStorageUtils } from '@/lib/utils/storage';
import SchedulingEngine, { ScheduleResult } from '@/lib/scheduling/engine';
import { AlertCircle, Calendar, Users, Building, CheckCircle } from 'lucide-react';

export default function SchedulePage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!sessionStorageUtils.isSessionStorageAvailable()) {
      setError('Session storage is not available. Please enable it to use this application.');
      return;
    }

    const loadedPersons = sessionStorageUtils.loadPersons();
    const loadedStations = sessionStorageUtils.loadStations();
    const loadedScheduleConfig = sessionStorageUtils.loadScheduleConfig();
    const activeStations = loadedStations.filter(s => s.active);

    if (loadedPersons.length === 0) {
      setError('Keine Personen importiert. Bitte gehen Sie zurück zur Import-Seite.');
      return;
    }

    if (activeStations.length === 0) {
      setError('Keine aktiven Stationen konfiguriert. Bitte gehen Sie zurück zur Konfiguration.');
      return;
    }

    setPersons(loadedPersons);
    setStations(activeStations);
    setScheduleConfig(loadedScheduleConfig);
  }, []);

  const handleGenerateSchedule = () => {
    if (!scheduleConfig) {
      setError('Keine Dienstplan-Konfiguration geladen. Bitte gehen Sie zurück zur Konfiguration.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    try {
      const engine = new SchedulingEngine();
      const result = engine.generateSchedule({
        persons,
        stations,
        scheduleConfig
      });

      setScheduleResult(result);      if (result.success) {
        // Save assignments and fairness metrics to session storage
        sessionStorageUtils.saveAssignments(result.assignments);
        sessionStorageUtils.saveFairnessMetrics(result.fairnessMetrics);
        setShowSuccess(true);
        
        // Navigate to schedule display after a short delay
        setTimeout(() => {
          router.push('/display');
        }, 2000);
      } else {
        setError(result.errors.join('\n'));
      }
    } catch (err) {
      setError('Fehler bei der Dienstplanerstellung: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setIsGenerating(false);
    }
  };

  const getScheduleStats = () => {
    if (!scheduleConfig) {
      // Default fallback to match the old hardcoded behavior
      const totalSlots = 11; // Monday evening through Saturday evening
      const totalAssignmentsNeeded = totalSlots * stations.length * 2; // 2 persons per station
      const maxPossibleAssignments = persons.length * totalSlots;
      const minAssignments = Math.floor(totalAssignmentsNeeded / persons.length);
      const maxAssignments = Math.ceil(totalAssignmentsNeeded / persons.length);

      return {
        totalSlots,
        totalAssignments: totalAssignmentsNeeded,
        minAssignments,
        maxAssignments,
        slotsPerStation: totalSlots,
        isFeasible: totalAssignmentsNeeded <= maxPossibleAssignments
      };
    }

    // Calculate actual slots based on schedule configuration
    const startDate = new Date(scheduleConfig.startDate);
    const endDate = new Date(scheduleConfig.endDate);
    let totalSlots = 0;

    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      // Skip Sundays
      if (currentDate.getDay() === 0) continue;
      
      // Add morning shift (unless it's the start date and we're excluding start morning)
      if (!(currentDate.getTime() === startDate.getTime() && !scheduleConfig.includeStartMorning)) {
        totalSlots++;
      }
      
      // Add evening shift (unless it's the end date and we're excluding end evening)
      if (!(currentDate.getTime() === endDate.getTime() && !scheduleConfig.includeEndEvening)) {
        totalSlots++;
      }
    }

    const totalAssignmentsNeeded = totalSlots * stations.length * 2; // 2 persons per station
    const maxPossibleAssignments = persons.length * totalSlots;
    const minAssignments = Math.floor(totalAssignmentsNeeded / persons.length);
    const maxAssignments = Math.ceil(totalAssignmentsNeeded / persons.length);

    return {
      totalSlots,
      totalAssignments: totalAssignmentsNeeded,
      minAssignments,
      maxAssignments,
      slotsPerStation: totalSlots,
      isFeasible: totalAssignmentsNeeded <= maxPossibleAssignments
    };
  };

  const stats = getScheduleStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SpiZwiBu-Plan generieren</h1>
        <p className="text-gray-600">
          Erstelle einen fairen SpiZwiBu-Plan basierend auf den verfügbaren Mitarbeitenden und Stationen.
        </p>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {showSuccess && scheduleResult?.success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Dienstplan erfolgreich erstellt! Sie werden zur Anzeige weitergeleitet...
          </AlertDescription>
        </Alert>
      )}

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              Personen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{persons.length}</div>
            <div className="text-sm text-gray-600">
              {persons.filter(p => p.excludeMorningShifts).length} Ausschluss Frühdienst<br />
              {persons.filter(p => p.excludeEveningShifts).length} Ausschluss Spätdienst
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="w-5 h-5" />
              Stationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stations.length}</div>
            <div className="text-sm text-gray-600">
              {stations.map(s => s.name).join(', ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              Dienste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</div>
            <div className="text-sm text-gray-600">
              {stats.minAssignments}-{stats.maxAssignments} pro Person
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dienstplan-Details</CardTitle>
          <CardDescription>
            Übersicht über die zu erstellenden Dienste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Zeitraum</div>
                <div className="text-gray-600">
                  {scheduleConfig ? 
                    `${new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')} - ${new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')}` : 
                    'Mo Abend - Sa Abend'
                  }
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Zeitslots</div>
                <div className="text-gray-600">{stats.totalSlots} {scheduleConfig ? 'gesamt' : '(je 2 pro Tag)'}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Gesamte Dienste</div>
                <div className="text-gray-600">{stats.totalAssignments}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Personen pro Station</div>
                <div className="text-gray-600">2 pro Zeitslot</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Konfigurierte Dienstzeiten</h4>
              {scheduleConfig ? (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>Erste Schicht:</strong> {scheduleConfig.includeStartMorning ? 'Morgenschicht' : 'Abendschicht'} am {new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <strong>Letzte Schicht:</strong> {scheduleConfig.includeEndEvening ? 'Abendschicht' : 'Morgenschicht'} am {new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  Standard: Montag Abend bis Samstag Abend
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">2-Personen-System</h4>
              <p className="text-sm text-gray-600 mb-3">
                Jede Station wird mit <strong>2 Personen</strong> pro Zeitslot besetzt. 
                Jede Person erhält zwischen {stats.minAssignments} und {stats.maxAssignments} Diensten. 
                Das System berücksichtigt Ihre Ausschlüsse für Früh- und Spätdienste und verteilt 
                die Zuweisungen gleichmäßig über alle Stationen.
              </p>
              
              {!stats.isFeasible && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Warnung:</strong> Möglicherweise nicht genügend Personen für optimale Verteilung. 
                    Benötigt: {stats.totalAssignments} Dienste, Maximum möglich: {persons.length * stats.totalSlots}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {scheduleResult && (
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-2">Ergebnis der letzten Generierung</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Fairness-Score: {(scheduleResult.fairnessMetrics.fairnessScore * 100).toFixed(1)}%</div>
                <div>
                  Dienste pro Person: {scheduleResult.fairnessMetrics.minAssignments} - {scheduleResult.fairnessMetrics.maxAssignments}
                </div>
                {scheduleResult.errors.length > 0 && (
                  <div className="text-red-600 mt-2">
                    {scheduleResult.errors.length} Warnung(en) bei der Erstellung
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/configuration')}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          ← Zurück zur Konfiguration
        </Button>

        <Button
          onClick={handleGenerateSchedule}
          disabled={isGenerating || error !== null || !scheduleConfig}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          {isGenerating ? 'Generiere Dienstplan...' : 'Dienstplan erstellen →'}
        </Button>
      </div>

      {/* Privacy Notice */}
      <Card className="mt-8 border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Datenschutz:</strong> Die Dienstplanerstellung erfolgt vollständig in Ihrem Browser. 
            Keine Daten werden an externe Server übertragen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
