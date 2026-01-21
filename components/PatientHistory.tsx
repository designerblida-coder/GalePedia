import React from 'react';
import { CheckCircle, Ban, Calendar, UserCheck } from 'lucide-react';
import { Patient, CAPSULE_TYPES } from '../types';

interface PatientHistoryProps {
  patient: Patient;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ patient }) => {
  if (!patient.history || patient.history.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12 italic border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
        Aucun historique disponible
      </div>
    );
  }

  // Clone and reverse to show newest first
  const reversedHistory = [...patient.history].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-8 relative pl-2">
      {reversedHistory.map((log, index) => (
        <div key={index} className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-700 pb-10 last:pb-0 last:border-0 animate-[fadeIn_0.3s_ease-out]">
          {/* Timeline Dot */}
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border-4 border-sky-500 shadow-sm z-10"></div>
          
          {/* Header */}
          <div className="mb-4">
             <div className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                <Calendar className="w-3 h-3" />
                <span>{log.date}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-600 dark:text-slate-400">{log.doctor || 'Médecin non renseigné'}</span>
             </div>
             
             {/* Preparators */}
             {log.preparators && log.preparators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                   {log.preparators.map((prep, i) => (
                      <span key={i} className="text-[9px] font-bold bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 px-2 py-1 rounded border border-sky-100 dark:border-sky-900 flex items-center gap-1">
                         <UserCheck className="w-3 h-3" />
                         {prep.replace('Dr ', '')}
                      </span>
                   ))}
                </div>
             )}
          </div>

          {/* Preparations List */}
          <div className="grid gap-3">
            {log.preps.map((prep, i) => {
               const isOk = prep.status === 'ok';
               const capLabel = prep.capsule ? (CAPSULE_TYPES[prep.capsule]?.label || prep.capsule) : '?';
               
               if (isOk) {
                 // Check if it's a powder based on totalMass existence or explicit type
                 const isPowder = prep.type === 'powder' || !!prep.totalMass;

                 return (
                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md">
                        <div>
                            <div className="font-black text-slate-800 dark:text-white text-base md:text-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                {prep.molecule}
                            </div>
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 pl-7">
                                Gélule {capLabel}
                            </div>
                        </div>
                        <div className="text-right">
                            {isPowder ? (
                                <div className="text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400">
                                   Pesée: {prep.totalMass} g
                                </div>
                            ) : (
                                <div className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400">
                                   {prep.tabs} cp
                                </div>
                            )}
                            
                            <div className="text-[10px] md:text-xs font-bold text-slate-400">{prep.realDose} mg/gél</div>
                            <div className="text-[10px] md:text-xs font-black text-sky-600 dark:text-sky-400 mt-1">{prep.gels} Gélules</div>
                        </div>
                    </div>
                 );
               } else {
                 return (
                    <div key={i} className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4">
                        <div className="font-black text-orange-800 dark:text-orange-400 text-base md:text-lg flex items-center gap-2">
                            <Ban className="w-5 h-5" />
                            {prep.molecule}
                        </div>
                        <div className="text-xs font-black text-orange-500 mt-1 pl-7 uppercase">Non Faisable</div>
                        <div className="mt-3 text-sm font-medium text-orange-900 dark:text-orange-300 bg-orange-100/50 dark:bg-orange-900/30 p-3 rounded-lg italic border border-orange-100 dark:border-orange-800/30">
                            "{prep.reason}"
                        </div>
                    </div>
                 );
               }
            })}
          </div>
        </div>
      ))}
    </div>
  );
};