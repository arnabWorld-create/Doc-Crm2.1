/**
 * Utility functions for handling visit fees
 */

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
 * Extract fees from visit notes
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
