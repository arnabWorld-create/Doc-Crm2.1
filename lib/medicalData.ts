// Common medical conditions/diagnoses
export const commonConditions = [
  'Fever',
  'Cough',
  'Cold',
  'Flu',
  'Headache',
  'Migraine',
  'Diabetes',
  'Hypertension',
  'High Blood Pressure',
  'Asthma',
  'Allergy',
  'Chest Pain',
  'Back Pain',
  'Stomach Pain',
  'Abdominal Pain',
  'Throat Infection',
  'Sore Throat',
  'Diarrhea',
  'Vomiting',
  'Nausea',
  'Weakness',
  'Fatigue',
  'Dizziness',
  'Infection',
  'Viral Fever',
  'Bacterial Infection',
  'Skin Rash',
  'Joint Pain',
  'Arthritis',
  'Acidity',
  'Gastritis',
  'Constipation',
  'Anxiety',
  'Depression',
  'Insomnia',
  'Dengue',
  'Malaria',
  'Typhoid',
  'COVID-19',
  'Pneumonia',
  'Bronchitis',
];

// Brand name to generic name mapping
export const brandToGeneric: { [key: string]: string } = {
  // Paracetamol brands
  'crocin': 'Paracetamol',
  'dolo': 'Paracetamol',
  'calpol': 'Paracetamol',
  'metacin': 'Paracetamol',
  'tylenol': 'Paracetamol',
  
  // Ibuprofen brands
  'brufen': 'Ibuprofen',
  'combiflam': 'Ibuprofen + Paracetamol',
  'advil': 'Ibuprofen',
  
  // Antibiotics
  'augmentin': 'Amoxicillin + Clavulanic Acid',
  'azithral': 'Azithromycin',
  'zithromax': 'Azithromycin',
  'ciprofloxacin': 'Ciprofloxacin',
  
  // Antacids
  'gelusil': 'Antacid',
  'digene': 'Antacid',
  'eno': 'Antacid',
  'pantoprazole': 'Pantoprazole',
  'omeprazole': 'Omeprazole',
  
  // Cough syrups
  'benadryl': 'Diphenhydramine',
  'corex': 'Cough Syrup',
  'ascoril': 'Cough Syrup',
  
  // Others
  'aspirin': 'Aspirin',
  'disprin': 'Aspirin',
  'metformin': 'Metformin',
  'glycomet': 'Metformin',
  'amlodipine': 'Amlodipine',
  'norvasc': 'Amlodipine',
};

// Condition synonyms and variations
export const conditionSynonyms: { [key: string]: string[] } = {
  'Fever': ['fever', 'pyrexia', 'high temperature', 'temp', 'viral fever'],
  'Cough': ['cough', 'coughing', 'dry cough', 'wet cough', 'productive cough'],
  'Cold': ['cold', 'common cold', 'running nose', 'nasal congestion'],
  'Headache': ['headache', 'head ache', 'head pain', 'cephalalgia'],
  'Hypertension': ['hypertension', 'high bp', 'high blood pressure', 'hbp', 'bp high'],
  'Diabetes': ['diabetes', 'sugar', 'high sugar', 'blood sugar', 'dm', 'diabetic'],
  'Stomach Pain': ['stomach pain', 'stomach ache', 'abdominal pain', 'belly pain', 'tummy pain'],
  'Throat Infection': ['throat infection', 'sore throat', 'throat pain', 'pharyngitis'],
  'Chest Pain': ['chest pain', 'chest discomfort', 'angina'],
  'Back Pain': ['back pain', 'backache', 'lower back pain', 'upper back pain'],
};

