/**
 * Payment system configuration
 * Supports multiple payment providers
 */

export type PaymentProvider = 'stripe' | 'razorpay' | 'paypal';

export interface PaymentConfig {
  provider: PaymentProvider;
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'canceled';
  items: InvoiceItem[];
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Subscription {
  id: string;
  patientId: string;
  planId: string;
  status: 'active' | 'paused' | 'canceled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  trialDays?: number;
  features: string[];
}

// Get payment config from environment
export function getPaymentConfig(): PaymentConfig {
  const provider = (process.env.PAYMENT_PROVIDER || 'stripe') as PaymentProvider;

  if (provider === 'stripe') {
    return {
      provider,
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    };
  }

  if (provider === 'razorpay') {
    return {
      provider,
      publicKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      secretKey: process.env.RAZORPAY_KEY_SECRET || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    };
  }

  if (provider === 'paypal') {
    return {
      provider,
      publicKey: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      secretKey: process.env.PAYPAL_SECRET || '',
    };
  }

  throw new Error(`Unsupported payment provider: ${provider}`);
}

// Validate payment config
export function validatePaymentConfig(config: PaymentConfig): boolean {
  if (!config.publicKey || !config.secretKey) {
    console.error('Payment configuration incomplete');
    return false;
  }
  return true;
}
