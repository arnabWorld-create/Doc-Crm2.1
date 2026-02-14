/**
 * Data Import Service
 * Handles parsing and importing patient data from Excel/CSV/JSON files
 */

import * as XLSX from 'xlsx';
import { generatePatientId } from './patientUtils';

export interface ParsedData {
  data: any[];
  columns: string[];
  rowCount: number;
}

export interface ColumnMapping {
  [sourceColumn: string]: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validRowCount: number;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  duration: number;
}

export class ImportService {
  /**
   * Parse uploaded file (Excel, CSV, or JSON)
   */
  async parseFile(buffer: ArrayBuffer, fileName: string): Promise<ParsedData> {
    const fileType = this.detectFileType(fileName);
    
    switch (fileType) {
      case 'excel':
        return this.parseExcel(buffer);
      case 'csv':
        return this.parseCSV(buffer);
      case 'json':
        return this.parseJSON(buffer);
      default:
        throw new Error('Unsupported file type. Please upload Excel (.xlsx), CSV, or JSON file.');
    }
  }
  
  /**
   * Parse Excel file (.xlsx, .xls)
   */
  private parseExcel(buffer: ArrayBuffer): ParsedData {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('Excel file is empty or has no sheets');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false, // Convert dates to strings
        defval: null, // Use null for empty cells
      });
      
      if (!data || data.length === 0) {
        throw new Error('Excel sheet is empty');
      }
      
      // Get column names from first row
      const columns = Object.keys(data[0] || {});
      
      return {
        data,
        columns,
        rowCount: data.length,
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${(error as Error).message}`);
    }
  }
  
  /**
   * Parse CSV file
   */
  private parseCSV(buffer: ArrayBuffer): ParsedData {
    try {
      const text = new TextDecoder('utf-8').decode(buffer);
      
      // Simple CSV parser (handles basic cases)
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Parse header
      const headers = this.parseCSVLine(lines[0]);
      
      // Parse data rows
      const data: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        
        data.push(row);
      }
      
      return {
        data,
        columns: headers,
        rowCount: data.length,
      };
    } catch (error) {
      throw new Error(`Failed to parse CSV file: ${(error as Error).message}`);
    }
  }
  
  /**
   * Parse CSV line (handles quoted values)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  /**
   * Parse JSON file
   */
  private parseJSON(buffer: ArrayBuffer): ParsedData {
    try {
      const text = new TextDecoder('utf-8').decode(buffer);
      const json = JSON.parse(text);
      
      // Support both array and object with patients array
      let data: any[];
      
      if (Array.isArray(json)) {
        data = json;
      } else if (json.patients && Array.isArray(json.patients)) {
        data = json.patients;
      } else if (json.data && Array.isArray(json.data)) {
        data = json.data;
      } else {
        throw new Error('JSON must be an array or contain a "patients" or "data" array');
      }
      
      if (data.length === 0) {
        throw new Error('JSON file contains no data');
      }
      
      const columns = Object.keys(data[0] || {});
      
      return {
        data,
        columns,
        rowCount: data.length,
      };
    } catch (error) {
      throw new Error(`Failed to parse JSON file: ${(error as Error).message}`);
    }
  }
  
  /**
   * Auto-detect column mapping based on common patterns
   */
  autoMapColumns(columns: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    
    // Define patterns for each field
    const patterns: Record<string, RegExp> = {
      name: /^(name|patient.*name|full.*name|patient)$/i,
      age: /^(age|patient.*age|years)$/i,
      gender: /^(gender|sex)$/i,
      contact: /^(contact|phone|mobile|number|cell|telephone)$/i,
      bloodGroup: /^(blood.*group|blood.*type|bg|blood)$/i,
      address: /^(address|location|city|residence)$/i,
      allergies: /^(allerg|allergies)$/i,
      chronicConditions: /^(chronic|medical.*history|conditions|diseases)$/i,
    };
    
    // Try to match each column
    for (const column of columns) {
      const cleanColumn = column.trim();
      
      for (const [field, pattern] of Object.entries(patterns)) {
        if (pattern.test(cleanColumn)) {
          mapping[cleanColumn] = field;
          break;
        }
      }
      
      // If no match, leave unmapped (will be skipped)
    }
    
    return mapping;
  }
  
  /**
   * Validate data before import
   */
  validateData(data: any[], mapping: ColumnMapping): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRowCount = 0;
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header and 0-index
      let hasErrors = false;
      
      // Check required field: Name
      const name = this.getMappedValue(row, mapping, 'name');
      if (!name || name.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'name',
          message: 'Name is required',
          value: name,
        });
        hasErrors = true;
      }
      
      // Validate age (optional but must be valid if provided)
      const age = this.getMappedValue(row, mapping, 'age');
      if (age !== null && age !== undefined && age !== '') {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
          warnings.push({
            row: rowNumber,
            field: 'age',
            message: 'Invalid age (must be 0-150)',
            value: age,
          });
        }
      }
      
      // Validate gender (optional but must be valid if provided)
      const gender = this.getMappedValue(row, mapping, 'gender');
      if (gender && !['Male', 'Female', 'Other', 'M', 'F', 'male', 'female', 'other', 'm', 'f'].includes(gender.toString())) {
        warnings.push({
          row: rowNumber,
          field: 'gender',
          message: 'Invalid gender (use Male, Female, or Other)',
          value: gender,
        });
      }
      
      // Validate contact (optional but must be valid if provided)
      const contact = this.getMappedValue(row, mapping, 'contact');
      if (contact) {
        const cleanContact = contact.toString().replace(/\D/g, '');
        if (cleanContact.length < 10 || cleanContact.length > 15) {
          warnings.push({
            row: rowNumber,
            field: 'contact',
            message: 'Invalid contact number (must be 10-15 digits)',
            value: contact,
          });
        }
      }
      
      if (!hasErrors) {
        validRowCount++;
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRowCount,
    };
  }
  
  /**
   * Map row data to patient object
   */
  mapRowToPatient(row: any, mapping: ColumnMapping): any {
    return {
      patientId: generatePatientId(),
      name: this.getMappedValue(row, mapping, 'name')?.toString().trim() || '',
      age: this.parseNumber(this.getMappedValue(row, mapping, 'age')),
      gender: this.normalizeGender(this.getMappedValue(row, mapping, 'gender')),
      contact: this.normalizeContact(this.getMappedValue(row, mapping, 'contact')),
      bloodGroup: this.getMappedValue(row, mapping, 'bloodGroup')?.toString().trim() || null,
      address: this.getMappedValue(row, mapping, 'address')?.toString().trim() || null,
      allergies: this.getMappedValue(row, mapping, 'allergies')?.toString().trim() || null,
      chronicConditions: this.getMappedValue(row, mapping, 'chronicConditions')?.toString().trim() || null,
    };
  }
  
  // Helper methods
  
  private getMappedValue(row: any, mapping: ColumnMapping, field: string): any {
    const column = Object.keys(mapping).find(k => mapping[k] === field);
    return column ? row[column] : null;
  }
  
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = parseInt(value.toString());
    return isNaN(num) ? null : num;
  }
  
  private normalizeGender(value: any): string | null {
    if (!value) return null;
    const normalized = value.toString().toLowerCase().trim();
    if (normalized === 'm' || normalized === 'male') return 'Male';
    if (normalized === 'f' || normalized === 'female') return 'Female';
    if (normalized === 'other') return 'Other';
    return null;
  }
  
  private normalizeContact(value: any): string | null {
    if (!value) return null;
    // Remove all non-digits
    const cleaned = value.toString().replace(/\D/g, '');
    return cleaned || null;
  }
  
  private detectFileType(fileName: string): 'excel' | 'csv' | 'json' {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'excel';
    if (lower.endsWith('.csv')) return 'csv';
    if (lower.endsWith('.json')) return 'json';
    throw new Error('Unsupported file type. Please upload .xlsx, .csv, or .json file.');
  }
}
