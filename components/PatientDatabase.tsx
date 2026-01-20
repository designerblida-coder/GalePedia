import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  ChevronRight, 
  X, 
  Plus, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  Filter, 
  ArrowUpDown,
  History,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Patient, MOCK_PATIENTS, DRUG_MASTER } from '../types';
import { PatientHistory } from './PatientHistory';

// --- HELPERS ---

const getAvatarColor = (name: string) => {
  const gradients = [
    'from-blue-400 to-blue-600', 
    'from-emerald-400 to-emerald-600', 
    'from-violet-400 to-violet-600', 
    'from-amber-400 to-amber-600', 
    'from-rose-400 to-rose-600', 
    'from-cyan-400 to-cyan-600', 
    'from-indigo-400 to-indigo-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getLastActivity = (patient: Patient) => {
  if (!patient.history || patient.history.length === 0) return null;
  const latest = [...patient.history].sort((a, b) => b.timestamp - a.timestamp)[0];
  const mainDrug = latest.preps[0]?.molecule || 'Préparation';
  return { date: latest.date, drug: mainDrug };
};

// NEW: Treatment Status Calculation
interface TreatmentStatus {
  status: 'green' | 'orange' | 'red' | 'unknown';
  percent: number;
  daysLeft: number;
  label: string;
}

const getTreatmentStatus = (patient: Patient): TreatmentStatus => {
  if (!patient.history || patient.history.length === 0) {
    return { status: 'unknown', percent: 0, daysLeft: 0, label: 'Nouveau' };
  }

  // Get Latest Preparation
  const latest = [...patient.history].sort((a, b) => b.timestamp - a.timestamp)[0];
  
  // Find longest duration among drugs in that prep (to be safe)
  let maxDuration = 0;
  latest.preps.forEach(p => {
    if (p.duration && p.duration > maxDuration) maxDuration = p.duration;
  });

  if (maxDuration === 0) {
     return { status: 'unknown', percent: 0, daysLeft: 0, label: 'Durée inconnue' };
  }

  const now = Date.now();
  const prepTime = latest.timestamp;
  const elapsedMs = now - prepTime;
  const durationMs = maxDuration * 24 * 60 * 60 * 1000;
  
  // Calculate remaining
  const remainingMs = durationMs - elapsedMs;
  const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  
  // Calculate percent (0 to 100)
  let percent = (elapsedMs / durationMs) * 100;
  if (percent > 100) percent = 100;
  if (percent < 0) percent = 0;

  // Determine Status
  if (daysLeft <= 0) {
     return { status: 'red', percent: 100, daysLeft, label: `Terminé depuis ${Math.abs(daysLeft)}j` };
  } else if (daysLeft <= 7) {
     return { status: 'orange', percent, daysLeft, label: 'Critique' };
  } else {
     return { status: 'green', percent, daysLeft, label: `${daysLeft}j restants` };
  }
};

const getRecentMeds = (patient: Patient) => {
  if (!patient.history) return [];
  const meds = new Set<string>();
  [...patient.history].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3).forEach(h => {
      h.preps.forEach(p => meds.add(p.molecule));
  });
  return Array.from(meds).slice(0, 3);
};

// --- COMPONENT ---