// Normalize medicine name
export function normalizeMedicine(medicine: string): string {
  if (!medicine) return '';
  
  let normalized = medicine
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')              // Multiple spaces → single space
    .replace(/[-_]/g, ' ')             // Hyphens/underscores → space
    .replace(/\s*mg\s*/gi, ' mg ')     // Standardize "mg"
    .replace(/\s*ml\s*/gi, ' ml ')     // Standardize "ml"
    .replace(/\s*gm\s*/gi, ' gm ')     // Standardize "gm"
    .replace(/\s+/g, ' ')              // Clean up again
    .trim();
  
  // Extract base medicine name (before dosage)
  const parts = normalized.split(/\s+/);
  const baseName = parts[0];
  
  // Check if it's a brand name
  if (brandToGeneric[baseName]) {
    const generic = brandToGeneric[baseName];
    // Keep dosage if present
    const dosage = parts.slice(1).join(' ');
    return dosage ? `${generic} ${dosage}` : generic;
  }
  
  // Capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// Extract and normalize medicines from text
export function extractMedicines(medicinesText: string): string[] {
  if (!medicinesText) return [];
  
  const medicines = medicinesText
    .split('\n')
    .map(m => m.trim())
    .filter(m => m.length > 0);
  
  return medicines.map(normalizeMedicine);
}

// Detect conditions from signs/symptoms text
export function detectConditions(signsText: string): string[] {
  if (!signsText) return [];
  
  const detectedConditions = new Set<string>();
  const lowerText = signsText.toLowerCase();
  
  // Check each condition and its synonyms
  Object.entries(conditionSynonyms).forEach(([condition, synonyms]) => {
    for (const synonym of synonyms) {
      // Use word boundaries and check for negations
      const regex = new RegExp(`\\b${synonym}\\b`, 'i');
      const negationRegex = new RegExp(`\\b(no|not|without|absent)\\s+${synonym}\\b`, 'i');
      
      if (regex.test(lowerText) && !negationRegex.test(lowerText)) {
        detectedConditions.add(condition);
        break; // Found this condition, move to next
      }
    }
  });
  
  return Array.from(detectedConditions);
}

// Group similar medicines together
export function groupMedicines(medicines: string[]): { [key: string]: number } {
  const grouped: { [key: string]: number } = {};
  
  medicines.forEach(medicine => {
    // Extract base name (without dosage for grouping)
    const baseName = medicine.split(/\s+\d/)[0].trim();
    grouped[baseName] = (grouped[baseName] || 0) + 1;
  });
  
  return grouped;
}

// Common medicine suggestions for autocomplete (Brand Names)
export const commonMedicines = [
  // Your clinic's brand names
  'Prixicam',
  'Becocnx 60K',
  'Becoprx 60K',
  'Escnx LS 5',
  'CNXCLAV',
  'Betagold 24',
  'Bycine CD3',
  'Becocnx OD',
  'Becoprx OD',
  'Gdmin D',
  'Biluracise M',
  
  // Common generic medicines with dosages
  'Paracetamol 500mg',
  'Paracetamol 650mg',
  'Ibuprofen 400mg',
  'Ibuprofen 600mg',
  'Amoxicillin 500mg',
  'Azithromycin 500mg',
  'Ciprofloxacin 500mg',
  'Metformin 500mg',
  'Metformin 850mg',
  'Amlodipine 5mg',
  'Amlodipine 10mg',
  'Aspirin 75mg',
  'Aspirin 150mg',
  'Atorvastatin 10mg',
  'Atorvastatin 20mg',
  'Pantoprazole 40mg',
  'Omeprazole 20mg',
  'Cetirizine 10mg',
  'Montelukast 10mg',
  'Levothyroxine 50mcg',
  'Levothyroxine 100mcg',
  'Cough Syrup 10ml TID',
  'Multivitamin 1 tab OD',
  'Vitamin D3 60000 IU',
  'Calcium 500mg',
  'Iron 100mg',
  'Folic Acid 5mg',
  'Ondansetron 4mg',
  'Domperidone 10mg',
  'Ranitidine 150mg',
  'Diclofenac 50mg',
  'Prednisolone 5mg',
  'Dexamethasone 4mg',
  'Salbutamol Inhaler',
  'Insulin Glargine',
  
  // Popular brand names
  'Crocin 500mg',
  'Dolo 650mg',
  'Brufen 400mg',
  'Combiflam',
  'Augmentin 625mg',
  'Azee 500mg',
  'Montek LC',
  'Levocetrizine 5mg',
];
