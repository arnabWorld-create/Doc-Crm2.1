import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const month = searchParams.get('month');

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { contact: { contains: search } },
        { patientId: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const visitFilter: any = {};
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const monthStart = new Date(year, monthNum - 1, 1);
      const monthEnd = new Date(year, monthNum, 1);
      visitFilter.visitDate = { gte: monthStart, lt: monthEnd };
    } else if (startDate || endDate) {
      visitFilter.visitDate = {};
      if (startDate) visitFilter.visitDate.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        visitFilter.visitDate.lt = endDateTime;
      }
    }

    if (Object.keys(visitFilter).length > 0) {
      whereClause.visits = { some: visitFilter };
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten data for Excel (one row per visit)
    const excelData: any[] = [];
    patients.forEach(patient => {
      patient.visits.forEach(visit => {
        excelData.push({
          'Patient ID': patient.patientId,
          'Name': patient.name,
          'Age': patient.age || 'N/A',
          'Gender': patient.gender || 'N/A',
          'Contact': patient.contact || 'N/A',
          'Visit Date': visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : 'N/A',
          'Visit Type': visit.visitType,
          'Chief Complaint': visit.chiefComplaint || 'N/A',
          'Signs & Symptoms': visit.signs || 'N/A',
          'Diagnosis': visit.diagnosis || 'N/A',
          'Temperature': visit.temp || 'N/A',
          'SpO2': visit.spo2 || 'N/A',
          'Pulse': visit.pulse || 'N/A',
          'BP': visit.bloodPressure || 'N/A',
          'Treatment': visit.treatment || 'N/A',
          'Medicines': visit.medicines || 'N/A',
          'Follow-up Date': visit.followUpDate ? new Date(visit.followUpDate).toLocaleDateString() : 'N/A',
          'Referred To': visit.referredTo || 'N/A',
        });
      });
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 20 },
      { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 30 },
      { wch: 30 }, { wch: 15 }, { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patient Visits');
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="patient-visits-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Failed to export:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to export data' }), { status: 500 });
  }
}
