'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, Plus, Search, Trash2, Download, AlertCircle, Info } from 'lucide-react';
import { Person } from '@/lib/types/person';
import { sessionStorageUtils } from '@/lib/utils/storage';
import { csvUtils, CSVParseResult } from '@/lib/utils/csv';

export default function ImportPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure we're on the client side before accessing sessionStorage
  useEffect(() => {
    setIsClient(true);
    if (sessionStorageUtils.isSessionStorageAvailable()) {
      const savedPersons = sessionStorageUtils.loadPersons();
      setPersons(savedPersons);
    }
  }, []);

  // Save to sessionStorage whenever persons change
  useEffect(() => {
    if (isClient && persons.length >= 0) {
      sessionStorageUtils.savePersons(persons);
    }
  }, [persons, isClient]);

  const addPerson = () => {
    if (!newPersonName.trim()) return;
    
    // Check for duplicate names
    if (persons.some(p => p.name.toLowerCase() === newPersonName.toLowerCase())) {
      alert('A person with this name already exists.');
      return;
    }

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: newPersonName.trim(),
      excludeMorningShifts: false,
      excludeEveningShifts: false,
    };

    setPersons(prev => [...prev, newPerson]);
    setNewPersonName('');
  };

  const removePerson = (id: string) => {
    setPersons(prev => prev.filter(p => p.id !== id));
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPersons(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setCsvErrors(['Please select a CSV file.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      const parseResult: CSVParseResult = csvUtils.parseCSV(csvContent);
      
      if (parseResult.success) {
        // Check for duplicate names with existing persons
        const existingNames = new Set(persons.map(p => p.name.toLowerCase()));
        const newPersons = parseResult.data.filter(p => {
          if (existingNames.has(p.name.toLowerCase())) {
            parseResult.errors.push(`Skipped duplicate name: ${p.name}`);
            return false;
          }
          return true;
        });
        
        setPersons(prev => [...prev, ...newPersons]);
        setCsvErrors(parseResult.errors);
      } else {
        setCsvErrors(parseResult.errors);
      }
    };

    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportAsCSV = () => {
    if (persons.length === 0) {
      alert('No data to export.');
      return;
    }

    const csvContent = csvUtils.generateCSV(persons);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `persons_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all imported data? This action cannot be undone.')) {
      setPersons([]);
      setCsvErrors([]);
      sessionStorageUtils.clearPersons();
    }
  };

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isClient) {
    return <div className="min-h-screen bg-white" />; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Namen Importieren</h1>
          <p className="text-gray-600">Füge Mitarbeitende hinzu und konfiguriere ihre Schichtverfügbarkeit für die SpiZwiBu-Stationen.
          </p>
        </div>

        {/* Privacy Notice */}
        <Alert className="mb-6 border-gray-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Datenschutz-Hinweis:</strong> Alle importierten Daten werden nur in Ihrer Browsersitzung gespeichert und werden automatisch gelöscht, wenn Sie diesen Tab schließen oder Ihren Plan exportieren. Es werden keine persönlichen Informationen auf unseren Servern gespeichert.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Manuelle Eingabe
              </CardTitle>
              <CardDescription>
                Füge einzelne Namen manuell hinzu. Jeder Name wird als separate Person gespeichert.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-name">Name</Label>
                  <Input
                    id="new-name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Enter name"
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                    className="border-gray-300"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={addPerson}
                    disabled={!newPersonName.trim()}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CSV Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                CSV Import
              </CardTitle>
              <CardDescription>
               Lade eine CSV-Datei hoch, um mehrere Namen gleichzeitig zu importieren.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-upload">CSV-Datei</Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="border-gray-300"
                />
              </div>
              <div className="text-xs text-gray-500">
                Erwartetes format: Vorname; Nachname (German format with semicolon separator)
                <br />
                 Ausschlüsse für Schichten können in der CSV-Datei nicht festgelegt werden.
                <br />
                <div className="mt-1">
                  <a 
                    href="/sample-import.csv" 
                    download 
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Download sample CSV
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CSV Errors */}
        {csvErrors.length > 0 && (
          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Import Fehler:</div>
              <ul className="list-disc list-inside space-y-1">
                {csvErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Separator className="my-8" />

        {/* Data Management */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Importierte Namen ({persons.length})</h2>
            <p className="text-gray-600 text-sm">
              Hier kannst du die importierten Namen verwalten, Schichtausschlüsse festlegen und die Daten exportieren.
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={exportAsCSV}
              disabled={persons.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={clearAllData}
              disabled={persons.length === 0}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Search */}
        {persons.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
          </div>
        )}

        {/* Data Table */}
        {persons.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-medium">Name</TableHead>
                      <TableHead className="font-medium text-center">Ausschluss Frühdienst</TableHead>
                      <TableHead className="font-medium text-center">Ausschluss Spätdienst</TableHead>
                      <TableHead className="font-medium text-center">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersons.map((person) => (
                      <TableRow key={person.id} className="border-gray-200">
                        <TableCell className="font-medium">{person.name}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={person.excludeMorningShifts}
                            onCheckedChange={(checked) => 
                              updatePerson(person.id, { excludeMorningShifts: checked as boolean })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={person.excludeEveningShifts}
                            onCheckedChange={(checked) => 
                              updatePerson(person.id, { excludeEveningShifts: checked as boolean })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePerson(person.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Noch keine Namen importiert</p>
                <p className="text-sm">
                 Benutze die manuelle Eingabe oder lade eine CSV-Datei hoch, um Mitarbeitende hinzuzufügen.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        {persons.length > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {persons.length} Personen importiert
            </div>
            <Button 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={() => window.location.href = '/configuration'}
            >
              Weiter zur Konfiguration →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}