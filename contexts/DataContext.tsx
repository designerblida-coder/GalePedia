import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  doc, 
  arrayUnion, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Patient, HistoryLog, PreparationDetail } from '../types';

interface DataContextType {
  patients: Patient[];
  loading: boolean;
  addPreparation: (patientInfo: { name: string, phone: string, age: string, weight: string, doctor: string }, team: string[], preps: PreparationDetail[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Lecture Temps Réel (Real-time Listener)
  useEffect(() => {
    const q = query(collection(db, 'patients'));
    
    // onSnapshot works with the local cache immediately if offline
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const patientsData: Patient[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      setPatients(patientsData);
      setLoading(false);
      
      const source = snapshot.metadata.fromCache ? "local cache" : "server";
      console.log("Data loaded from " + source);
      
    }, (error) => {
      console.error("Erreur lecture Firebase:", error);
      // Even if there is an error (e.g. permission), stop loading to show UI
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Écriture (Ajout Préparation)
  const addPreparation = async (
    patientInfo: { name: string, phone: string, age: string, weight: string, doctor: string }, 
    team: string[], 
    preps: PreparationDetail[]
  ) => {
    try {
      // Normalisation du nom pour recherche
      const normalizedName = patientInfo.name.trim().toUpperCase();
      
      // Création du log historique
      const newLog: HistoryLog = {
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: Date.now(),
        doctor: patientInfo.doctor,
        preparators: team,
        preps: preps
      };

      // Vérifier si le patient existe déjà
      const q = query(collection(db, 'patients'), where('name', '==', normalizedName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // MISE À JOUR (UPDATE)
        const patientDoc = querySnapshot.docs[0];
        const patientRef = doc(db, 'patients', patientDoc.id);

        await updateDoc(patientRef, {
          phone: patientInfo.phone,
          age: patientInfo.age ? parseFloat(patientInfo.age) : patientDoc.data().age,
          weight: patientInfo.weight ? parseFloat(patientInfo.weight) : patientDoc.data().weight,
          lastUpdate: Date.now(),
          history: arrayUnion(newLog)
        });

      } else {
        // CRÉATION (CREATE)
        const newPatient: Patient = {
          name: normalizedName,
          phone: patientInfo.phone,
          age: patientInfo.age ? parseFloat(patientInfo.age) : undefined,
          weight: patientInfo.weight ? parseFloat(patientInfo.weight) : undefined,
          lastUpdate: Date.now(),
          history: [newLog]
        };

        await addDoc(collection(db, 'patients'), newPatient);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de la préparation:", error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{ patients, loading, addPreparation }}>
      {children}
    </DataContext.Provider>
  );
};