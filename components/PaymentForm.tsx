'use client';

import { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { notificationManager } from '@/lib/notifications';
import { ButtonLoader } from './LoadingStates';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  description?: string;
  invoiceId?: string;
  patientId: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({
  amount,
  currency = 'INR',
  description,
  invoiceId,
  patientId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // Create payment intent
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          amount,
          currency,
          description,
          invoiceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const { payment, paymentIntent } = await response.json();

      // In a real implementation, you would integrate with Stripe/Razorpay here
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirm payment
      const confirmResponse = await fetch(`/api/payments/${payment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm payment');
      }

      setPaymentStatus('success');
      notificationManager.success('Payment Successful', `Payment of ₹${amount} processed successfully`);

      if (onSuccess) {
        onSuccess(payment.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      setPaymentStatus('error');
      setErrorMessage(message);
      notificationManager.error('Payment Failed', message);

      if (onError) {
        onError(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-brand-teal/10 rounded-lg">
          <CreditCard className="w-6 h-6 text-brand-teal" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Payment Details</h3>
          <p className="text-sm text-gray-600">Complete your payment securely</p>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Amount:</span>
          <span className="text-2xl font-bold text-brand-teal">
            ₹{amount.toFixed(2)}
          </span>
        </div>
        {description && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Description:</span>
            <span className="text-gray-900">{description}</span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {paymentStatus === 'success' && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-green-900">Payment Successful</h4>
            <p className="text-sm text-green-700">Your payment has been processed successfully.</p>
          </div>
        </div>
      )}

      {paymentStatus === 'error' && errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Payment Failed</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {paymentStatus !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Details - Placeholder for Stripe/Razorpay integration */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              💳 In production, integrate with Stripe, Razorpay, or PayPal for secure card processing
            </p>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              required
              className="w-4 h-4 rounded border-2 border-gray-300 text-brand-teal focus:ring-2 focus:ring-brand-teal/20 mt-1"
            />
            <span className="text-sm text-gray-600">
              I agree to the payment terms and conditions
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || paymentStatus === 'processing'}
            className="w-full px-6 py-3 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ButtonLoader isLoading={isProcessing}>
              Pay ₹{amount.toFixed(2)}
            </ButtonLoader>
          </button>
        </form>
      )}

      {/* Security Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          🔒 Your payment information is encrypted and secure
        </p>
      </div>
    </div>
  );
}
