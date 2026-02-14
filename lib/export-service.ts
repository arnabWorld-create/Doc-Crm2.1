/**
 * Data Export Service
 * Handles exporting patient data to Excel, CSV, and JSON formats
 */

import * as XLSX from 'xlsx';
import prisma from './prisma';

export interface ExportOptions {
  includeVisits?: boolean;
  includeMedications?: boolean;
  includeAppointments?: boolean;
}

export class ExportService {
  /**
   * Export all data as Excel workbook
   */
  async exportToExcel(options: ExportOptions = {}): Promise<Buffer> {
    const { includeVisits = true, includeMedications = true, includeAppointments = true } = options;
    
    // Fetch all data in parallel
    const [patients, visits, appointments] = await Promise.all([
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      includeVisits ? prisma.visit.findMany({
        include: { patient: true },
        orderBy: { visitDate: 'desc' },
      }) : Promise.resolve([]),
      includeAppointments ? prisma.appointment.findMany({
        include: { patient: true },
        orderBy: { appointmentDate: 'desc' },
      }) : Promise.resolve([]),
    ]);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Patients
    const patientsData = patients.map(p => ({
      'Patient ID': p.patientId,
      'Name': p.name,
      'Age': p.age || '',
      'Gender': p.gender || '',
      'Contact': p.contact || '',
      'Blood Group': p.bloodGroup || '',
      'Address': p.address || '',
      'Allergies': p.allergies || '',
      'Chronic Conditions': p.chronicConditions || '',
      'Created Date': p.createdAt.toLocaleDateString(),
    }));
    
    const patientsSheet = XLSX.utils.json_to_sheet(patientsData);
    XLSX.utils.book_append_sheet(workbook, patientsSheet, 'Patients');
    
    // Sheet 2: Visits (if included)
    if (includeVisits && visits.length > 0) {
      const visitsData = visits.map(v => ({
        'Visit Date': v.visitDate.toLocaleDateString(),
        'Patient Name': v.patient.name,
        'Patient ID': v.patient.patientId,
        'Visit Type': v.visitType || '',
        'Chief Complaint': v.chiefComplaint || '',
        'Diagnosis': v.diagnosis || '',
        'Treatment': v.treatment || '',
        'Medicines': v.medicines || '',
        'Follow-up Date': v.followUpDate?.toLocaleDateString() || '',
        'Notes': v.notes || '',
      }));
      
      const visitsSheet = XLSX.utils.json_to_sheet(visitsData);
      XLSX.utils.book_append_sheet(workbook, visitsSheet, 'Visits');
    }
    
    // Sheet 3: Appointments (if included)
    if (includeAppointments && appointments.length > 0) {
      const appointmentsData = appointments.map(a => ({
        'Date': a.appointmentDate.toLocaleDateString(),
        'Time': a.appointmentTime,
        'Patient Name': a.patient?.name || a.tempPatientName || '',
        'Patient ID': a.patient?.patientId || '',
        'Type': a.appointmentType,
        'Status': a.status,
        'Reason': a.reason || '',
        'Notes': a.notes || '',
      }));
      
      const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
      XLSX.utils.book_append_sheet(workbook, appointmentsSheet, 'Appointments');
    }
    
    // Generate buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }
  
  /**
   * Export as JSON (complete backup)
   */
  async exportToJSON(options: ExportOptions = {}): Promise<any> {
    const { includeVisits = true, includeAppointments = true } = options;
    
    // Fetch clinic info
    const clinic = await prisma.clinicProfile.findFirst();
    
    // Fetch all data
    const [patients, visits, appointments] = await Promise.all([
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      includeVisits ? prisma.visit.findMany({
        orderBy: { visitDate: 'desc' },
      }) : Promise.resolve([]),
      includeAppointments ? prisma.appointment.findMany({
        orderBy: { appointmentDate: 'desc' },
      }) : Promise.resolve([]),
    ]);
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      clinic: clinic ? {
        name: clinic.clinicName,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
      } : null,
      data: {
        patients,
        visits: includeVisits ? visits : undefined,
        appointments: includeAppointments ? appointments : undefined,
      },
      stats: {
        totalPatients: patients.length,
        totalVisits: visits.length,
        totalAppointments: appointments.length,
      },
    };
  }
  
  /**
   * Export as CSV (returns multiple CSV strings)
   */
  async exportToCSV(options: ExportOptions = {}): Promise<{ [filename: string]: string }> {
    const { includeVisits = true, includeAppointments = true } = options;
    
    // Fetch all data
    const [patients, visits, appointments] = await Promise.all([
      prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      includeVisits ? prisma.visit.findMany({
        include: { patient: true },
        orderBy: { visitDate: 'desc' },
      }) : Promise.resolve([]),
      includeAppointments ? prisma.appointment.findMany({
        include: { patient: true },
        orderBy: { appointmentDate: 'desc' },
      }) : Promise.resolve([]),
    ]);
    
    const result: { [filename: string]: string } = {};
    
    // Patients CSV
    result['patients.csv'] = this.convertToCSV(
      patients.map(p => ({
        'Patient ID': p.patientId,
        'Name': p.name,
        'Age': p.age || '',
        'Gender': p.gender || '',
        'Contact': p.contact || '',
        'Blood Group': p.bloodGroup || '',
        'Address': p.address || '',
        'Allergies': p.allergies || '',
        'Chronic Conditions': p.chronicConditions || '',
        'Created Date': p.createdAt.toISOString(),
      }))
    );
    
    // Visits CSV (if included)
    if (includeVisits && visits.length > 0) {
      result['visits.csv'] = this.convertToCSV(
        visits.map(v => ({
          'Visit Date': v.visitDate.toISOString(),
          'Patient Name': v.patient.name,
          'Patient ID': v.patient.patientId,
          'Visit Type': v.visitType || '',
          'Chief Complaint': v.chiefComplaint || '',
          'Diagnosis': v.diagnosis || '',
          'Treatment': v.treatment || '',
          'Medicines': v.medicines || '',
          'Follow-up Date': v.followUpDate?.toISOString() || '',
        }))
      );
    }
    
    // Appointments CSV (if included)
    if (includeAppointments && appointments.length > 0) {
      result['appointments.csv'] = this.convertToCSV(
        appointments.map(a => ({
          'Date': a.appointmentDate.toISOString(),
          'Time': a.appointmentTime,
          'Patient Name': a.patient?.name || a.tempPatientName || '',
          'Patient ID': a.patient?.patientId || '',
          'Type': a.appointmentType,
          'Status': a.status,
          'Reason': a.reason || '',
        }))
      );
    }
    
    return result;
  }
  
  /**
   * Convert array of objects to CSV string
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );
    
    // Combine header and rows
    return [headers.join(','), ...rows].join('\n');
  }
}
