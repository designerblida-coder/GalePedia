import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FlaskConical, 
  PlusCircle, 
  Trophy, 
  Clock, 
  Pill,
  Loader2,
  ChevronRight, 
  Siren,
  CalendarDays,
  Phone,
  Calendar,
  Check,
  CalendarClock,
  Box,
  X
} from 'lucide-react';
import { Patient } from '../types';
import { PatientHistory } from './PatientHistory';
import { usePlanning, SuggestionResult } from '../contexts/PlanningContext';
import { useData } from '../contexts/DataContext';

// --- TYPES ---

interface DailyStat {
  date: string;
  shortDay: string; // e.g., "Lun", "Mar"
  count: number;
}

interface ActivityItem {
  id: string; // unique key
  patientName: string;
  timestamp: number;
  preparators: string[];
  molecules: Array<{ name: string; status: 'ok' | 'ko'; type?: 'tablet' | 'powder'; totalMass?: string }>;
  fullPatient: Patient; // Reference for modal
}

interface RenewalAlert {
  patient: Patient;
  molecule: string;
  daysLeft: number;
  severity: 'yellow' | 'orange' | 'red';
  label: string;
  lastPrepTimestamp: number;
  duration: number;
}

// --- HELPER ---

const formatRelativeTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return `Aujourd'hui à ${timeStr}`;
  } else if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
    return `Hier à ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} à ${timeStr}`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
};

