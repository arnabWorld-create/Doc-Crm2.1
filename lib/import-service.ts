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
  patientsCreated: number;
  visitsCreated: number;
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
   * Parse Excel file (.xlsx, .xls) - supports multiple sheets
   */
  private parseExcel(buffer: ArrayBuffer): ParsedData {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Excel file is empty or has no sheets');
      }
      
      // Check if we have multiple sheets (Patients + Visits pattern)
      const hasMultipleSheets = workbook.SheetNames.length > 1;
      const patientsSheetName = workbook.SheetNames.find(name => 
        /patient/i.test(name)
      ) || workbook.SheetNames[0];
      
      const visitsSheetName = workbook.SheetNames.find(name => 
        /visit|consultation/i.test(name)
      );
      
      // Parse patients sheet
      const patientsSheet = workbook.Sheets[patientsSheetName];
      const patientsData = XLSX.utils.sheet_to_json(patientsSheet, { 
        raw: false,
        defval: null,
      });
      
      if (!patientsData || patientsData.length === 0) {
        throw new Error('Patients sheet is empty');
      }
      
      // Parse visits sheet if exists
      let visitsData: any[] = [];
      if (visitsSheetName) {
        const visitsSheet = workbook.Sheets[visitsSheetName];
        visitsData = XLSX.utils.sheet_to_json(visitsSheet, { 
          raw: false,
          defval: null,
        });
      }
      
      // Combine columns from both sheets
      const patientColumns = Object.keys(patientsData[0] || {});
      const visitColumns = visitsData.length > 0 ? Object.keys(visitsData[0] || {}) : [];
      const allColumns = [...new Set([...patientColumns, ...visitColumns])];
      
      // Merge data: For each patient, find their visits and combine
      const mergedData = patientsData.map((patient: any) => {
        // Find matching visits for this patient
        const patientVisits = visitsData.filter((visit: any) => {
          // Match by Patient ID or Name
          const patientId = patient['Patient ID'] || patient['PatientID'] || patient['patient_id'];
          const visitPatientId = visit['Patient ID'] || visit['PatientID'] || visit['patient_id'];
          const patientName = patient['Name'] || patient['name'];
          const visitPatientName = visit['Patient Name'] || visit['PatientName'] || visit['patient_name'];
          
          return (patientId && visitPatientId && patientId === visitPatientId) ||
                 (patientName && visitPatientName && patientName === visitPatientName);
        });
        
        // If patient has visits, create one row per visit
        // If no visits, create one row with just patient data
        if (patientVisits.length > 0) {
          return patientVisits.map((visit: any) => ({
            ...patient,
            ...visit,
          }));
        } else {
          return [patient];
        }
      }).flat();
      
      return {
        data: mergedData,
        columns: allColumns,
        rowCount: mergedData.length,
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
      // Patient fields
      name: /^(name|patient.*name|full.*name|patient)$/i,
      patientId: /^(patient.*id|patientid|patient_id)$/i,
      age: /^(age|patient.*age|years)$/i,
      gender: /^(gender|sex)$/i,
      contact: /^(contact|phone|mobile|number|cell|telephone)$/i,
      bloodGroup: /^(blood.*group|blood.*type|bg|blood)$/i,
      address: /^(address|location|city|residence)$/i,
      allergies: /^(allerg|allergies)$/i,
      chronicConditions: /^(chronic|medical.*history|conditions|diseases)$/i,
      
      // Visit fields
      visitDate: /^(visit.*date|date.*visit|consultation.*date|date)$/i,
      visitType: /^(visit.*type|type|consultation.*type)$/i,
      chiefComplaint: /^(chief.*complaint|complaint|presenting.*complaint|symptoms)$/i,
      diagnosis: /^(diagnosis|diagnosed|condition)$/i,
      treatment: /^(treatment|plan|management)$/i,
      medicines: /^(medicine|medication|drugs|prescription|rx)$/i,
      signs: /^(signs|examination|physical.*exam|findings)$/i,
      investigations: /^(investigation|tests|lab.*tests|reports)$/i,
      notes: /^(notes|remarks|comments|observations)$/i,
      followUpDate: /^(follow.*up|followup|next.*visit|review.*date)$/i,
      
      // Vitals
      bpSystolic: /^(bp.*systolic|systolic|sbp)$/i,
      bpDiastolic: /^(bp.*diastolic|diastolic|dbp)$/i,
      bloodPressure: /^(blood.*pressure|bp)$/i,
      temp: /^(temp|temperature|fever)$/i,
      pulse: /^(pulse|heart.*rate|hr)$/i,
      spo2: /^(spo2|oxygen|o2.*sat)$/i,
      weight: /^(weight|wt)$/i,
      rbs: /^(rbs|blood.*sugar|glucose|sugar)$/i,
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
   * Map row data to patient and visit objects
   */
  async mapRowToPatientAndVisit(row: any, mapping: ColumnMapping): Promise<{ patient: any; visit: any | null }> {
    const patient = {
      patientId: await generatePatientId(), // Now properly awaited
      name: this.getMappedValue(row, mapping, 'name')?.toString().trim() || '',
      age: this.parseNumber(this.getMappedValue(row, mapping, 'age')),
      gender: this.normalizeGender(this.getMappedValue(row, mapping, 'gender')),
      contact: this.normalizeContact(this.getMappedValue(row, mapping, 'contact')),
      bloodGroup: this.getMappedValue(row, mapping, 'bloodGroup')?.toString().trim() || null,
      address: this.getMappedValue(row, mapping, 'address')?.toString().trim() || null,
      allergies: this.getMappedValue(row, mapping, 'allergies')?.toString().trim() || null,
      chronicConditions: this.getMappedValue(row, mapping, 'chronicConditions')?.toString().trim() || null,
    };
    
    // Check if row has visit data
    const hasVisitData = 
      this.getMappedValue(row, mapping, 'visitDate') ||
      this.getMappedValue(row, mapping, 'chiefComplaint') ||
      this.getMappedValue(row, mapping, 'diagnosis') ||
      this.getMappedValue(row, mapping, 'treatment') ||
      this.getMappedValue(row, mapping, 'medicines');
    
    let visit = null;
    if (hasVisitData) {
      visit = {
        visitDate: this.parseDate(this.getMappedValue(row, mapping, 'visitDate')) || new Date(),
        chiefComplaint: this.getMappedValue(row, mapping, 'chiefComplaint')?.toString().trim() || null,
        diagnosis: this.getMappedValue(row, mapping, 'diagnosis')?.toString().trim() || null,
        treatment: this.getMappedValue(row, mapping, 'treatment')?.toString().trim() || null,
        medicines: this.getMappedValue(row, mapping, 'medicines')?.toString().trim() || null,
        signs: this.getMappedValue(row, mapping, 'signs')?.toString().trim() || null,
        investigations: this.getMappedValue(row, mapping, 'investigations')?.toString().trim() || null,
        notes: this.getMappedValue(row, mapping, 'notes')?.toString().trim() || null,
        followUpDate: this.parseDate(this.getMappedValue(row, mapping, 'followUpDate')),
        bpSystolic: this.parseNumber(this.getMappedValue(row, mapping, 'bpSystolic')),
        bpDiastolic: this.parseNumber(this.getMappedValue(row, mapping, 'bpDiastolic')),
        bloodPressure: this.getMappedValue(row, mapping, 'bloodPressure')?.toString().trim() || null,
        temp: this.parseFloat(this.getMappedValue(row, mapping, 'temp')),
        pulse: this.parseNumber(this.getMappedValue(row, mapping, 'pulse')),
        spo2: this.parseNumber(this.getMappedValue(row, mapping, 'spo2')),
        weight: this.parseFloat(this.getMappedValue(row, mapping, 'weight')),
        rbs: this.parseNumber(this.getMappedValue(row, mapping, 'rbs')),
      };
    }
    
    return { patient, visit };
  }
  
  /**
   * Map row data to patient object (legacy - for backward compatibility)
   */
  async mapRowToPatient(row: any, mapping: ColumnMapping): Promise<any> {
    return (await this.mapRowToPatientAndVisit(row, mapping)).patient;
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
  
  private parseFloat(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = parseFloat(value.toString());
    return isNaN(num) ? null : num;
  }
  
  private parseDate(value: any): Date | null {
    if (!value) return null;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
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
