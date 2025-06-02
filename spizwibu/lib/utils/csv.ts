// lib/utils/csv.ts
import { Person } from '../types/person';

export interface CSVParseResult {
  success: boolean;
  data: Person[];
  errors: string[];
}

export const csvUtils = {
  parseCSV: (csvContent: string): CSVParseResult => {
    const errors: string[] = [];
    const data: Person[] = [];
    
    try {
      const lines = csvContent.trim().split('\n');
      
      if (lines.length === 0) {
        return { success: false, data: [], errors: ['CSV file is empty'] };
      }

      // Use semicolon separator for German CSV format
      const separator = ';';
      const firstLine = lines[0];
      
      // Parse header to determine column structure
      const headerColumns = firstLine.split(separator).map(col => col.trim().toLowerCase().replace(/^"|"$/g, ''));
      
      // Check if first line is a header
      const hasHeader = headerColumns.some(col => 
        col.includes('vorname') || col.includes('nachname')
      );
      
      const dataLines = hasHeader ? lines.slice(1) : lines;
      
      // Determine column mapping for German format (Vorname, Nachname)
      let vornameColumnIndex = -1;
      let nachnameColumnIndex = -1;

      if (hasHeader) {
        headerColumns.forEach((col, index) => {
          if (col.includes('vorname') || col.includes('first')) {
            vornameColumnIndex = index;
          } else if (col.includes('nachname') || col.includes('last')) {
            nachnameColumnIndex = index;
          }
        });
      } else {
        // Fallback to positional parsing for files without headers
        // Assume first two columns are Vorname, Nachname
        vornameColumnIndex = 0;
        nachnameColumnIndex = 1;
      }

      dataLines.forEach((line, index) => {
        const row = index + (hasHeader ? 2 : 1); // Adjust row number for error reporting
        
        if (line.trim() === '') return; // Skip empty lines
        
        const columns = line.split(separator).map(col => col.trim().replace(/^"|"$/g, ''));
        
        let fullName = '';
        
        // Construct full name from Vorname and Nachname columns
        if (vornameColumnIndex >= 0 && nachnameColumnIndex >= 0) {
          const vorname = columns[vornameColumnIndex] || '';
          const nachname = columns[nachnameColumnIndex] || '';
          fullName = `${vorname} ${nachname}`.trim();
        } else {
          errors.push(`Row ${row}: Vorname and Nachname columns not found`);
          return;
        }

        if (!fullName) {
          errors.push(`Row ${row}: Name cannot be empty`);
          return;
        }

        // All persons start with no shift exclusions (can be set manually later)
        data.push({
          id: crypto.randomUUID(),
          name: fullName,
          excludeMorningShifts: false,
          excludeEveningShifts: false
        });
      });

      return {
        success: errors.length === 0,
        data,
        errors
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  },

  generateCSV: (persons: Person[]): string => {
    const headers = ['Vorname', 'Nachname', 'Ausschluss Morgen', 'Ausschluss Abend'];
    const rows = persons.map(person => {
      const nameParts = person.name.split(' ');
      const vorname = nameParts[0] || '';
      const nachname = nameParts.slice(1).join(' ') || '';
      return [
        `"${vorname}"`,
        `"${nachname}"`,
        person.excludeMorningShifts ? 'true' : 'false',
        person.excludeEveningShifts ? 'true' : 'false'
      ];
    });

    return [headers, ...rows].map(row => row.join(';')).join('\n');
  }
};
