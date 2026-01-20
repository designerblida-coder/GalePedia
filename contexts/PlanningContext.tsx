import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appointment, Patient, ALGERIA_HOLIDAYS } from '../types';

interface PlanningContextType {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
  deleteAppointment: (id: string) => void;
  getDailyCount: (dateStr: string) => number;
  findBestSlot: (patient: Patient, molecule: string, duration: number, lastPrepTimestamp: number) => SuggestionResult;
  MAX_CAPACITY: number;
  formatDate: (date: Date) => string; // Export helper
}

export interface SuggestionResult {
  idealDate: string; // The mathematically ideal date (End - 2 days)
  suggestedDate: string; // The actual available date found
  isIdeal: boolean; // True if suggested == ideal
  slotsLeft: number;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

// HELPERS
// FIX: Use local time string construction instead of toISOString which converts to UTC and causes off-by-one errors in some timezones
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MAX_CAPACITY = 6;

// HELPER: Check if a specific date is a weekend or holiday
const isClosedDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    // Friday (5) or Saturday (6)
    if (dayOfWeek === 5 || dayOfWeek === 6) return true;

    // Check Holiday
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const holidayKey = `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    return !!ALGERIA_HOLIDAYS[holidayKey];
};

export const PlanningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const todayStr = formatDate(new Date());

  // In a real app, this would sync with Firebase
  // Reduced mock data to ensure user sees their own additions clearly
  const [appointments, setAppointments] = useState<Appointment[]>([
     { id: '1', patientId: 'mock1', patientName: 'D. MOCK', date: todayStr, status: 'confirmed', molecule: '0550000000' }
  ]);

  const getDailyCount = (dateStr: string) => {
    return appointments.filter(a => a.date === dateStr).length;
  };

  const addAppointment = (appt: Appointment) => {
    const count = getDailyCount(appt.date);
    if (count >= MAX_CAPACITY) {
        throw new Error("Ce jour est complet (Max 6 patients).");
    }
    const d = new Date(appt.date);
    if (isClosedDay(d)) {
        throw new Error("Impossible : La pharmacie est fermée ce jour-là.");
    }
    setAppointments(prev => {
        const newAppts = [...prev, appt];
        console.log("Updated Appointments:", newAppts); // Debug
        return newAppts;
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // --- THE ALGORITHM ---
  const findBestSlot = (patient: Patient, molecule: string, duration: number, lastPrepTimestamp: number): SuggestionResult => {
      // Step A: Calculate Target Date (LastPrep + Duration - 2 days)
      const prepDate = new Date(lastPrepTimestamp);
      const targetTime = prepDate.getTime() + (duration * 24 * 60 * 60 * 1000); // End of treatment
      const safetyBuffer = 2 * 24 * 60 * 60 * 1000; // 2 days before
      
      const idealDateObj = new Date(targetTime - safetyBuffer);
      const idealDateStr = formatDate(idealDateObj);

      // Step B: Backwards Search Strategy
      let currentDate = new Date(idealDateObj);
      let foundDateStr = idealDateStr;
      let slotsLeft = MAX_CAPACITY - getDailyCount(idealDateStr);
      let isIdeal = true;

      // Check initially if ideal date is closed
      if (isClosedDay(currentDate)) {
          isIdeal = false;
      }

      // Search backwards up to 30 days if full OR CLOSED
      let attempts = 0;
      while ( (getDailyCount(foundDateStr) >= MAX_CAPACITY || isClosedDay(currentDate)) && attempts < 30) {
          isIdeal = false;
          // Go back 1 day
          currentDate.setDate(currentDate.getDate() - 1);
          foundDateStr = formatDate(currentDate);
          attempts++;
      }

      slotsLeft = MAX_CAPACITY - getDailyCount(foundDateStr);

      return {
          idealDate: idealDateStr,
          suggestedDate: foundDateStr,
          isIdeal,
          slotsLeft
      };
  };

  return (
    <PlanningContext.Provider value={{ 
        appointments, 
        addAppointment, 
        deleteAppointment, 
        getDailyCount, 
        findBestSlot,
        MAX_CAPACITY,
        formatDate
    }}>
      {children}
    </PlanningContext.Provider>
  );
};