# Fee Management System Guide

## 🎯 Understanding the Two-Part Fee System

Your clinic has a **two-part fee system** to manage charges properly:

---

## Part 1: Service Fee Templates (Setup Once)

**Location:** Settings → Fees (or click "Fees" in navbar)

**What it is:**
- General fee structure for your clinic
- Set once, reused for all patients
- Like a price list

**Examples:**
- OPD Consultation: ₹500
- Follow-up Consultation: ₹300
- Lab Test: ₹200
- Procedure: ₹1000

**When to use:**
- First time setup
- When you change your pricing
- When you add new services

---

## Part 2: Visit Fees (Record for Each Patient Visit)

**Location:** Patient Visit Form → Visit Fees section

**What it is:**
- Specific fee charged for THIS patient's THIS visit
- Links to the patient's visit record
- Can be different from template (e.g., with discount)
- Creates an invoice/payment record

**How it works:**

1. **Create a Visit** for a patient
2. **Add Fees to that Visit:**
   - Select service from your fee list
   - Set quantity (if multiple services)
   - Apply discount if needed (e.g., 10% off)
   - System calculates total

3. **Example:**
   ```
   Patient: John Doe
   Visit Date: 20-Dec-2025
   
   Fees Added:
   - OPD Consultation (₹500) × 1 = ₹500
   - Lab Test (₹200) × 1 = ₹200
   - Discount: 10% = -₹70
   
   Total: ₹630
   ```

4. **Creates Invoice:**
   - Automatically generates invoice
   - Patient can pay from Payments page
   - Tracks payment status

---

## 📊 Workflow Example

### Step 1: Setup Service Fees (One Time)
```
Go to: Fees (in navbar)
Add:
  - OPD Consultation: ₹500
  - Follow-up: ₹300
  - Lab Test: ₹200
```

### Step 2: Create Patient Visit
```
Go to: Patients → Select Patient → Add Visit
Fill in:
  - Visit Date
  - Vitals
  - Diagnosis
  - Medications
  - etc.
```

### Step 3: Add Fees to Visit
```
In Visit Form → Visit Fees section:
  - Select "OPD Consultation" (₹500)
  - Quantity: 1
  - Discount: 0%
  - Click "Add"
  
  Total: ₹500
```

### Step 4: Save Visit
```
Click "Save Visit"
System creates:
  - Visit record
  - Invoice (₹500)
  - Payment record
```

### Step 5: Patient Pays
```
Go to: Payments page
Patient sees invoice
Clicks "Pay Now"
Pays ₹500
```

---

## 💡 Key Differences

| Aspect | Service Fee | Visit Fee |
|--------|------------|-----------|
| **Purpose** | Price list | Actual charge |
| **When Set** | Once during setup | For each visit |
| **Reusable** | Yes, for all patients | No, specific to one visit |
| **Can Vary** | No | Yes (with discounts) |
| **Creates Invoice** | No | Yes |
| **Tracks Payment** | No | Yes |

---

## 🎯 Common Scenarios

### Scenario 1: Standard OPD Visit
```
1. Setup: OPD Consultation = ₹500
2. Patient visits
3. Add fee: OPD Consultation (₹500)
4. Total: ₹500
5. Patient pays ₹500
```

### Scenario 2: Multiple Services in One Visit
```
1. Setup:
   - OPD Consultation = ₹500
   - Lab Test = ₹200
   
2. Patient visits and needs both
3. Add fees:
   - OPD Consultation (₹500) × 1
   - Lab Test (₹200) × 1
4. Total: ₹700
5. Patient pays ₹700
```

### Scenario 3: With Discount
```
1. Setup: OPD Consultation = ₹500
2. Patient is regular, give 10% discount
3. Add fee:
   - OPD Consultation (₹500)
   - Discount: 10%
4. Total: ₹450 (₹500 - ₹50)
5. Patient pays ₹450
```

### Scenario 4: Multiple Same Services
```
1. Setup: Lab Test = ₹200
2. Patient needs 3 tests
3. Add fee:
   - Lab Test (₹200) × 3
4. Total: ₹600
5. Patient pays ₹600
```

---

## ✅ Step-by-Step: First Time Setup

### 1. Create Service Fees
- Click "Fees" in navbar
- Click "Add Fee"
- Add your services:
  - OPD Consultation: ₹500
  - Follow-up: ₹300
  - Lab Test: ₹200
  - Procedure: ₹1000

### 2. Create Patient Visit
- Go to Patients
- Select a patient
- Click "Add Visit"
- Fill in medical details

### 3. Add Fees to Visit
- Scroll to "Visit Fees" section
- Select "OPD Consultation"
- Quantity: 1
- Discount: 0%
- Click "Add"

### 4. Save Visit
- Click "Save Visit"
- Invoice created automatically

### 5. Patient Pays
- Go to Payments
- Click "Pay Now" on invoice
- Patient pays ₹500

---

## 🔄 Workflow Summary

```
┌─────────────────────────────────────┐
│  1. Setup Service Fees (One Time)   │
│     Fees → Add OPD, Lab, etc.       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Create Patient Visit            │
│     Patients → Add Visit            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Add Fees to Visit               │
│     Visit Fees → Select Service     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Save Visit                      │
│     Creates Invoice Automatically   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Patient Pays                    │
│     Payments → Pay Invoice          │
└─────────────────────────────────────┘
```

---

## 📝 Tips

1. **Setup Fees First** - Create all your service fees before seeing patients
2. **Use Consistent Names** - Use same names for same services
3. **Track Discounts** - Always record discounts for accounting
4. **Multiple Services** - Add all services for one visit at once
5. **Payment Tracking** - Check Payments page to see who paid

---

## ❓ FAQ

**Q: Can I change service fees later?**
A: Yes, go to Fees page and edit. New visits will use new price.

**Q: What if I give a discount?**
A: Add the fee, then set discount % in Visit Fees section.

**Q: Can I charge different amounts for same service?**
A: Yes, use discount feature to adjust per visit.

**Q: Does it create invoice automatically?**
A: Yes, when you save the visit with fees.

**Q: Can patient see the fees?**
A: Yes, in Payments page as invoice.

**Q: What if patient doesn't pay?**
A: Invoice stays in Payments page, marked as pending.

---

## 🎉 You're All Set!

Your fee system is ready to use. Start by:
1. Setting up your service fees
2. Creating patient visits
3. Adding fees to each visit
4. Tracking payments

Happy billing! 💳
