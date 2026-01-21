// Data Models for GalePedia Pro

export type DrugType = 'tablet' | 'powder';

export interface Drug {
  name: string;
  sourceUnit: number; // mg per tablet (ignored for powder)
  step: number; // Secability (e.g., 0.5 for half). For powder, usually 1 or 0 (not used).
  type: DrugType; // NEW: Distinguish calculation logic
}

export interface Capsule {
  label: string;
  vol: number; // Volume in ml
}

export type FeasibilityStatus = 'ok' | 'ko';

export interface PreparationDetail {
  molecule: string;
  status: FeasibilityStatus;
  type?: DrugType; // Store the type to render history correctly
  reason?: string; // If status is ko
  targetDose?: string; // mg
  realDose?: string; // mg/gel
  tabs?: string; // Number of tablets used (Tablet only)
  totalMass?: string; // Total mass to weigh (Powder only)
  gels?: string | number; // Number of capsules produced
  capsule?: string; // Capsule size key (e.g., 'T4')
  duration?: number; // NEW: Treatment duration in days
}

export interface HistoryLog {
  date: string; // Formatted date string
  timestamp: number;
  doctor: string;
  preparators: string[]; // List of preparator names
  preps: PreparationDetail[];
}

export interface Patient {
  id?: string; // Firebase Doc ID (usually the name)
  name: string;
  phone?: string;
  age?: number | string;
  weight?: number | string;
  lastUpdate: number;
  history: HistoryLog[];
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // ISO format YYYY-MM-DD
  status: 'confirmed' | 'pending';
  molecule: string; // To know what to prepare
}

// Global dictionaries
export type DrugMaster = Record<string, Drug>;
export type CapsuleMaster = Record<string, Capsule>;

// Algerian Fixed Holidays (Day-Month)
export const ALGERIA_HOLIDAYS: Record<string, string> = {
  "01-01": "Nouvel An",
  "01-12": "Yennayer",
  "05-01": "Fête du Travail",
  "07-05": "Indépendance",
  "11-01": "Révolution",
  // Approximate Islamic Holidays for Demo Context (2024/2025)
  "04-10": "Aïd el-Fitr", 
  "06-16": "Aïd el-Adha",
  "07-07": "Mouharram",
  "09-15": "Mawlid"
};

export const PREPARATORS_LIST = [
    "Dr Hellali Djaafar Hamza",
    "Dr Slimatni Souad",
    "Dr Bourouba Saoucen",
    "Dr Moussaoui Meriem",
    "Dr Amirouche Nada",
    "Dr Mokhtari Fatma zahra",
    "Dr Tirichine Amina"
];

export const DRUG_MASTER: DrugMaster = {
    'amox': { name: 'Amoxicilline', sourceUnit: 500, step: 0.5, type: 'tablet' },
    'prop': { name: 'Propranolol', sourceUnit: 40, step: 0.5, type: 'tablet' },
    'furo': { name: 'Furosémide', sourceUnit: 40, step: 0.5, type: 'tablet' },
    'spiro': { name: 'Spironolactone', sourceUnit: 25, step: 1.0, type: 'tablet' },
    'captopril': { name: 'Captopril', sourceUnit: 25, step: 0.25, type: 'tablet' },
    'amlo': { name: 'Amlodipine', sourceUnit: 5, step: 0.5, type: 'tablet' },
    'hydro': { name: 'Hydrochlorothiazide', sourceUnit: 25, step: 0.5, type: 'tablet' },
    'aten100': { name: 'Aténolol 100mg', sourceUnit: 100, step: 0.5, type: 'tablet' },
    'carv25': { name: 'Carvédilol 25mg', sourceUnit: 25, step: 0.5, type: 'tablet' },
    'carv12': { name: 'Carvédilol 12.5mg', sourceUnit: 12.5, step: 0.5, type: 'tablet' },
    'carv6': { name: 'Carvédilol 6.25mg', sourceUnit: 6.25, step: 0.5, type: 'tablet' },
    'carv3': { name: 'Carvédilol 3.125mg', sourceUnit: 3.125, step: 0.5, type: 'tablet' },
    'biso10': { name: 'Bisoprolol 10mg', sourceUnit: 10, step: 0.5, type: 'tablet' },
    'biso5': { name: 'Bisoprolol 5mg', sourceUnit: 5, step: 0.5, type: 'tablet' },
    // NEW VALSARTAN
    'val80': { name: 'Valsartan 80mg', sourceUnit: 80, step: 0.5, type: 'tablet' },
    'val160': { name: 'Valsartan 160mg', sourceUnit: 160, step: 0.5, type: 'tablet' },
    'val320': { name: 'Valsartan 320mg', sourceUnit: 320, step: 0.5, type: 'tablet' },
    // POWDER
    'bicarb': { name: 'Bicarbonate de Sodium', sourceUnit: 1, step: 0, type: 'powder' }
};

export const CAPSULE_TYPES: CapsuleMaster = {
    'T0': { label: 'Taille 0', vol: 0.68 },
    'T1': { label: 'Taille 1', vol: 0.50 },
    'T2': { label: 'Taille 2', vol: 0.37 },
    'T3': { label: 'Taille 3', vol: 0.30 },
    'T4': { label: 'Taille 4', vol: 0.21 }
};

// NOTE: MOCK_PATIENTS removed for Production Build
