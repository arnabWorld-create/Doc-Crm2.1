# Quick Start: Payment System

Get the payment system up and running in 15 minutes.

---

## 🚀 5-Minute Setup

### Step 1: Add Environment Variables

```env
# .env.local
PAYMENT_PROVIDER=stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 2: Update Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model Patient {
  // ... existing fields
  payments       Payment[]
  invoices       Invoice[]
  subscriptions  Subscription[]
}

// Add all models from prisma/payment-schema.prisma
```

### Step 3: Run Migration

```bash
npx prisma migrate dev --name add_payments
```

### Step 4: Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Done! ✅

---

## 💳 Quick Examples

### Create Payment

```typescript
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: 'patient-123',
    amount: 100,
    currency: 'USD',
    description: 'Consultation Fee',
  }),
});

const { payment, paymentIntent } = await response.json();
```

### Create Invoice

```typescript
const response = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: 'patient-123',
    dueDate: '2024-02-15',
    items: [
      {
        description: 'Consultation',
        quantity: 1,
        unitPrice: 100,
      },
    ],
  }),
});

const invoice = await response.json();
```

### Create Subscription

```typescript
const response = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: 'patient-123',
    planId: 'plan-123',
  }),
});

const subscription = await response.json();
```

### Refund Payment

```typescript
const response = await fetch('/api/payments/payment-123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 50,
    reason: 'Patient requested refund',
  }),
});

const { payment, refund } = await response.json();
```

---

## 🎨 Use Payment Form

```typescript
import { PaymentForm } from '@/components/PaymentForm';

export function CheckoutPage() {
  return (
    <PaymentForm
      amount={100}
      currency="USD"
      description="Consultation Fee"
      patientId="patient-123"
      invoiceId="invoice-123"
      onSuccess={(paymentId) => {
        console.log('Payment successful:', paymentId);
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}
```

---

## 📊 Payment Statuses

```
pending    → Payment intent created, awaiting confirmation
processing → Payment is being processed
succeeded  → Payment completed successfully
failed     → Payment failed
refunded   → Payment has been refunded
```

---

## 📋 Invoice Statuses

```
draft      → Invoice created but not sent
sent       → Invoice sent to patient
paid       → Payment received
overdue    → Payment not received by due date
canceled   → Invoice canceled
```

---

## 🔄 Subscription Statuses

```
active     → Subscription is active
paused     → Subscription is paused
canceled   → Subscription canceled
expired    → Subscription period ended
```

---

## 🧪 Test Payments

### Test with Stripe

Use these test card numbers:

```
4242 4242 4242 4242  → Success
4000 0000 0000 0002  → Decline
4000 0025 0000 3155  → Require authentication
```

### Test with Razorpay

Use test mode in Razorpay dashboard.

---

## 🔐 Security Notes

- ✅ All API routes require authentication
- ✅ All inputs validated with Zod
- ✅ Rate limiting enabled
- ✅ Sensitive data logged securely
- ✅ HTTPS required in production

---

## 📁 Files Overview

### Core
- `lib/payment-config.ts` - Configuration
- `lib/payment-service.ts` - Service layer
- `components/PaymentForm.tsx` - UI component

### API Routes
- `app/api/payments/route.ts` - Create/list payments
- `app/api/payments/[id]/route.ts` - Confirm/refund
- `app/api/invoices/route.ts` - Create/list invoices
- `app/api/invoices/[id]/route.ts` - Update/cancel
- `app/api/subscriptions/route.ts` - Create/list
- `app/api/subscriptions/[id]/route.ts` - Cancel
- `app/api/subscription-plans/route.ts` - Manage plans

---

## 🚀 Next Steps

1. ✅ Set up environment variables
2. ✅ Update Prisma schema
3. ✅ Run migration
4. ✅ Install dependencies
5. [ ] Integrate PaymentForm in checkout page
6. [ ] Set up webhook handlers
7. [ ] Test payment flow
8. [ ] Deploy to production

---

## 💡 Common Tasks

### Add Payment to Appointment

```typescript
// In appointment confirmation
const payment = await fetch('/api/payments', {
  method: 'POST',
  body: JSON.stringify({
    patientId: appointment.patientId,
    amount: 50,
    description: `Appointment on ${appointment.date}`,
  }),
});
```

### Generate Invoice for Visit

```typescript
// After visit completion
const invoice = await fetch('/api/invoices', {
  method: 'POST',
  body: JSON.stringify({
    patientId: visit.patientId,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [
      {
        description: 'Consultation',
        quantity: 1,
        unitPrice: 100,
      },
    ],
  }),
});
```

### Create Subscription Plan

```typescript
// Create a premium plan
const plan = await fetch('/api/subscription-plans', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Premium',
    amount: 99,
    interval: 'month',
    features: [
      'Unlimited consultations',
      'Priority support',
    ],
  }),
});
```

---

## 🐛 Troubleshooting

### Payment fails with "Invalid API Key"
- Check `STRIPE_SECRET_KEY` is set correctly
- Verify it's not the public key
- Check environment variables are loaded

### Invoice not created
- Verify patient exists
- Check dueDate is valid
- Verify items array is not empty

### Subscription creation fails
- Verify plan exists and is active
- Check patient exists
- Verify planId is correct

---

## 📞 Support

- **Full Guide:** `PAYMENT_SYSTEM_GUIDE.md`
- **Code:** Check component files for examples
- **API:** See route files for endpoint details

---

## ✨ Summary

Payment system is ready to use:

✅ **Payments** - Create and manage payments
✅ **Invoices** - Generate and track invoices
✅ **Subscriptions** - Recurring billing
✅ **Refunds** - Process refunds
✅ **Security** - Built-in protection
✅ **Logging** - Full audit trail

**Ready to integrate!** 🚀
