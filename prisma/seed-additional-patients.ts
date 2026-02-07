import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding 30 additional Indian patients with visit data...');

  const indianNames = [
    { name: 'Ramesh Gupta', age: 52, gender: 'Male', contact: '+91-9876543211', address: 'Karol Bagh, New Delhi', bloodGroup: 'A+' },
    { name: 'Anjali Verma', age: 29, gender: 'Female', contact: '+91-9123456780', address: 'Indira Nagar, Bangalore', bloodGroup: 'B+' },
    { name: 'Suresh Yadav', age: 45, gender: 'Male', contact: '+91-9988776656', address: 'Andheri West, Mumbai', bloodGroup: 'O+' },
    { name: 'Deepa Krishnan', age: 38, gender: 'Female', contact: '+91-9445566779', address: 'Anna Nagar, Chennai', bloodGroup: 'AB+' },
    { name: 'Karan Mehta', age: 33, gender: 'Male', contact: '+91-9876512346', address: 'Satellite, Ahmedabad', bloodGroup: 'B-' },
    { name: 'Pooja Sharma', age: 27, gender: 'Female', contact: '+91-9334455668', address: 'Rajendra Nagar, Patna', bloodGroup: 'O-' },
    { name: 'Anil Kumar', age: 58, gender: 'Male', contact: '+91-9123987655', address: 'Jubilee Hills, Hyderabad', bloodGroup: 'A-' },
    { name: 'Sneha Joshi', age: 31, gender: 'Female', contact: '+91-9876098761', address: 'Koregaon Park, Pune', bloodGroup: 'B+' },
    { name: 'Manoj Tiwari', age: 41, gender: 'Male', contact: '+91-9811223345', address: 'Dwarka, New Delhi', bloodGroup: 'O+' },
    { name: 'Divya Menon', age: 36, gender: 'Female', contact: '+91-9447788991', address: 'Trivandrum, Kerala', bloodGroup: 'A+' },
    { name: 'Sanjay Kapoor', age: 49, gender: 'Male', contact: '+91-9876543212', address: 'Vasant Vihar, New Delhi', bloodGroup: 'B+' },
    { name: 'Rekha Pillai', age: 44, gender: 'Female', contact: '+91-9123456781', address: 'Whitefield, Bangalore', bloodGroup: 'O+' },
    { name: 'Harish Chandra', age: 56, gender: 'Male', contact: '+91-9988776657', address: 'Bandra East, Mumbai', bloodGroup: 'A+' },
    { name: 'Nisha Reddy', age: 32, gender: 'Female', contact: '+91-9445566780', address: 'Adyar, Chennai', bloodGroup: 'AB-' },
    { name: 'Prakash Jain', age: 39, gender: 'Male', contact: '+91-9876512347', address: 'Navrangpura, Ahmedabad', bloodGroup: 'B+' },
    { name: 'Geeta Devi', age: 61, gender: 'Female', contact: '+91-9334455669', address: 'Kankarbagh, Patna', bloodGroup: 'O+' },
    { name: 'Ravi Shankar', age: 47, gender: 'Male', contact: '+91-9123987656', address: 'Madhapur, Hyderabad', bloodGroup: 'A+' },
    { name: 'Priyanka Kulkarni', age: 28, gender: 'Female', contact: '+91-9876098762', address: 'Hinjewadi, Pune', bloodGroup: 'B-' },
    { name: 'Ashok Mishra', age: 53, gender: 'Male', contact: '+91-9811223346', address: 'Lajpat Nagar, New Delhi', bloodGroup: 'O+' },
    { name: 'Swati Nambiar', age: 35, gender: 'Female', contact: '+91-9447788992', address: 'Ernakulam, Kochi', bloodGroup: 'A-' },
    { name: 'Vinod Agarwal', age: 50, gender: 'Male', contact: '+91-9876543213', address: 'Pitampura, New Delhi', bloodGroup: 'B+' },
    { name: 'Madhuri Desai', age: 42, gender: 'Female', contact: '+91-9123456782', address: 'Jayanagar, Bangalore', bloodGroup: 'O+' },
    { name: 'Rajiv Saxena', age: 46, gender: 'Male', contact: '+91-9988776658', address: 'Powai, Mumbai', bloodGroup: 'A+' },
    { name: 'Shilpa Iyer', age: 30, gender: 'Female', contact: '+91-9445566781', address: 'Velachery, Chennai', bloodGroup: 'AB+' },
    { name: 'Dinesh Patel', age: 54, gender: 'Male', contact: '+91-9876512348', address: 'Maninagar, Ahmedabad', bloodGroup: 'B+' },
    { name: 'Kaveri Singh', age: 37, gender: 'Female', contact: '+91-9334455670', address: 'Boring Canal Road, Patna', bloodGroup: 'O-' },
    { name: 'Mohan Das', age: 59, gender: 'Male', contact: '+91-9123987657', address: 'Gachibowli, Hyderabad', bloodGroup: 'A+' },
    { name: 'Asha Bhatt', age: 34, gender: 'Female', contact: '+91-9876098763', address: 'Viman Nagar, Pune', bloodGroup: 'B+' },
    { name: 'Sunil Rao', age: 48, gender: 'Male', contact: '+91-9811223347', address: 'Saket, New Delhi', bloodGroup: 'O+' },
    { name: 'Lata Menon', age: 40, gender: 'Female', contact: '+91-9447788993', address: 'Palarivattom, Kochi', bloodGroup: 'A+' },
  ];

  const conditions = [
    {
      complaint: 'बुखार और सर्दी (Fever and cold)',
      signs: 'Fever, runny nose, sore throat, body ache',
      diagnosis: 'Upper Respiratory Tract Infection (URTI)',
      medicines: 'Paracetamol 650mg TID\nCetirizine 10mg OD\nAzithromycin 500mg OD x 3 days',
      treatment: 'Rest, warm fluids, steam inhalation',
      investigations: 'None required',
      fee: 500,
    },
    {
      complaint: 'पेट दर्द और दस्त (Stomach pain and loose motions)',
      signs: 'Abdominal cramps, diarrhea, nausea, dehydration',
      diagnosis: 'Acute Gastroenteritis',
      medicines: 'ORS sachets\nLoperamide 2mg SOS\nNorfloxacin 400mg BD\nProbiotics',
      treatment: 'Oral rehydration, bland diet, avoid spicy food',
      investigations: 'Stool routine test',
      fee: 600,
    },
    {
      complaint: 'सिरदर्द और थकान (Headache and fatigue)',
      signs: 'Persistent headache, tiredness, lack of concentration',
      diagnosis: 'Tension Headache, Stress',
      medicines: 'Ibuprofen 400mg BD\nVitamin B complex OD\nAmitriptyline 10mg HS',
      treatment: 'Adequate sleep, stress management, regular meals',
      investigations: 'None',
      fee: 450,
    },
    {
      complaint: 'खांसी और गले में खराश (Cough and throat irritation)',
      signs: 'Dry cough, throat pain, hoarseness',
      diagnosis: 'Pharyngitis',
      medicines: 'Cough syrup 10ml TID\nLozenges\nAmoxicillin 500mg TID',
      treatment: 'Warm water gargles, avoid cold drinks',
      investigations: 'Throat swab if needed',
      fee: 550,
    },
    {
      complaint: 'जोड़ों में दर्द (Joint pain)',
      signs: 'Multiple joint pain, stiffness, swelling',
      diagnosis: 'Arthralgia',
      medicines: 'Diclofenac 50mg BD\nCalcium + Vit D3 OD\nMethylcobalamin 1500mcg OD',
      treatment: 'Hot fomentation, physiotherapy',
      investigations: 'X-ray, Vitamin D levels',
      fee: 700,
    },
    {
      complaint: 'चक्कर आना (Dizziness and vertigo)',
      signs: 'Spinning sensation, nausea, imbalance',
      diagnosis: 'Benign Paroxysmal Positional Vertigo (BPPV)',
      medicines: 'Betahistine 16mg TID\nCinnarizine 25mg BD\nDomperidone 10mg TID',
      treatment: 'Epley maneuver, avoid sudden head movements',
      investigations: 'None',
      fee: 650,
    },
    {
      complaint: 'त्वचा पर चकत्ते (Skin rash and itching)',
      signs: 'Red patches, itching, dry skin',
      diagnosis: 'Allergic Dermatitis',
      medicines: 'Cetirizine 10mg OD\nHydrocortisone cream (topical)\nCalamine lotion',
      treatment: 'Avoid allergens, moisturize skin',
      investigations: 'Allergy test',
      fee: 500,
    },
    {
      complaint: 'सीने में जलन (Acidity and heartburn)',
      signs: 'Burning sensation in chest, belching, bloating',
      diagnosis: 'Gastroesophageal Reflux Disease (GERD)',
      medicines: 'Pantoprazole 40mg OD\nDomperidone 10mg BD\nDigene syrup SOS',
      treatment: 'Small frequent meals, avoid spicy food, elevate head',
      investigations: 'Endoscopy if persistent',
      fee: 600,
    },
    {
      complaint: 'नींद न आना (Insomnia)',
      signs: 'Difficulty falling asleep, frequent waking, daytime fatigue',
      diagnosis: 'Insomnia',
      medicines: 'Zolpidem 5mg HS\nMelatonin 3mg HS\nAlprazolam 0.25mg HS',
      treatment: 'Sleep hygiene, avoid caffeine, relaxation techniques',
      investigations: 'None',
      fee: 550,
    },
    {
      complaint: 'पेशाब में जलन (Burning urination)',
      signs: 'Dysuria, frequency, urgency, lower abdominal pain',
      diagnosis: 'Urinary Tract Infection (UTI)',
      medicines: 'Norfloxacin 400mg BD\nCranberry extract\nAlkaline citrate syrup',
      treatment: 'Plenty of water, maintain hygiene',
      investigations: 'Urine routine & culture',
      fee: 650,
    },
  ];

  let patientCounter = 41; // Starting from FC-041 to avoid conflicts
  console.log(`📊 Starting from FC-${String(patientCounter).padStart(3, '0')}`);


  for (let i = 0; i < 30; i++) {
    const patientData = indianNames[i];
    const patientId = `FC-${String(patientCounter).padStart(3, '0')}`;
    
    // Random number of visits (1-3)
    const numVisits = Math.floor(Math.random() * 3) + 1;
    const visits = [];

    for (let v = 0; v < numVisits; v++) {
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const daysAgo = Math.floor(Math.random() * 60) + (v * 20); // Spread visits over time
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - daysAgo);

      const followUpDate = new Date(visitDate);
      followUpDate.setDate(followUpDate.getDate() + (Math.floor(Math.random() * 14) + 7));

      // Random vitals
      const temp = (97 + Math.random() * 4).toFixed(1);
      const spo2 = Math.floor(94 + Math.random() * 6);
      const pulse = Math.floor(65 + Math.random() * 30);
      const systolic = Math.floor(110 + Math.random() * 40);
      const diastolic = Math.floor(70 + Math.random() * 20);
      const bloodPressure = `${systolic}/${diastolic}`;

      // Payment method
      const paymentMethods = ['cash', 'upi', 'card', 'cash', 'upi']; // More cash and UPI
      const paidBy = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      visits.push({
        visitDate,
        visitType: v === 0 ? 'Consultation' : 'Follow-up',
        chiefComplaint: condition.complaint,
        signs: condition.signs,
        investigations: condition.investigations,
        diagnosis: condition.diagnosis,
        temp: parseFloat(temp),
        spo2,
        pulse,
        bloodPressure,
        bpSystolic: systolic,
        bpDiastolic: diastolic,
        treatment: condition.treatment,
        medicines: condition.medicines,
        paidBy,
        followUpDate: v === numVisits - 1 ? followUpDate : null,
        notes: v === 0 ? 'First consultation' : 'Follow-up visit - condition improving',
      });
    }

    // Create patient with visits
    await prisma.patient.create({
      data: {
        patientId,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        contact: patientData.contact,
        address: patientData.address,
        bloodGroup: patientData.bloodGroup,
        visits: {
          create: visits,
        },
      },
    });

    // Create invoices for each visit
    const createdPatient = await prisma.patient.findUnique({
      where: { patientId },
      include: { visits: true },
    });

    if (createdPatient) {
      for (let v = 0; v < createdPatient.visits.length; v++) {
        const visit = createdPatient.visits[v];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const consultationFee = condition.fee;
        const medicinesFee = Math.floor(Math.random() * 500) + 200; // 200-700
        const investigationFee = visit.investigations !== 'None' && visit.investigations !== 'None required' 
          ? Math.floor(Math.random() * 800) + 200 
          : 0;
        
        const totalAmount = consultationFee + medicinesFee + investigationFee;
        const invoiceNumber = `INV-${patientId}-${String(v + 1).padStart(2, '0')}`;

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            patientId: createdPatient.id,
            visitId: visit.id,
            amount: totalAmount,
            status: 'paid',
            issuedDate: visit.visitDate,
            dueDate: visit.visitDate,
            paidDate: visit.visitDate,
            items: {
              create: [
                {
                  description: 'Consultation Fee',
                  quantity: 1,
                  unitPrice: consultationFee,
                  discount: 0,
                  total: consultationFee,
                },
                {
                  description: 'Medicines',
                  quantity: 1,
                  unitPrice: medicinesFee,
                  discount: 0,
                  total: medicinesFee,
                },
                ...(investigationFee > 0 ? [{
                  description: 'Investigations',
                  quantity: 1,
                  unitPrice: investigationFee,
                  discount: 0,
                  total: investigationFee,
                }] : []),
              ],
            },
          },
        });

        // Create payment record
        await prisma.payment.create({
          data: {
            patientId: createdPatient.id,
            invoiceId: invoice.id,
            amount: totalAmount,
            status: 'succeeded',
            paymentMethod: visit.paidBy || 'cash',
            provider: 'manual',
            description: `Payment for ${invoiceNumber}`,
            createdAt: visit.visitDate,
            updatedAt: visit.visitDate,
          },
        });
      }
    }

    console.log(`✅ Created patient ${patientId} - ${patientData.name} with ${numVisits} visit(s)`);
    patientCounter++;
  }

  console.log('✨ Successfully seeded 30 additional patients with complete visit and payment data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
