import React, { useMemo } from 'react';
import { CAPSULE_TYPES } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  Scale, 
  Zap, 
  Users, 
  Activity, 
  Package, 
  Factory, 
  Calendar,
  ArrowRight
} from 'lucide-react';

export const ProductionStats: React.FC = () => {
  const { patients } = useData(); // Real Data
  
  // --- CONSTANTS ---
  const EXCIPIENT_DENSITY = 0.65; // g/ml (Average density for lactose/starch mix)

  // --- LOGIC ENGINE ---
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalCapsules = 0;
    let totalExcipientMass = 0; // grams
    let totalPrepsCount = 0; // distinct drug objects
    const distinctPatients = new Set<string>();
    const activeDays = new Set<string>(); // "YYYY-MM-DD"
    const moleculeDistribution = new Map<string, number>();

    patients.forEach(p => {
        if (p.history) {
            p.history.forEach(h => {
                const hDate = new Date(h.timestamp);
                
                // FILTER: CURRENT MONTH ONLY
                if (hDate.getMonth() === currentMonth && hDate.getFullYear() === currentYear) {
                    
                    // 1. Working Days
                    activeDays.add(hDate.toDateString());

                    // 2. Distinct Patients
                    distinctPatients.add(p.name);

                    // 3. Process Preparations
                    h.preps.forEach(prep => {
                        if (prep.status === 'ok') {
                            totalPrepsCount++;

                            // Molecule Count for Top 5
                            const molName = prep.molecule;
                            moleculeDistribution.set(molName, (moleculeDistribution.get(molName) || 0) + 1);

                            // Metrics Calculation
                            const numGels = parseInt(prep.gels?.toString() || '0');
                            const doseMg = parseFloat(prep.realDose || '0');
                            const capSize = prep.capsule || 'T4';
                            
                            // Safety Check
                            if (numGels > 0) {
                                totalCapsules += numGels;

                                // --- EXCIPIENT CALCULATION ---
                                // 1. Total Volume Capacity (ml)
                                const capVol = CAPSULE_TYPES[capSize]?.vol || 0.21;
                                const totalVol = capVol * numGels;
                                
                                // 2. Theoretical Total Mass (g) using Density
                                const theoreticalTotalMass = totalVol * EXCIPIENT_DENSITY;

                                // 3. Active Ingredient Mass (g)
                                const activeMassG = (doseMg * numGels) / 1000;

                                // 4. Excipient Needed (g)
                                const excipientNeeded = Math.max(0, theoreticalTotalMass - activeMassG);
                                totalExcipientMass += excipientNeeded;
                            }
                        }
                    });
                }
            });
        }
    });

    const realWorkingDays = activeDays.size || 1; // Avoid div/0

    return {
        monthLabel: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase(),
        totalExcipientMass,
        totalCapsules,
        uniquePatients: distinctPatients.size,
        totalPrepsCount,
        realWorkingDays,
        // Averages
        cadence: Math.round(totalCapsules / realWorkingDays),
        patientYield: (distinctPatients.size / realWorkingDays).toFixed(1),
        excipientFlow: (totalExcipientMass / realWorkingDays).toFixed(1),
        // Top list
        topMolecules: Array.from(moleculeDistribution.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
    };
  }, [patients]);

  // --- UI COMPONENTS ---

  const KpiCard = ({ 
      title, 
      value, 
      subValue, 
      icon: Icon, 
      borderColor 
  }: { 
      title: string, 
      value: React.ReactNode, 
      subValue: string, 
      icon: any, 
      borderColor: string 
  }) => (
      <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 border-t-4 ${borderColor} relative overflow-hidden group hover:shadow-md transition-all`}>
          <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
              <Icon className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
          <div className="text-3xl font-black text-slate-800 dark:text-white mt-1">
              {value}
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1">
              {subValue}
          </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-[fadeIn_0.4s_ease-out]">
        
        {/* INDUSTRIAL HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <Factory className="w-8 h-8 text-slate-800 dark:text-white" />
                    Rapport de Production
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                        Mensuel
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {stats.monthLabel}
                    </span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase">Jours Ouvrés Réels</div>
                <div className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-end gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    {stats.realWorkingDays}
                </div>
            </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* KPI 1: CONSOMMATION AMIDON */}
            <KpiCard 
                title="Conso. Amidon"
                value={
                    stats.totalExcipientMass > 1000 
                    ? <>{(stats.totalExcipientMass / 1000).toFixed(2)} <span className="text-sm">kg</span></> 
                    : <>{Math.round(stats.totalExcipientMass)} <span className="text-sm">g</span></>
                }
                subValue="Masse Excipient Totale"
                icon={Scale}
                borderColor="border-slate-800 dark:border-slate-500"
            />

            {/* KPI 2: CADENCE */}
            <KpiCard 
                title="Cadence Prod."
                value={<>{stats.cadence} <span className="text-sm">Gél/j</span></>}
                subValue="Vitesse Moyenne"
                icon={Zap}
                borderColor="border-yellow-500"
            />

            {/* KPI 3: RENDEMENT PATIENT */}
            <KpiCard 
                title="Flux Patients"
                value={<>{stats.patientYield} <span className="text-sm">Pat/j</span></>}
                subValue="Passage Guichet"
                icon={Users}
                borderColor="border-blue-500"
            />

            {/* KPI 4: DÉBIT EXCIPIENT */}
            <KpiCard 
                title="Débit Matière"
                value={<>{stats.excipientFlow} <span className="text-sm">g/j</span></>}
                subValue="Flux Sortant Amidon"
                icon={Activity}
                borderColor="border-emerald-500"
            />

            {/* KPI 5: VOLUME MEDICAMENTS (Highlight) */}
            <div className="bg-slate-900 dark:bg-white p-6 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 dark:bg-slate-900/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lots Validés</h3>
                    <Package className="w-5 h-5 text-white dark:text-slate-900" />
                </div>
                <div className="text-5xl font-black text-white dark:text-slate-900 mt-2 relative z-10">
                    {stats.totalPrepsCount}
                </div>
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase flex items-center gap-1 relative z-10">
                    Médicaments Réalisés
                </div>
            </div>

        </div>

        {/* BOTTOM TABLE - STOCK SHEET STYLE */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" /> Top 5 Molécules - {stats.monthLabel}
                </h3>
                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded uppercase">
                    Sortie de Stock
                </span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">#</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Désignation</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Volume (Unités)</th>
                            <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Part de Prod.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                        {stats.topMolecules.length > 0 ? (
                            stats.topMolecules.map(([name, count], index) => {
                                const share = Math.round((count / stats.totalPrepsCount) * 100);
                                return (
                                    <tr key={name} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">
                                            {name}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-800 dark:text-white">
                                            {count}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-800 dark:bg-slate-400" style={{ width: `${share}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 w-8">{share}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-slate-400 uppercase italic">
                                    Aucune donnée de production pour ce mois.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};