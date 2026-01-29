import { z } from 'zod';

export const reportFileSchema = z.object({
  url: z.string().url(),
  filename: z.string(),
  uploadedAt: z.string().datetime(),
});

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string().optional().nullable(),
  dose: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  timing: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
  startFrom: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
});

export const visitFeeItemSchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  amount: z.number(),
  quantity: z.number(),
  discount: z.number(),
  total: z.number(),
});

export const patientSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  age: z.coerce.number().int().positive().optional().nullable(),
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  contact: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  chronicConditions: z.string().optional().nullable(),
  signs: z.string().optional().nullable(),
  investigations: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  chiefComplaint: z.string().optional().nullable(),
  bloodPressure: z.string().optional().nullable(),
  bpSystolic: z.coerce.number().int().optional().nullable(),
  bpDiastolic: z.coerce.number().int().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  temp: z.coerce.number().optional().nullable(),
  spo2: z.coerce.number().int().optional().nullable(),
  pulse: z.coerce.number().int().optional().nullable(),
  rbs: z.coerce.number().int().optional().nullable(),
  treatment: z.string().optional().nullable(),
  medicines: z.string().optional().nullable(),
  medications: z.array(medicationSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  history: z.string().optional().nullable(),
  reports: z.array(reportFileSchema).optional().nullable(),
  referredTo: z.string().optional().nullable(),
  consultationDate: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  paidBy: z.enum(["cash", "upi", "card"]).optional().nullable(),
  visitFees: z.array(visitFeeItemSchema).optional().nullable(),
  totalFeeAmount: z.number().optional().nullable(),
});

export const visitSchema = z.object({
  visitDate: z.string(),
  visitType: z.string(),
  chiefComplaint: z.string().optional(),
  signs: z.string().optional(),
  investigations: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  medicines: z.string().optional().nullable(),
  medications: z.array(medicationSchema).optional().nullable(),
  temp: z.string().optional(),
  spo2: z.string().optional(),
  pulse: z.string().optional(),
  bloodPressure: z.string().optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
  referredTo: z.string().optional(),
  reports: z.string().optional(),
  paidBy: z.enum(["cash", "upi", "card"]).optional().nullable(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type VisitFormData = z.infer<typeof visitSchema>;