export const PatientDatabase: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [hoveredPatientId, setHoveredPatientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'cardiac' | 'alerts' | 'renew'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'lastUpdate' | 'urgency', direction: 'asc' | 'desc' }>({ key: 'lastUpdate', direction: 'desc' });

  // Handle auto-open from navigation state
  useEffect(() => {
    if (location.state && (location.state as any).openPatient) {
        const targetName = (location.state as any).openPatient;
        const target = MOCK_PATIENTS.find(p => p.name === targetName);
        if (target) {
            setSelectedPatient(target);
            // Clear state so it doesn't reopen on refresh/back (optional but good UX)
            window.history.replaceState({}, document.title);
        }
    }
  }, [location.state]);

  // Filtering Logic
  const filteredPatients = useMemo(() => {
    let result = MOCK_PATIENTS.filter(p => 
      p.name.includes(searchTerm.toUpperCase()) || 
      (p.phone && p.phone.includes(searchTerm))
    );

    // Filter Chips Logic
    if (activeFilter === 'recent') {
        const thirtyDaysMs = 1000 * 60 * 60 * 24 * 30;
        result = result.filter(p => (Date.now() - p.lastUpdate) < thirtyDaysMs);
    } else if (activeFilter === 'alerts') {
        result = result.filter(p => p.history.some(h => h.preps.some(prep => prep.status === 'ko')));
    } else if (activeFilter === 'cardiac') {
        const cardiacDrugs = ['Carvédilol', 'Bisoprolol', 'Valsartan', 'Aténolol', 'Amlodipine', 'Captopril', 'Furosémide', 'Spironolactone', 'Digoxine', 'Propranolol'];
        result = result.filter(p => 
            p.history.some(h => h.preps.some(prep => cardiacDrugs.some(cd => prep.molecule.includes(cd))))
        );
    } else if (activeFilter === 'renew') {
        // Show Red (expired) and Orange (<= 7 days)
        result = result.filter(p => {
            const status = getTreatmentStatus(p);
            return status.status === 'red' || status.status === 'orange';
        });
    }

    // Sorting Logic
    result.sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        } else if (sortConfig.key === 'lastUpdate') {
            return sortConfig.direction === 'asc' 
                ? a.lastUpdate - b.lastUpdate 
                : b.lastUpdate - a.lastUpdate;
        } else if (sortConfig.key === 'urgency') {
             const statA = getTreatmentStatus(a);
             const statB = getTreatmentStatus(b);
             // Sort by daysLeft (ascending = most urgent/expired first)
             // We put Unknowns at the bottom usually, or top? Let's put them bottom.
             const daysA = statA.status === 'unknown' ? 9999 : statA.daysLeft;
             const daysB = statB.status === 'unknown' ? 9999 : statB.daysLeft;
             
             return sortConfig.direction === 'asc' ? daysA - daysB : daysB - daysA;
        }
        return 0;
    });

    return result;
  }, [searchTerm, activeFilter, sortConfig]);

  // Handlers
  const handleSort = (key: 'name' | 'lastUpdate' | 'urgency') => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
      }));
  };

  const handleQuickPrepare = (e: React.MouseEvent, patient: Patient) => {
      e.stopPropagation(); // Prevent opening modal
      navigate('/prepare', { state: { patient } });
  };

  const FilterChip = ({ id, label, icon: Icon }: { id: typeof activeFilter, label: string, icon?: any }) => (
      <button 
        onClick={() => setActiveFilter(id)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${
            activeFilter === id 
            ? 'bg-slate-900 border-slate-900 text-white shadow-lg dark:bg-white dark:border-white dark:text-slate-900' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
        }`}
      >
          {Icon && <Icon className="w-3 h-3" />}
          {label}
      </button>
  );

  return (
    <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
      
      {/* HEADER & FILTERS */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dossiers Patients</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gérez les historiques, le suivi clinique et les renouvellements.</p>
             </div>
             
             {/* Search */}
             <div className="relative w-full md:w-96 group">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold uppercase text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-700 focus:border-slate-300 outline-none transition-all" 
                  placeholder="Rechercher (Nom, Tel)..."
                />
                <Search className="absolute left-4 top-4.5 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
             </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-50 dark:border-slate-700">
            <FilterChip id="all" label="Tous" />
            <FilterChip id="recent" label="Activité Récente" icon={Activity} />
            <FilterChip id="cardiac" label="Suivi Cardiaque" icon={Activity} />
            <FilterChip id="renew" label="À Relancer" icon={Clock} />
            <FilterChip id="alerts" label="Alertes" icon={AlertTriangle} />
        </div>
      </div>

      {/* PATIENT TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm dark:text-slate-300">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th 
                    className="px-8 py-5 font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:text-sky-600 transition-colors group"
                    onClick={() => handleSort('name')}
                >
                    <div className="flex items-center gap-1">Patient <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" /></div>
                </th>
                <th 
                    className="px-8 py-5 font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:text-sky-600 transition-colors group"
                    onClick={() => handleSort('urgency')}
                >
                    <div className="flex items-center gap-1">Santé du Traitement <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" /></div>
                </th>
                <th className="px-8 py-5 font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">Dernière Molécule</th>
                <th 
                    className="px-8 py-5 font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider cursor-pointer hover:text-sky-600 transition-colors group"
                    onClick={() => handleSort('lastUpdate')}
                >
                    <div className="flex items-center gap-1">Mise à jour <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" /></div>
                </th>
                <th className="px-8 py-5 text-right font-black text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => {
                  const lastActivity = getLastActivity(p);
                  const treatStatus = getTreatmentStatus(p);
                  const recentMeds = getRecentMeds(p);

                  // Colors for progress bar
                  let progressColor = 'bg-emerald-500';
                  let trackColor = 'bg-emerald-100 dark:bg-emerald-900/30';
                  let textColor = 'text-emerald-600 dark:text-emerald-400';
                  
                  if (treatStatus.status === 'orange') {
                      progressColor = 'bg-orange-500';
                      trackColor = 'bg-orange-100 dark:bg-orange-900/30';
                      textColor = 'text-orange-600 dark:text-orange-400';
                  } else if (treatStatus.status === 'red') {
                      progressColor = 'bg-red-500';
                      trackColor = 'bg-red-100 dark:bg-red-900/30';
                      textColor = 'text-red-600 dark:text-red-400';
                  }

                  return (
                    <tr 
                        key={p.name} 
                        onClick={() => setSelectedPatient(p)}
                        onMouseEnter={() => setHoveredPatientId(p.name)}
                        onMouseLeave={() => setHoveredPatientId(null)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-all duration-200 relative group"
                    >
                        {/* 1. Identity */}
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md bg-gradient-to-br ${getAvatarColor(p.name)}`}>
                                    {getInitials(p.name)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{p.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                        {p.age} ans • {p.weight} kg • <span className="font-mono">{p.phone || '---'}</span>
                                    </div>
                                    
                                    {/* TOOLTIP ON HOVER */}
                                    {hoveredPatientId === p.name && recentMeds.length > 0 && (
                                        <div className="absolute left-20 top-full z-20 mt-1 bg-slate-900 text-white p-4 rounded-xl shadow-xl w-64 animate-[fadeIn_0.2s_ease-out] border border-slate-700">
                                            <div className="text-[10px] font-bold uppercase text-slate-400 mb-2 tracking-widest">Molécules Récentes</div>
                                            <div className="flex flex-wrap gap-2">
                                                {recentMeds.map((m, i) => (
                                                    <span key={i} className="text-[10px] font-bold bg-slate-800 px-2 py-1 rounded text-sky-400 border border-slate-700">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>

                        {/* 2. Treatment Health (Progress Bar) */}
                        <td className="px-8 py-5 min-w-[240px]">
                            {treatStatus.status === 'unknown' ? (
                                <span className="text-xs text-slate-400 font-medium italic">Aucune donnée</span>
                            ) : (
                                <div>
                                    <div className="flex justify-between mb-1.5">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>
                                            {treatStatus.label}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">{Math.round(treatStatus.percent)}%</span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${trackColor}`}>
                                        <div 
                                            className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${progressColor}`} 
                                            style={{ width: `${treatStatus.percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </td>

                        {/* 3. Last Drug */}
                        <td className="px-8 py-5">
                            {lastActivity ? (
                                <div>
                                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                        {lastActivity.drug}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                        <History className="w-3 h-3" />
                                        {lastActivity.date}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs text-slate-400 italic">-</span>
                            )}
                        </td>

                        {/* 4. Update Info */}
                        <td className="px-8 py-5">
                             <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                Il y a {Math.floor((Date.now() - p.lastUpdate) / (1000 * 60 * 60 * 24))} jours
                             </div>
                             <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
                                {p.history.length} entrées
                             </div>
                        </td>

                        {/* 5. Actions */}
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                               <button 
                                 onClick={(e) => handleQuickPrepare(e, p)}
                                 className="w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 transition-colors border border-sky-100 dark:border-sky-800"
                                 title="Nouvelle préparation"
                               >
                                   <Plus className="w-4 h-4" />
                               </button>
                               <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-300 dark:text-slate-500">
                                   <ChevronRight className="w-5 h-5" />
                               </div>
                           </div>
                        </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                   <td colSpan={5} className="px-8 py-24 text-center">
                       <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-6 border border-slate-100 dark:border-slate-700">
                           <Search className="w-8 h-8 text-slate-300" />
                       </div>
                       <h3 className="text-slate-900 dark:text-white font-bold text-lg">Aucun résultat</h3>
                       <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Essayez de modifier vos filtres ou termes de recherche.</p>
                       <button onClick={() => {setSearchTerm(''); setActiveFilter('all');}} className="text-sky-500 text-sm font-black mt-4 hover:underline uppercase tracking-wide">
                           Réinitialiser
                       </button>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto relative shadow-[0_20px_50px_rgb(0,0,0,0.12)] flex flex-col border border-slate-100 dark:border-slate-700">
                {/* Modal Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-white dark:bg-slate-800 sticky top-0 z-20 rounded-t-3xl">
                    <div className="flex items-center gap-6">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg bg-gradient-to-br ${getAvatarColor(selectedPatient.name)} transform -rotate-3`}>
                            {getInitials(selectedPatient.name)}
                         </div>
                         <div>
                             <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedPatient.name}</h2>
                             <div className="flex flex-wrap gap-2 mt-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                                <span className="bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-600">Age: {selectedPatient.age || '?'}</span>
                                <span className="bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-600">Poids: {selectedPatient.weight || '?'}</span>
                                {selectedPatient.phone && <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-3 py-1.5 rounded-lg font-mono">{selectedPatient.phone}</span>}
                             </div>
                         </div>
                    </div>
                    <button 
                      onClick={() => setSelectedPatient(null)}
                      className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-50 dark:bg-slate-700 p-2.5 rounded-full hover:bg-slate-100"
                    >
                      <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Modal Content */}
                <div className="p-10 bg-slate-50/50 dark:bg-slate-900/20 flex-1">
                   <PatientHistory patient={selectedPatient} />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};