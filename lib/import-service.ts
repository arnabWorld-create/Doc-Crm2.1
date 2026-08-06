/**
 * Data Import Service
 * Handles parsing and importing patient data from Excel/CSV/JSON files
 */

import * as XLSX from 'xlsx';

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
  duplicatesSkipped: number;
  duplicatesUpdated: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingPatient?: any;
  matchedBy?: 'contact' | 'name_age' | 'external_id';
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
   * Auto-detect column mapping based on common patterns.
   * Patterns are intentionally broad to handle real-world Excel/CSV exports
   * from various clinic management and data-entry tools.
   */
  autoMapColumns(columns: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    // Each entry: field name → array of regex patterns (tried in order)
    // A column matches if ANY pattern matches (case-insensitive, trimmed)
    const patterns: Record<string, RegExp[]> = {
      // ── Patient fields ────────────────────────────────────────────────
      name: [
        /^(name|patient\s*name|full\s*name|patient|pt\.?\s*name|p\.?\s*name)$/i,
        /patient.*name/i,
        /full.*name/i,
      ],
      patientId: [
        /^(patient\s*id|patientid|patient_id|pt\s*id|pid|mrn|uhid|reg\.?\s*no\.?)$/i,
        /patient.*id/i,
        /\buhid\b/i,
        /\bmrn\b/i,
      ],
      age: [
        /^(age|years?|patient\s*age|pt\.?\s*age|age\s*\(years?\))$/i,
        /^age/i,
      ],
      gender: [
        /^(gender|sex|m\/f|male.*female)$/i,
      ],
      contact: [
        /^(contact|phone|mobile|cell|telephone|mob\.?|ph\.?|contact\s*no\.?|phone\s*no\.?|mobile\s*no\.?)$/i,
        /mobile.*number/i,
        /phone.*number/i,
        /contact.*number/i,
      ],
      bloodGroup: [
        /^(blood\s*group|blood\s*type|b\.?\s*g\.?|bg|blood\s*grp\.?)$/i,
        /blood.*group/i,
        /blood.*type/i,
      ],
      address: [
        /^(address|addr\.?|location|city|residence|village|area|locality)$/i,
        /patient.*address/i,
      ],
      allergies: [
        /^(allerg(y|ies)?|known\s*allerg(y|ies)?)$/i,
        /allerg/i,
      ],
      chronicConditions: [
        /^(chronic|chronic\s*(conditions?|disease?s?|illness(es)?)|medical\s*history|past\s*history|co[\s-]?morbid|comorbid|pmh|past\s*medical|h\/o)$/i,
        /chronic.*condition/i,
        /medical.*history/i,
        /past.*history/i,
        /\bpmh\b/i,
      ],

      // ── Visit / Consultation fields ───────────────────────────────────
      visitDate: [
        /^(visit\s*date|date\s*of\s*visit|consultation\s*date|date\s*of\s*consultation|opd\s*date|date|visit\s*dt\.?)$/i,
        /visit.*date/i,
        /consult.*date/i,
        /opd.*date/i,
      ],
      visitType: [
        /^(visit\s*type|type\s*of\s*visit|consultation\s*type|opd\s*type|type)$/i,
        /visit.*type/i,
      ],
      chiefComplaint: [
        /^(chief\s*complaint|chief\s*c\/o|c\/o|complaint|presenting\s*complaint|reason\s*for\s*visit|presenting\s*problem|cc|reason|history|hopi|h\/o\s*present|main\s*complaint)$/i,
        /chief.*complaint/i,
        /presenting.*complaint/i,
        /reason.*visit/i,
        /\bc\/o\b/i,
      ],
      diagnosis: [
        /^(diagnosis|diagnos(is|es)|dx\.?|provisional\s*diagnosis|final\s*diagnosis|impression|clinical\s*diagnosis|icd|assessment|disease|condition|disorder)$/i,
        /diagnos/i,
        /\bdx\b/i,
        /impression/i,
        /assessment/i,
      ],
      treatment: [
        /^(treatment|plan|management|treatment\s*plan|management\s*plan|advice|advised|clinical\s*management|therapeutic\s*plan|t\/t|tt)$/i,
        /treatment.*plan/i,
        /management.*plan/i,
        /\bt\/t\b/i,
      ],
      medicines: [
        /^(medicine(s)?|medication(s)?|drug(s)?|prescription|rx\.?|drugs?\s*prescribed|prescribed\s*medicines?|medicines?\s*prescribed|drugs?\/medicine|drug\s*name)$/i,
        /medicine/i,
        /medication/i,
        /prescription/i,
        /\brx\b/i,
        /drug.*name/i,
        /prescribed/i,
      ],
      signs: [
        /^(signs?|symptoms?|s\/s|signs?\s*(and|&)\s*symptoms?|examination|physical\s*exam(ination)?|findings?|clinical\s*findings?|o\/e|on\s*exam)$/i,
        /signs?.*symptoms?/i,
        /physical.*exam/i,
        /clinical.*finding/i,
        /\bo\/e\b/i,
      ],
      investigations: [
        /^(investigation(s)?|test(s)?|lab\s*test(s)?|laboratory|lab\s*report(s)?|pathology|reports?|investigation\s*reports?|diagnostic(s)?)$/i,
        /investigation/i,
        /lab.*test/i,
        /lab.*report/i,
      ],
      notes: [
        /^(notes?|remark(s)?|comment(s)?|observation(s)?|additional\s*notes?|doctor\s*notes?|clinical\s*notes?|advice\s*notes?|instruction(s)?)$/i,
        /doctor.*note/i,
        /clinical.*note/i,
        /additional.*note/i,
      ],
      followUpDate: [
        /^(follow[\s-]*up(\s*date)?|f\/u(\s*date)?|next\s*visit(\s*date)?|review(\s*date)?|revisit(\s*date)?|next\s*appointment|next\s*consult(ation)?\s*date)$/i,
        /follow.*up.*date/i,
        /next.*visit/i,
        /\bf\/u\b/i,
      ],

      // ── Vitals ────────────────────────────────────────────────────────
      bpSystolic: [
        /^(bp\s*systolic|systolic(\s*bp)?|sbp|sys\.?\s*bp|bp\s*\(s\))$/i,
        /systolic/i,
        /\bsbp\b/i,
      ],
      bpDiastolic: [
        /^(bp\s*diastolic|diastolic(\s*bp)?|dbp|dia\.?\s*bp|bp\s*\(d\))$/i,
        /diastolic/i,
        /\bdbp\b/i,
      ],
      bloodPressure: [
        /^(blood\s*pressure|bp|b\.p\.?|bp\s*mmhg|bp\s*\(mmhg\)|bp\s*reading|bp\s*\d+\/\d+)$/i,
        /blood.*pressure/i,
        /^bp$/i,
      ],
      temp: [
        /^(temp(erature)?|fever|body\s*temp(erature)?|temp\s*(°?[fc])?|temperature\s*(°?[fc])?)$/i,
        /temperature/i,
        /\bfever\b/i,
      ],
      pulse: [
        /^(pulse|heart\s*rate|hr|pulse\s*rate|p\/r|beats?\s*per\s*min(ute)?|bpm)$/i,
        /pulse.*rate/i,
        /heart.*rate/i,
        /\bhr\b/i,
        /\bbpm\b/i,
      ],
      spo2: [
        /^(spo2|spo₂|oxygen\s*sat(uration)?|o2\s*sat(uration)?|oximetry|pulse\s*ox(imetry)?|%\s*spo2|oxygen)$/i,
        /spo.?2/i,
        /oxygen.*sat/i,
        /o2.*sat/i,
      ],
      weight: [
        /^(weight|wt\.?|body\s*weight|wt\s*(kg)?|weight\s*(kg)?)$/i,
        /body.*weight/i,
      ],
      rbs: [
        /^(rbs|blood\s*sugar|glucose|sugar|random\s*blood\s*sugar|fasting\s*sugar|ppbs|hba1c|blood\s*glucose)$/i,
        /blood.*sugar/i,
        /blood.*glucose/i,
        /\brbs\b/i,
      ],
    };

    for (const column of columns) {
      const cleanColumn = column.trim();
      if (!cleanColumn) continue;

      let matched = false;
      for (const [field, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
          if (pattern.test(cleanColumn)) {
            mapping[cleanColumn] = field;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      // If no match, leave unmapped (user can set manually)
    }

    return mapping;
  }
  
  /**
   * Generate a single unique patient ID within a transaction.
   * Useful as a fallback when the pre-allocated pool is exhausted.
   */
  async generateUniquePatientId(prisma: any): Promise<string> {
    // Uses the atomic DB sequence created by add_patient_id_sequence.sql migration
    const result = await prisma.$queryRaw`SELECT nextval('patient_id_seq') AS nextval`;
    const nextNum = Number(result[0].nextval);
    return `FC-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Pre-allocate a block of unique patient IDs before the import starts.
   * Each call to nextval() is atomic — no two callers ever receive the same number.
   */
  async preallocatePatientIds(prismaClient: any, count: number): Promise<string[]> {
    if (count <= 0) return [];
    // Call nextval once per ID needed — each is guaranteed unique by the sequence
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const result = await prismaClient.$queryRaw`SELECT nextval('patient_id_seq') AS nextval`;
      const num = Number(result[0].nextval);
      ids.push(`FC-${String(num).padStart(3, '0')}`);
    }
    return ids;
  }
  
  /**
   * Check if patient already exists in database
   */
  async checkDuplicate(patientData: any, prisma: any): Promise<DuplicateCheckResult> {
    // Strategy 1: Match by contact (most reliable)
    if (patientData.contact) {
      const existing = await prisma.patient.findFirst({
        where: { contact: patientData.contact },
      });
      if (existing) {
        return { isDuplicate: true, existingPatient: existing, matchedBy: 'contact' };
      }
    }
    
    // Strategy 2: Match by name + age (less reliable but useful)
    if (patientData.name && patientData.age) {
      const existing = await prisma.patient.findFirst({
        where: {
          name: patientData.name,
          age: patientData.age,
        },
      });
      if (existing) {
        return { isDuplicate: true, existingPatient: existing, matchedBy: 'name_age' };
      }
    }
    
    return { isDuplicate: false };
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
      
      // Check required field: Name (very lenient - just needs to exist)
      const name = this.getMappedValue(row, mapping, 'name');
      if (!name || name.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'name',
          message: 'Name is required',
          value: name,
        });
        hasErrors = true;
      } else if (name.toString().trim().length < 2) {
        warnings.push({
          row: rowNumber,
          field: 'name',
          message: 'Name is very short (less than 2 characters)',
          value: name,
        });
      }
      
      // Validate age (only if provided)
      const age = this.getMappedValue(row, mapping, 'age');
      if (age !== null && age !== undefined && age !== '') {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
          warnings.push({
            row: rowNumber,
            field: 'age',
            message: 'Age must be a number between 0 and 150 (will be skipped)',
            value: age,
          });
        }
      }
      
      // Validate gender (only if provided)
      const gender = this.getMappedValue(row, mapping, 'gender');
      if (gender && gender.toString().trim() !== '') {
        const validGenders = ['Male', 'Female', 'Other', 'M', 'F', 'male', 'female', 'other', 'm', 'f'];
        if (!validGenders.includes(gender.toString().trim())) {
          warnings.push({
            row: rowNumber,
            field: 'gender',
            message: 'Invalid gender (will be skipped)',
            value: gender,
          });
        }
      }
      
      // Validate contact (only if provided)
      const contact = this.getMappedValue(row, mapping, 'contact');
      if (contact && contact.toString().trim() !== '') {
        const cleanContact = contact.toString().replace(/\D/g, '');
        if (cleanContact.length < 10 || cleanContact.length > 15) {
          warnings.push({
            row: rowNumber,
            field: 'contact',
            message: 'Contact number should be 10-15 digits',
            value: contact,
          });
        }
      }
      
      // Validate blood group (only if provided)
      const bloodGroup = this.getMappedValue(row, mapping, 'bloodGroup');
      if (bloodGroup && bloodGroup.toString().trim() !== '') {
        const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validGroups.includes(bloodGroup.toString().toUpperCase().trim())) {
          warnings.push({
            row: rowNumber,
            field: 'bloodGroup',
            message: 'Invalid blood group (should be A+, A-, B+, B-, AB+, AB-, O+, O-)',
            value: bloodGroup,
          });
        }
      }
      
      // Validate vitals ranges (only warnings)
      // Temperature: accept both °C (30–45) and °F (86–113) ranges
      const temp = this.getMappedValue(row, mapping, 'temp');
      if (temp && temp.toString().trim() !== '') {
        const tempNum = parseFloat(temp);
        if (!isNaN(tempNum)) {
          const inCelsius = tempNum >= 30 && tempNum <= 45;
          const inFahrenheit = tempNum >= 86 && tempNum <= 113;
          if (!inCelsius && !inFahrenheit) {
            warnings.push({
              row: rowNumber,
              field: 'temp',
              message: 'Temperature seems unusual (expected 30–45°C or 86–113°F)',
              value: temp,
            });
          }
        }
      }
      
      const pulse = this.getMappedValue(row, mapping, 'pulse');
      if (pulse && pulse.toString().trim() !== '') {
        const pulseNum = parseInt(pulse);
        if (!isNaN(pulseNum) && (pulseNum < 40 || pulseNum > 200)) {
          warnings.push({
            row: rowNumber,
            field: 'pulse',
            message: 'Pulse seems unusual (should be 40-200 bpm)',
            value: pulse,
          });
        }
      }
      
      const spo2 = this.getMappedValue(row, mapping, 'spo2');
      if (spo2 && spo2.toString().trim() !== '') {
        const spo2Num = parseInt(spo2);
        if (!isNaN(spo2Num) && (spo2Num < 70 || spo2Num > 100)) {
          warnings.push({
            row: rowNumber,
            field: 'spo2',
            message: 'SPO2 seems unusual (should be 70-100%)',
            value: spo2,
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
   * Map row data to patient and visit objects.
   * Note: patientId is intentionally left empty here — the execute route
   * assigns pre-allocated IDs from the pool to avoid race conditions.
   */
  async mapRowToPatientAndVisit(row: any, mapping: ColumnMapping): Promise<{ patient: any; visit: any | null }> {
    const patient = {
      patientId: '', // assigned by execute route from pre-allocated pool
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
