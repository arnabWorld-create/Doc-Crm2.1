/**
 * Utility functions for handling visit fees
 */

import prisma from './prisma';

export interface VisitFeeItem {
  id: string;
  serviceName: string;
  amount: number;
  quantity: number;
  discount: number;
  total: number;
}

export interface FeesData {
  fees: VisitFeeItem[];
  total: number;
}

/**
 * Get fees for a visit from the VisitFee table
 */
export async function getVisitFees(visitId: string): Promise<FeesData | null> {
  const fees = await prisma.visitFee.findMany({
    where: { visitId },
    select: {
      id: true,
      serviceName: true,
      amount: true,
      quantity: true,
      discount: true,
      total: true,
    }
  });

  if (fees.length === 0) return null;

  const total = fees.reduce((sum, fee) => sum + fee.total, 0);

  return {
    fees,
    total,
  };
}

/**
 * Extract fees from visit notes (DEPRECATED - for backward compatibility only)
 * Use getVisitFees() instead
 */
export function extractFeesFromNotes(notes: string | null | undefined): FeesData | null {
  if (!notes) return null;

  const match = notes.match(/__FEES_JSON__(.*?)__FEES_JSON__/);
  if (!match || !match[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.error('Failed to parse fees from notes:', error);
    return null;
  }
}

/**
 * Remove fees from notes (returns notes without fees)
 */
export function removeFeesFromNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  return notes.replace(/__FEES_JSON__.*?__FEES_JSON__/g, '').trim();
}

/**
 * Format fees for display
 */
export function formatFeesForDisplay(fees: VisitFeeItem[]): string {
  return fees.map(f => `${f.serviceName}: ₹${f.total.toFixed(2)}`).join(' | ');
}
