'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Station, ScheduleConfig, Person } from '@/lib/types/person';
import { sessionStorageUtils } from '@/lib/utils/storage';
import { AlertCircle, Plus, Trash2, Settings, Calendar, Users } from 'lucide-react';

export default function ConfigurationPage() {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [newStationName, setNewStationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [personsCount, setPersonsCount] = useState(0);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [availabilityMode, setAvailabilityMode] = useState<'available' | 'unavailable'>('unavailable');  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempSingleDate, setTempSingleDate] = useState('');
  useEffect(() => {
    if (!sessionStorageUtils.isSessionStorageAvailable()) {
      setError('Session storage is not available. Please enable it to use this application.');
      return;
    }

    const loadedStations = sessionStorageUtils.loadStations();
    setStations(loadedStations);

    const loadedPersons = sessionStorageUtils.loadPersons();
    setPersons(loadedPersons);
    setPersonsCount(loadedPersons.length);

    const loadedScheduleConfig = sessionStorageUtils.loadScheduleConfig();
    setScheduleConfig(loadedScheduleConfig);
  }, []);

  const handleAddStation = () => {
    if (!newStationName.trim()) {
      setError('Bitte geben Sie einen Stationsnamen ein.');
      return;
    }

    if (stations.some(station => station.name.toLowerCase() === newStationName.toLowerCase())) {
      setError('Eine Station mit diesem Namen existiert bereits.');
      return;
    }

    if (stations.length >= 10) {
      setError('Maximal 10 Stationen sind erlaubt.');
      return;
    }

    const newStation: Station = {
      id: Date.now().toString(),
      name: newStationName.trim(),
      active: true
    };

    const updatedStations = [...stations, newStation];
    setStations(updatedStations);
    sessionStorageUtils.saveStations(updatedStations);
    setNewStationName('');
    setError(null);
  };

  const handleRemoveStation = (stationId: string) => {
    const activeStations = stations.filter(s => s.active);
    if (activeStations.length <= 1) {
      setError('Mindestens eine aktive Station ist erforderlich.');
      return;
    }

    const updatedStations = stations.filter(station => station.id !== stationId);
    setStations(updatedStations);
    sessionStorageUtils.saveStations(updatedStations);
    setError(null);
  };

  const handleToggleStation = (stationId: string) => {
    const updatedStations = stations.map(station =>
      station.id === stationId ? { ...station, active: !station.active } : station
    );

    const activeCount = updatedStations.filter(s => s.active).length;
    if (activeCount === 0) {
      setError('Mindestens eine aktive Station ist erforderlich.');
      return;
    }

    setStations(updatedStations);
    sessionStorageUtils.saveStations(updatedStations);
    setError(null);
  };

  const handleRenameStation = (stationId: string, newName: string) => {
    if (!newName.trim()) {
      setError('Stationsname darf nicht leer sein.');
      return;
    }

    if (stations.some(station => station.id !== stationId && station.name.toLowerCase() === newName.toLowerCase())) {
      setError('Eine Station mit diesem Namen existiert bereits.');
      return;
    }

    const updatedStations = stations.map(station =>
      station.id === stationId ? { ...station, name: newName.trim() } : station
    );

    setStations(updatedStations);
    sessionStorageUtils.saveStations(updatedStations);
    setError(null);
  };

  const handleResetToDefault = () => {
    sessionStorageUtils.clearStations();
    const defaultStations = sessionStorageUtils.loadStations();
    setStations(defaultStations);
    setError(null);
  };

  const handleUpdateScheduleConfig = (updates: Partial<ScheduleConfig>) => {
    if (!scheduleConfig) return;
    
    const updatedConfig = { ...scheduleConfig, ...updates };
    setScheduleConfig(updatedConfig);
    sessionStorageUtils.saveScheduleConfig(updatedConfig);
  };
  const handleResetScheduleConfig = () => {
    sessionStorageUtils.clearScheduleConfig();
    const defaultConfig = sessionStorageUtils.loadScheduleConfig();
    setScheduleConfig(defaultConfig);
  };

  // Date availability management functions
  const generateDateRange = (start: string, end: string): string[] => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    
    return dates;
  };
  const handleAddDateRange = () => {
    if (!selectedPersonId || !tempStartDate || !tempEndDate) {
      setError('Bitte wählen Sie eine Person und geben Sie Start- und Enddatum ein.');
      return;
    }

    if (new Date(tempStartDate) > new Date(tempEndDate)) {
      setError('Das Startdatum muss vor dem Enddatum liegen.');
      return;
    }

    // Check if date range is within schedule range
    if (scheduleConfig) {
      const rangeStart = new Date(tempStartDate);
      const rangeEnd = new Date(tempEndDate);
      const scheduleStart = new Date(scheduleConfig.startDate);
      const scheduleEnd = new Date(scheduleConfig.endDate);
      
      if (rangeStart < scheduleStart || rangeEnd > scheduleEnd) {
        setError(`Der Zeitraum muss zwischen ${new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')} und ${new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')} liegen.`);
        return;
      }
    }

    const dateRange = generateDateRange(tempStartDate, tempEndDate);
    const newDates = [...selectedDates, ...dateRange];
    const uniqueDates = [...new Set(newDates)].sort();
    
    setSelectedDates(uniqueDates);
    setTempStartDate('');
    setTempEndDate('');
    setError(null);
  };  const handleAddSingleDate = () => {
    const date = tempSingleDate;
    if (!date) {
      setError('Bitte wählen Sie ein Datum aus.');
      return;
    }
    
    // Check if date is within schedule range
    if (scheduleConfig) {
      const selectedDate = new Date(date);
      const startDate = new Date(scheduleConfig.startDate);
      const endDate = new Date(scheduleConfig.endDate);
      
      if (selectedDate < startDate || selectedDate > endDate) {
        setError(`Das Datum muss zwischen ${new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')} und ${new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')} liegen.`);
        return;
      }
    }
    
    const newDates = [...selectedDates, date];
    const uniqueDates = [...new Set(newDates)].sort();
    setSelectedDates(uniqueDates);
    setTempSingleDate('');
    setError(null);
  };

  const handleRemoveDate = (dateToRemove: string) => {
    setSelectedDates(selectedDates.filter(date => date !== dateToRemove));
  };

  const handleSavePersonAvailability = () => {
    if (!selectedPersonId) {
      setError('Bitte wählen Sie eine Person aus.');
      return;
    }

    const updatedPersons = persons.map(person => {
      if (person.id === selectedPersonId) {
        const updatedPerson = { ...person };
        
        if (availabilityMode === 'available') {
          updatedPerson.availableDates = [...selectedDates];
          // Clear unavailable dates when setting available dates
          delete updatedPerson.unavailableDates;
        } else {
          updatedPerson.unavailableDates = [...selectedDates];
          // Clear available dates when setting unavailable dates
          delete updatedPerson.availableDates;
        }
        
        return updatedPerson;
      }
      return person;
    });

    setPersons(updatedPersons);
    sessionStorageUtils.savePersons(updatedPersons);
      // Reset form
    setSelectedDates([]);
    setSelectedPersonId('');
    setTempSingleDate('');
    setError(null);
  };
  const handlePersonSelectionChange = (personId: string) => {
    setSelectedPersonId(personId);
    setSelectedDates([]);
    setTempSingleDate('');
    
    if (personId) {
      const person = persons.find(p => p.id === personId);
      if (person) {
        if (person.availableDates && person.availableDates.length > 0) {
          setAvailabilityMode('available');
          setSelectedDates([...person.availableDates]);
        } else if (person.unavailableDates && person.unavailableDates.length > 0) {
          setAvailabilityMode('unavailable');
          setSelectedDates([...person.unavailableDates]);
        }
      }
    }
  };

  const handleClearPersonAvailability = () => {
    if (!selectedPersonId) return;

    const updatedPersons = persons.map(person => {
      if (person.id === selectedPersonId) {
        const updatedPerson = { ...person };
        delete updatedPerson.availableDates;
        delete updatedPerson.unavailableDates;
        return updatedPerson;
      }
      return person;
    });    setPersons(updatedPersons);
    sessionStorageUtils.savePersons(updatedPersons);
    setSelectedDates([]);
    setTempSingleDate('');
    setError(null);
  };

  const formatDateForInput = (dateString: string): string => {
    return dateString; // Already in YYYY-MM-DD format
  };

  const parseDateFromInput = (dateString: string): string => {
    return dateString; // Keep as string in YYYY-MM-DD format
  };

  const handleProceedToSchedule = () => {
    const activeStations = stations.filter(s => s.active);
    if (activeStations.length === 0) {
      setError('Mindestens eine aktive Station ist erforderlich.');
      return;
    }

    if (personsCount === 0) {
      setError('Es wurden noch keine Personen importiert. Bitte gehen Sie zunächst zur Import-Seite.');
      return;
    }

    router.push('/schedule');
  };

  const getStationStats = () => {
    const total = stations.length;
    const active = stations.filter(s => s.active).length;
    return { total, active };
  };

  const stats = getStationStats();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stationskonfiguration</h1>
        <p className="text-gray-600">
          Verwalte die Stationen für die SpiZwiBu-Planerstellung.
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

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{personsCount}</div>
              <div className="text-sm text-gray-600">Importierte Personen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              <div className="text-sm text-gray-600">Aktive Stationen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Stationen gesamt</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Station */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Neue Station hinzufügen
          </CardTitle>
          <CardDescription>
            Bis zu 10 Stationen können konfiguriert werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="station-name">Stationsname</Label>
              <Input
                id="station-name"
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
                placeholder="z.B. Bistro"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddStation();
                  }
                }}
                maxLength={50}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddStation}
                disabled={stations.length >= 10 || !newStationName.trim()}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Station List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stationen verwalten</CardTitle>
          <CardDescription>
            Aktivieren/deaktivieren, umbenennen oder entfernen Sie Stationen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stations.map((station) => (
              <div key={station.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  checked={station.active}
                  onCheckedChange={() => handleToggleStation(station.id)}
                  className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                />
                <div className="flex-1">
                  <Input
                    value={station.name}
                    onChange={(e) => handleRenameStation(station.id, e.target.value)}
                    className={`${!station.active ? 'text-gray-400' : ''}`}
                    maxLength={50}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveStation(station.id)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={stations.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {stations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Stationen konfiguriert.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Date Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dienstplan-Zeitraum
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie den Zeitraum und die Schichten für die Dienstplanerstellung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduleConfig && (
            <div className="space-y-6">
              {/* Date Range Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Startdatum</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formatDateForInput(scheduleConfig.startDate)}
                    onChange={(e) => handleUpdateScheduleConfig({
                      startDate: parseDateFromInput(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Enddatum</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formatDateForInput(scheduleConfig.endDate)}
                    onChange={(e) => handleUpdateScheduleConfig({
                      endDate: parseDateFromInput(e.target.value)
                    })}
                  />
                </div>
              </div>

              {/* Shift Options */}
              <div className="space-y-4">
                <div className="font-medium text-sm text-gray-700">Schichtoptionen</div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-start-morning"
                      checked={scheduleConfig.includeStartMorning}
                      onCheckedChange={(checked) => handleUpdateScheduleConfig({
                        includeStartMorning: checked === true
                      })}
                      className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                    />
                    <Label htmlFor="include-start-morning" className="text-sm">
                      Morgenschicht am Startdatum einschließen
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-end-evening"
                      checked={scheduleConfig.includeEndEvening}
                      onCheckedChange={(checked) => handleUpdateScheduleConfig({
                        includeEndEvening: checked === true
                      })}
                      className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                    />
                    <Label htmlFor="include-end-evening" className="text-sm">
                      Abendschicht am Enddatum einschließen
                    </Label>
                  </div>
                </div>
              </div>

              {/* Schedule Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-sm text-gray-700 mb-2">Dienstplan-Vorschau</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>Zeitraum:</strong> {new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')} bis {new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <strong>Erste Schicht:</strong> {scheduleConfig.includeStartMorning ? 'Morgenschicht' : 'Abendschicht'} am {new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <strong>Letzte Schicht:</strong> {scheduleConfig.includeEndEvening ? 'Abendschicht' : 'Morgenschicht'} am {new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')}
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={handleResetScheduleConfig}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Auf Standard zurücksetzen
                </Button>
              </div>
            </div>
          )}        </CardContent>
      </Card>

      {/* Person Availability Management */}
      {persons.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Personenverfügbarkeit
            </CardTitle>            <CardDescription>
              Verwalten Sie die Verfügbarkeit einzelner Personen für bestimmte Termine.
              {scheduleConfig && (
                <span className="block mt-1 text-sm">
                  Verfügbare Termine: {new Date(scheduleConfig.startDate).toLocaleDateString('de-DE')} bis {new Date(scheduleConfig.endDate).toLocaleDateString('de-DE')}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Person Selection */}
              <div>
                <Label htmlFor="person-select">Person auswählen</Label>
                <select
                  id="person-select"
                  value={selectedPersonId}
                  onChange={(e) => handlePersonSelectionChange(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Person auswählen --</option>
                  {persons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPersonId && (
                <>
                  {/* Availability Mode Selection */}
                  <div>
                    <Label>Verfügbarkeitsmodus</Label>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="available-mode"
                          name="availability-mode"
                          value="available"
                          checked={availabilityMode === 'available'}
                          onChange={(e) => setAvailabilityMode(e.target.value as 'available' | 'unavailable')}
                          className="text-gray-900"
                        />
                        <Label htmlFor="available-mode" className="text-sm">
                          Nur an bestimmten Tagen verfügbar
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="unavailable-mode"
                          name="availability-mode"
                          value="unavailable"
                          checked={availabilityMode === 'unavailable'}
                          onChange={(e) => setAvailabilityMode(e.target.value as 'available' | 'unavailable')}
                          className="text-gray-900"
                        />
                        <Label htmlFor="unavailable-mode" className="text-sm">
                          An bestimmten Tagen nicht verfügbar
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Date Range Selection */}
                  <div className="space-y-4">
                    <Label>Zeitraum hinzufügen</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                      <div>
                        <Label htmlFor="temp-start-date" className="text-sm">Von</Label>
                        <Input
                          id="temp-start-date"
                          type="date"
                          value={tempStartDate}
                          onChange={(e) => setTempStartDate(e.target.value)}
                          min={scheduleConfig?.startDate}
                          max={scheduleConfig?.endDate}
                        />
                      </div>
                      <div>
                        <Label htmlFor="temp-end-date" className="text-sm">Bis</Label>
                        <Input
                          id="temp-end-date"
                          type="date"
                          value={tempEndDate}
                          onChange={(e) => setTempEndDate(e.target.value)}
                          min={scheduleConfig?.startDate}
                          max={scheduleConfig?.endDate}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleAddDateRange}
                          disabled={!tempStartDate || !tempEndDate}
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Zeitraum hinzufügen
                        </Button>
                      </div>
                    </div>
                  </div>                  {/* Single Date Selection */}
                  <div className="space-y-4">
                    <Label>Einzelnen Tag hinzufügen</Label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={tempSingleDate}
                          onChange={(e) => setTempSingleDate(e.target.value)}
                          min={scheduleConfig?.startDate}
                          max={scheduleConfig?.endDate}
                          placeholder="Einzelnes Datum"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleAddSingleDate}
                          disabled={!tempSingleDate}
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tag hinzufügen
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Dates Display */}
                  {selectedDates.length > 0 && (
                    <div>
                      <Label className="mb-2 block">
                        {availabilityMode === 'available' ? 'Verfügbare Tage' : 'Nicht verfügbare Tage'} 
                        ({selectedDates.length})
                      </Label>
                      <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {selectedDates.map((date) => (
                            <div
                              key={date}
                              className="flex items-center justify-between bg-white p-2 rounded border text-sm"
                            >
                              <span>{new Date(date).toLocaleDateString('de-DE')}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveDate(date)}
                                className="ml-2 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 border-t">
                    <Button
                      onClick={handleSavePersonAvailability}
                      disabled={selectedDates.length === 0}
                      className="bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      Verfügbarkeit speichern
                    </Button>
                    <Button
                      onClick={handleClearPersonAvailability}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Verfügbarkeit löschen
                    </Button>
                  </div>

                  {/* Current Person Status */}
                  {(() => {
                    const currentPerson = persons.find(p => p.id === selectedPersonId);
                    if (!currentPerson) return null;
                    
                    const hasAvailable = currentPerson.availableDates && currentPerson.availableDates.length > 0;
                    const hasUnavailable = currentPerson.unavailableDates && currentPerson.unavailableDates.length > 0;
                    
                    if (!hasAvailable && !hasUnavailable) return null;
                    
                    return (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="font-medium text-sm text-blue-900 mb-2">
                          Aktuelle Verfügbarkeit für {currentPerson.name}:
                        </div>
                        {hasAvailable && (
                          <div className="text-sm text-blue-800">
                            <strong>Nur verfügbar an:</strong> {currentPerson.availableDates!.length} Tagen
                          </div>
                        )}
                        {hasUnavailable && (
                          <div className="text-sm text-blue-800">
                            <strong>Nicht verfügbar an:</strong> {currentPerson.unavailableDates!.length} Tagen
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/import')}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            ← Zurück zum Import
          </Button>
          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Auf Standard zurücksetzen
          </Button>
        </div>
        <Button
          onClick={handleProceedToSchedule}
          disabled={stats.active === 0 || personsCount === 0}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          Weiter zur Dienstplanerstellung →
        </Button>
      </div>

      {/* Privacy Notice */}
      <Card className="mt-8 border-gray-200 bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Datenschutz:</strong> Ihre Stationskonfiguration wird nur während dieser Browsersitzung gespeichert. 
            Alle Daten werden automatisch gelöscht, wenn Sie den Tab schließen oder eine neue Sitzung starten.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}