const formatDateFR = (isoStr: string) => {
    if (isoStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = isoStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    const date = new Date(isoStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// --- SUB-COMPONENTS ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, bgClass, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 shadow-sm hover:shadow-md transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} border border-slate-100 dark:border-slate-700 ${colorClass.replace('text-', 'border-l-')}`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black mt-2 text-slate-800 dark:text-white">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass} ${colorClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

// --- MAIN DASHBOARD ---

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patients, loading } = useData(); // Use Real Data Context
  const { findBestSlot, addAppointment, appointments, formatDate } = usePlanning();

  // Filtering & UI State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Modal State for Smart Scheduling
  const [schedulingAlert, setSchedulingAlert] = useState<RenewalAlert | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate Stats based on Real Data
  const stats = useMemo(() => {
    if (loading) return null;

    let monthPreps = 0;
    let todayPreps = 0;
    let monthCapsules = 0;
    let activityLog: ActivityItem[] = [];
    let preparatorCounts: Record<string, number> = {};
    let alerts: RenewalAlert[] = [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toLocaleDateString('fr-FR');
    
    // Iterate over Real Patients
    patients.forEach(p => {
        if (p.history && p.history.length > 0) {
            // 1. Renewal Alerts
            const latest = [...p.history].sort((a,b) => b.timestamp - a.timestamp)[0];
            const maxDuration = Math.max(...latest.preps.map(pr => pr.duration || 0));
            
            if (maxDuration > 0) {
                const elapsedMs = now.getTime() - latest.timestamp;
                const durationMs = maxDuration * 24 * 60 * 60 * 1000;
                const remainingMs = durationMs - elapsedMs;
                const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
                
                if (daysLeft <= 7) {
                    const molecule = latest.preps[0].molecule; 
                    alerts.push({
                        patient: p,
                        molecule,
                        daysLeft,
                        severity: daysLeft <= 0 ? 'red' : (daysLeft <= 3 ? 'orange' : 'yellow'),
                        label: daysLeft <= 0 ? `Terminé (${Math.abs(daysLeft)}j)` : `Reste ${daysLeft}j`,
                        lastPrepTimestamp: latest.timestamp,
                        duration: maxDuration
                    });
                }
            }

            // 2. Stats & Activity
            p.history.forEach(h => {
                const hDate = new Date(h.timestamp);
                const isCurrentMonth = hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear;
                
                if (isCurrentMonth) {
                    monthPreps += h.preps.length;
                    h.preps.forEach(pr => {
                        if (pr.status === 'ok' && pr.gels) {
                            monthCapsules += parseInt(pr.gels.toString());
                        }
                    });
                }
                
                if (h.date === todayStr) { // Check Date String matching
                    todayPreps += h.preps.length;
                }
                
                // Preparators
                h.preparators?.forEach(prep => {
                    preparatorCounts[prep] = (preparatorCounts[prep] || 0) + 1;
                });

                // Activity Log
                activityLog.push({
                   id: `${p.name}-${h.timestamp}`,
                   patientName: p.name,
                   timestamp: h.timestamp,
                   preparators: h.preparators,
                   molecules: h.preps.map(pr => ({ name: pr.molecule, status: pr.status, type: pr.type, totalMass: pr.totalMass })),
                   fullPatient: p
                });
            });
        }
    });

    const sortedPreparators = Object.entries(preparatorCounts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3);

    const recentActivity = activityLog.sort((a,b) => b.timestamp - a.timestamp).slice(0, 10);
    
    alerts.sort((a,b) => a.daysLeft - b.daysLeft);

    return {
        totalPatients: patients.length,
        monthPreps,
        todayPreps,
        monthCapsules,
        topPreparators: sortedPreparators,
        recentActivity,
        renewalAlerts: alerts
    };
  }, [patients, loading]);

  // Compute Active Alerts
  const activeAlerts = useMemo(() => {
    if (!stats?.renewalAlerts) return [];
    
    const patientsWithAppointments = new Set(
        appointments.map(a => a.patientName.toUpperCase())
    );

    return stats.renewalAlerts.filter(alert => 
        !patientsWithAppointments.has(alert.patient.name.toUpperCase())
    );
  }, [stats?.renewalAlerts, appointments]);

  // Compute Upcoming Appointments
  const upcomingAppointments = useMemo(() => {
      const todayStr = formatDate(new Date());
      return [...appointments]
        .filter(a => a.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
  }, [appointments, formatDate]);

  const handleOpenScheduleModal = (alert: RenewalAlert) => {
      const result = findBestSlot(
          alert.patient,
          alert.molecule,
          alert.duration,
          alert.lastPrepTimestamp
      );
      setSchedulingAlert(alert);
      setSuggestion(result);
      setIsModalOpen(true);
  };

  const confirmAppointment = () => {
      if (schedulingAlert && suggestion) {
          try {
              addAppointment({
                  id: crypto.randomUUID(),
                  patientId: schedulingAlert.patient.name, 
                  patientName: schedulingAlert.patient.name,
                  date: suggestion.suggestedDate,
                  status: 'confirmed',
                  molecule: schedulingAlert.molecule
              });
              setIsModalOpen(false);
              setSchedulingAlert(null);
              setSuggestion(null);
              alert("Rendez-vous confirmé pour le " + formatDateFR(suggestion.suggestedDate));
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  if (loading) {
     return (
        <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronisation Firebase...</p>
            </div>
        </div>
     );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* 1. KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         
         <StatCard 
            title="Gélules du Mois" 
            value={stats?.monthCapsules.toLocaleString() || 0} 
            icon={<Box className="w-5 h-5" />}
            colorClass="text-rose-500"
            bgClass="bg-rose-50 dark:bg-rose-900/30"
         />

         <StatCard 
            title="Total Patients" 
            value={stats?.totalPatients || 0} 
            icon={<Users className="w-5 h-5" />}
            colorClass="text-indigo-500"
            bgClass="bg-indigo-50 dark:bg-indigo-900/30"
         />

         <StatCard 
            title="Préparations du Mois" 
            value={stats?.monthPreps || 0} 
            icon={<FlaskConical className="w-5 h-5" />}
            colorClass="text-amber-500"
            bgClass="bg-amber-50 dark:bg-amber-900/30"
         />

         <StatCard 
            title="Nouvelle Prep" 
            value="Créer" 
            icon={<PlusCircle className="w-6 h-6" />}
            colorClass="text-sky-600 dark:text-sky-400"
            bgClass="bg-sky-50 dark:bg-sky-900/30"
            onClick={() => navigate('/prepare')}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 2. MAIN COLUMN (ALERTS & ACTIVITY) */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* RENEWAL ALERTS (FILTERED) */}
              {activeAlerts.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-orange-500">
                      <div className="flex items-center gap-2 mb-4">
                          <Siren className="w-5 h-5 text-orange-500" />
                          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Renouvellements Prioritaires</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeAlerts.slice(0, 4).map((alert, i) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white text-sm">{alert.patient.name}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">{alert.molecule}</div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                                          alert.severity === 'red' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                      }`}>
                                          {alert.label}
                                      </span>
                                      <button 
                                        onClick={() => handleOpenScheduleModal(alert)}
                                        className="text-[10px] font-bold text-sky-600 hover:underline flex items-center gap-1"
                                      >
                                          <CalendarDays className="w-3 h-3" /> Planifier
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* RECENT ACTIVITY */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest flex items-center gap-2">
                         <Clock className="w-4 h-4 text-slate-400" /> Activité Récente (Live)
                      </h3>
                  </div>

                  <div className="space-y-0">
                      {stats?.recentActivity.length === 0 ? (
                          <div className="text-center text-slate-400 py-8 italic">Aucune activité enregistrée</div>
                      ) : (
                          stats?.recentActivity.map((act) => (
                              <div 
                                key={act.id} 
                                className="group flex gap-4 py-4 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors px-2 -mx-2 rounded-xl cursor-pointer"
                                onClick={() => setSelectedPatient(act.fullPatient)}
                              >
                                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                      act.molecules.some(m => m.status === 'ko') ? 'bg-red-500' : 'bg-emerald-500'
                                  }`}></div>
                                  
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start mb-1">
                                          <span className="font-bold text-slate-800 dark:text-white text-sm truncate">{act.patientName}</span>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap ml-2">
                                              {formatRelativeTime(act.timestamp)}
                                          </span>
                                      </div>
                                      
                                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                          {act.molecules.map((m, i) => (
                                              <span key={i} className={m.status === 'ko' ? 'text-red-500 font-bold' : ''}>
                                                  {m.name}{i < act.molecules.length - 1 ? ', ' : ''}
                                              </span>
                                          ))}
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mt-2">
                                          {act.preparators.map((prep, i) => (
                                              <span key={i} className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                  {prep.split(' ')[1] || prep}
                                              </span>
                                          ))}
                                      </div>
                                  </div>
                                  
                                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ChevronRight className="w-4 h-4 text-slate-300" />
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>

          {/* 3. SIDEBAR STATS */}
          <div className="space-y-6">
              
              {/* UPCOMING APPOINTMENTS WIDGET */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm border-t-4 border-t-sky-500">
                  <h3 className="font-black text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-sky-500" /> Prochains Rendez-vous
                  </h3>
                  
                  {upcomingAppointments.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs italic py-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                          Aucun rendez-vous planifié
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {upcomingAppointments.map((appt) => {
                              const [y, m, d] = appt.date.split('-').map(Number);
                              const localDate = new Date(y, m - 1, d);
                              const shortMonth = localDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
                              const dayNum = localDate.getDate();

                              return (
                                <div key={appt.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors cursor-default">
                                    <div className="flex flex-col items-center bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg px-2 py-1 min-w-[45px] border border-sky-100 dark:border-sky-900/50">
                                        <span className="text-[10px] font-black uppercase">{shortMonth}</span>
                                        <span className="text-lg font-black leading-none">{dayNum}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{appt.patientName}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                                             <Calendar className="w-3 h-3" />
                                             <span>{formatDateFR(appt.date)}</span>
                                        </div>
                                        {appt.molecule && (
                                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                              <Phone className="w-3 h-3" />
                                              <span className="truncate">{appt.molecule}</span>
                                          </div>
                                        )}
                                    </div>
                                </div>
                              );
                          })}
                          <button 
                            onClick={() => navigate('/planning')} 
                            className="w-full text-center text-[10px] font-bold text-sky-500 hover:text-sky-600 hover:underline mt-2"
                          >
                              Voir tout le planning
                          </button>
                      </div>
                  )}
              </div>

              {/* TOP PREPARATORS */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" /> Stars du Mois
                  </h3>
                  <div className="space-y-4">
                      {stats?.topPreparators.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs italic">Pas de données</div>
                      ) : (
                          stats?.topPreparators.map(([name, count], index) => (
                              <div key={name} className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm ${
                                      index === 0 ? 'bg-yellow-400' : (index === 1 ? 'bg-slate-300' : 'bg-orange-300')
                                  }`}>
                                      {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="text-sm font-bold text-slate-700 dark:text-white truncate">{name.replace('Dr ', '')}</div>
                                      <div className="text-[10px] text-slate-400 font-bold">{count} préps</div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* CAPSULE STATS */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                  <div className="flex items-start justify-between mb-4">
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Gélules Produites</p>
                          <p className="text-3xl font-black mt-1">{stats?.monthCapsules.toLocaleString()}</p>
                      </div>
                      <Pill className="w-8 h-8 opacity-20" />
                  </div>
                  <div className="text-xs font-bold opacity-70">
                      Sur le mois en cours
                  </div>
              </div>
          </div>
      </div>

      {/* MODAL PATIENT DETAIL */}
      {selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-y-auto relative shadow-2xl">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedPatient.name}</h2>
                    <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="p-8">
                    <PatientHistory patient={selectedPatient} />
                </div>
            </div>
          </div>
      )}

      {/* SMART SCHEDULING MODAL */}
      {isModalOpen && schedulingAlert && suggestion && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
                  
                  {/* Header */}
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-sky-600 dark:text-sky-400">
                          <CalendarDays className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Auto-Renouvellement</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Planification intelligente pour <span className="font-bold text-slate-800 dark:text-white">{schedulingAlert.patient.name}</span>
                      </p>
                  </div>

                  {/* Context */}
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700 text-sm">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">Fin de traitement</span>
                          <span className="font-black text-slate-800 dark:text-white">
                              {formatDateFR(new Date(schedulingAlert.lastPrepTimestamp + schedulingAlert.duration * 86400000).toISOString())}
                          </span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">Cible Idéale (-2j)</span>
                          <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {formatDateFR(suggestion.idealDate)}
                              {!suggestion.isIdeal && <span className="text-[10px] font-black text-red-500 bg-red-100 px-1 rounded">COMPLET</span>}
                          </span>
                      </div>
                  </div>

                  {/* Suggestion */}
                  <div className={`p-4 rounded-xl border-l-4 mb-6 ${
                      suggestion.isIdeal 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' 
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                  }`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                          suggestion.isIdeal ? 'text-emerald-500' : 'text-orange-500'
                      }`}>
                          {suggestion.isIdeal ? '✅ Créneau Parfait Trouvé' : '⚠️ Ajustement Nécessaire'}
                      </p>
                      <div className="flex items-center gap-3">
                          <Calendar className={`w-5 h-5 ${suggestion.isIdeal ? 'text-emerald-600' : 'text-orange-600'}`} />
                          <div>
                              <p className={`text-lg font-black ${suggestion.isIdeal ? 'text-emerald-700 dark:text-white' : 'text-orange-700 dark:text-white'}`}>
                                  {formatDateFR(suggestion.suggestedDate)}
                              </p>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  Il reste {suggestion.slotsLeft} place(s) ce jour-là.
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => setIsModalOpen(false)}
                          className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                          Annuler
                      </button>
                      <button 
                          onClick={confirmAppointment}
                          className="py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2"
                      >
                          <Check className="w-4 h-4" /> Confirmer
                      </button>
                  </div>
                  <button 
                     onClick={() => { setIsModalOpen(false); navigate('/planning'); }}
                     className="w-full text-center mt-4 text-xs font-bold text-sky-500 hover:underline"
                  >
                      Choisir manuellement dans le calendrier
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};