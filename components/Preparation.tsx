import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, CheckCheck, User, Phone, Weight, Stethoscope, Search, Check, Loader2 } from 'lucide-react';
import { PREPARATORS_LIST, Patient } from '../types';
import { PreparationRow } from './PreparationRow';
import { useData } from '../contexts/DataContext';

export const Preparation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patients, addPreparation } = useData(); // Use Real Data
  
  // Patient State
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [doctor, setDoctor] = useState('');
  const [selectedPreparators, setSelectedPreparators] = useState<string[]>([]);
  
  // Autocomplete State
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  // Rows State
  const [rows, setRows] = useState<{ id: number; data: any }[]>([]);
  const [nextId, setNextId] = useState(0);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from Location State (Quick Action)
  useEffect(() => {
    if (location.state && location.state.patient) {
        const p = location.state.patient as Patient;
        setPatientName(p.name);
        setPhone(p.phone || '');
        setAge(p.age?.toString() || '');
        setWeight(p.weight?.toString() || '');
        
        if (p.history && p.history.length > 0) {
            const lastLog = [...p.history].sort((a,b) => b.timestamp - a.timestamp)[0];
            if (lastLog.doctor) setDoctor(lastLog.doctor);
        }
    }
  }, [location.state]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePatientNameChange = (val: string) => {
    setPatientName(val);
    if (val.trim().length > 1) {
       const filtered = patients.filter(p => p.name.includes(val.toUpperCase()));
       setSuggestions(filtered);
       setShowSuggestions(true);
    } else {
       setShowSuggestions(false);
    }
  };

  const selectPatient = (p: Patient) => {
    setPatientName(p.name);
    setPhone(p.phone || '');
    setAge(p.age?.toString() || '');
    setWeight(p.weight?.toString() || '');
    setShowSuggestions(false);
  };

  // Actions
  const togglePreparator = (name: string) => {
    setSelectedPreparators(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: nextId, data: null }]);
    setNextId(prev => prev + 1);
  };

  const removeRow = (id: number) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRowData = (id: number, data: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, data } : r));
  };

  const handleSave = async () => {
    if (!patientName.trim()) return alert("Nom du patient requis.");
    if (rows.length === 0) return alert("Aucune préparation à enregistrer.");
    
    // Check validation of all rows
    const invalidRow = rows.find(r => !r.data || !r.data.valid);
    if (invalidRow) return alert("Veuillez compléter toutes les lignes de préparation (ou indiquer un motif).");

    setIsSaving(true);

    try {
      await addPreparation(
        { name: patientName, phone, age, weight, doctor },
        selectedPreparators,
        rows.map(r => r.data)
      );

      navigate('/'); // Redirect to dashboard
    } catch (error) {
      alert("Erreur lors de l'enregistrement. Vérifiez votre connexion.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-6 max-w-6xl mx-auto animate-[fadeIn_0.4s_ease-out]">
      
      {/* 1. PATIENT & TEAM */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
          <User className="w-4 h-4 text-sky-500" /> 1. Informations Patient & Équipe
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative" ref={suggestionRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase">Nom Patient</label>
            <div className="relative">
              <input 
                type="text" 
                value={patientName}
                onChange={(e) => handlePatientNameChange(e.target.value)}
                onFocus={() => patientName.trim().length > 1 && setShowSuggestions(true)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold uppercase dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none" 
                placeholder="EX: DUPONT JEAN"
                autoComplete="off"
              />
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((p, idx) => (
                        <div 
                           key={idx}
                           onClick={() => selectPatient(p)}
                           className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer border-b border-slate-100 dark:border-slate-600 last:border-0"
                        >
                            <div className="font-bold text-sm text-slate-800 dark:text-white">{p.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                                <span>{p.phone || 'Sans tel'}</span>
                                {p.age && <span>• {p.age} ans</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Téléphone</label>
            <div className="relative">
               <input 
                 type="tel" 
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" 
                 placeholder="06 XX XX XX XX"
               />
               <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Âge (ans)</label>
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Poids (kg)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" 
              />
              <Weight className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Médecin Prescripteur</label>
            <div className="relative">
              <input 
                type="text" 
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none" 
                placeholder="Dr. Martin"
              />
              <Stethoscope className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* PREPARATORS */}
          <div className="md:col-span-4 mt-4">
             <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Équipe de Préparation</label>
             <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {PREPARATORS_LIST.map((name) => {
                  const isSelected = selectedPreparators.includes(name);
                  return (
                    <button 
                      key={name}
                      onClick={() => togglePreparator(name)}
                      className={`group relative p-3 rounded-lg text-xs font-bold text-left flex items-center gap-3 transition-all border ${
                        isSelected 
                          ? 'bg-white dark:bg-slate-800 border-sky-500 text-sky-600 dark:text-sky-400 shadow-md' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-sky-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] transition-colors ${
                        isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700'
                      }`}>
                         {isSelected && <Check className="w-3 h-3" />}
                      </span>
                      {name}
                    </button>
                  );
                })}
             </div>
          </div>
        </div>
      </div>

      {/* 2. FORMULATIONS */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">2. Formulations & Faisabilité</h3>
           <button 
             onClick={addRow}
             className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-sky-600/20"
           >
             <Plus className="w-4 h-4" /> Ajouter Molécule
           </button>
        </div>

        <div className="space-y-6">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
               Veuillez ajouter un médicament pour commencer le calcul.
            </div>
          ) : (
            rows.map(row => (
              <PreparationRow 
                key={row.id} 
                id={row.id} 
                onDelete={removeRow} 
                onUpdate={updateRowData}
                patientWeight={parseFloat(weight) || 0}
              />
            ))
          )}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4 pb-12">
         <button 
           onClick={handleSave}
           disabled={isSaving}
           className={`bg-emerald-600 text-white px-10 py-4 rounded-xl font-black uppercase text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-3 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
         >
           {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCheck className="w-5 h-5" />}
           {isSaving ? 'Enregistrement...' : 'Valider & Enregistrer'}
         </button>
      </div>

    </section>
  );
};