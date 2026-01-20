import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, AlertCircle, Info, RefreshCw, Scale, Tablets, Layers, Beaker, Check, Plus, AlertTriangle, XCircle, Sparkles, ArrowRight, AlignJustify, Maximize } from 'lucide-react';
import { DRUG_MASTER, CAPSULE_TYPES } from '../types';

interface PreparationRowProps {
  id: number;
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: any) => void;
  patientWeight: number; // For potential future checks per kg
}

interface Batch {
  id: string;
  qty: number;
}

export const PreparationRow: React.FC<PreparationRowProps> = ({ id, onDelete, onUpdate, patientWeight }) => {
  // Form State
  const [drugKey, setDrugKey] = useState<string>('');
  const [feasibility, setFeasibility] = useState<'ok' | 'ko'>('ok');
  const [capsuleSize, setCapsuleSize] = useState<string>('T4');
  const [targetDose, setTargetDose] = useState<string>('');
  const [freq, setFreq] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [totalGels, setTotalGels] = useState<string>('14'); 
  const [reason, setReason] = useState<string>('');
  
  // Optimization State (Forced tablet count selected by user)
  const [forcedTabs, setForcedTabs] = useState<number | null>(null);

  // NEW: Manual Batch Management for Bicarb
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Auto-calculate Total Gels
  useEffect(() => {
    const f = parseInt(freq);
    const d = parseInt(duration);
    
    if (!isNaN(f) && !isNaN(d) && f > 0 && d > 0) {
      if (drugKey === 'bicarb') {
          // Step A: Calculate Capsules per Intake based on max 250mg capacity
          const dose = parseFloat(targetDose) || 0;
          const capsPerIntake = dose > 250 ? Math.ceil(dose / 250) : 1;
          setTotalGels((f * d * capsPerIntake).toString());
      } else {
          setTotalGels((f * d).toString());
      }
    }
  }, [freq, duration, drugKey, targetDose]);

  // Reset forced tabs if critical inputs change
  useEffect(() => {
    setForcedTabs(null);
  }, [drugKey, targetDose, totalGels]);

  // CALCULATION ENGINE
  const calculations = useMemo(() => {
    if (!drugKey || feasibility === 'ko') return null;
    
    const doseVal = parseFloat(targetDose);
    const gelsVal = parseInt(totalGels);
    
    if (isNaN(doseVal) || isNaN(gelsVal) || doseVal <= 0 || gelsVal <= 0) return null;

    const drug = DRUG_MASTER[drugKey];
    const capsule = CAPSULE_TYPES[capsuleSize];

    // --- SPECIAL LOGIC FOR SODIUM BICARBONATE ---
    if (drugKey === 'bicarb') {
        const capsPerIntake = doseVal > 250 ? Math.ceil(doseVal / 250) : 1;
        // Physical dose per single capsule
        const contentPerCapsuleMg = doseVal / capsPerIntake;
        // Excipient factor
        const volPerCapsule = capsule.vol;

        return {
            type: 'bicarb',
            unit: capsule.label,
            capsPerIntake,
            realDosePerGel: contentPerCapsuleMg,
            volPerCapsule
        };
    }

    // --- LOGIC FOR STANDARD POWDER ---
    if (drug.type === 'powder') {
        const totalActiveMassMg = doseVal * gelsVal;
        const totalActiveMassG = totalActiveMassMg / 1000;
        const excipientVol = gelsVal * capsule.vol;

        return {
            type: 'powder',
            totalMassG: totalActiveMassG,
            excipientVol,
            unit: capsule.label,
            realDosePerGel: doseVal
        };
    }

    // --- LOGIC FOR TABLETS ---
    const exactTabsNeeded = (doseVal * gelsVal) / drug.sourceUnit;
    const finalTabs = forcedTabs !== null ? forcedTabs : exactTabsNeeded;
    const realDosePerGel = (finalTabs * drug.sourceUnit) / gelsVal;
    const excipientVol = gelsVal * capsule.vol;
    const diffPercent = ((realDosePerGel - doseVal) / doseVal) * 100;

    const step = drug.step;
    const lower = Math.floor(exactTabsNeeded / step) * step;
    const upper = lower + step;
    const options = lower === upper ? [lower] : [lower, upper];
    
    const suggestions = options.map(val => {
      const optDose = (val * drug.sourceUnit) / gelsVal;
      const optDiff = ((optDose - doseVal) / doseVal) * 100;
      return { tabs: val, dose: optDose, diff: optDiff };
    });

    return {
      type: 'tablet',
      finalTabs,
      realDosePerGel,
      excipientVol,
      diffPercent,
      suggestions,
      unit: capsule.label
    };
  }, [drugKey, feasibility, targetDose, totalGels, capsuleSize, forcedTabs]);


  // Initialize Batches when Total Gels Changes (Default Balanced Logic)
  useEffect(() => {
     if (drugKey === 'bicarb') {
         const total = parseInt(totalGels);
         if (!isNaN(total) && total > 0) {
             // Init with Balanced Strategy by default
             const numBatches = Math.ceil(total / 100);
             const baseQty = Math.floor(total / numBatches);
             const remainder = total % numBatches;
             
             const newBatches: Batch[] = [];
             for (let i = 0; i < numBatches; i++) {
                 const qty = i < remainder ? baseQty + 1 : baseQty;
                 newBatches.push({ id: crypto.randomUUID(), qty });
             }
             setBatches(newBatches);
         } else {
             setBatches([]);
         }
     }
  }, [totalGels, drugKey]);

  // SUGGESTION LOGIC (Computed on the fly)
  const distributionSuggestions = useMemo(() => {
      const total = parseInt(totalGels);
      if (isNaN(total) || total <= 0) return null;

      // Strat A: Maximize 100
      const stratA: number[] = [];
      let remA = total;
      while (remA > 0) {
          const take = Math.min(100, remA);
          stratA.push(take);
          remA -= take;
      }

      // Strat B: Balanced
      const numBatches = Math.ceil(total / 100);
      const base = Math.floor(total / numBatches);
      const remB = total % numBatches;
      const stratB: number[] = Array(numBatches).fill(base).map((val, i) => i < remB ? val + 1 : val);

      // Check if identical (to hide duplicates)
      const areIdentical = stratA.length === stratB.length && stratA.every((v, i) => v === stratB[i]);

      return { stratA, stratB, areIdentical };
  }, [totalGels]);


  // BATCH ACTIONS
  const applySuggestion = (qtyArray: number[]) => {
      const newBatches = qtyArray.map(qty => ({ id: crypto.randomUUID(), qty }));
      setBatches(newBatches);
      setShowSuggestions(false);
  };

  const updateBatchQty = (batchId: string, val: string) => {
      const qty = parseInt(val) || 0;
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, qty } : b));
  };

  const addBatch = () => {
      setBatches(prev => [...prev, { id: crypto.randomUUID(), qty: 0 }]);
  };

  const removeBatch = (batchId: string) => {
      setBatches(prev => prev.filter(b => b.id !== batchId));
  };

  // Helper for Validation
  const currentTotal = batches.reduce((sum, b) => sum + b.qty, 0);
  const requiredTotal = parseInt(totalGels) || 0;
  const isBatchSumValid = drugKey === 'bicarb' ? currentTotal === requiredTotal : true;

  // Notify parent of changes
  useEffect(() => {
    const drug = drugKey ? DRUG_MASTER[drugKey] : null;
    let computedMass = undefined;
    
    if (calculations?.type === 'powder') computedMass = calculations.totalMassG.toFixed(2);
    
    // For Bicarb, sum up mass of all batches for history
    if (calculations?.type === 'bicarb') {
        const totalMass = batches.reduce((sum, b) => {
            return sum + ((calculations.realDosePerGel * b.qty) / 1000);
        }, 0);
        computedMass = totalMass.toFixed(4);
    }

    onUpdate(id, {
      drugKey,
      molecule: drug?.name,
      feasibility,
      type: drug?.type,
      targetDose,
      totalGels,
      capsuleSize,
      duration: parseInt(duration) || 0,
      tabs: calculations?.type === 'tablet' ? calculations.finalTabs.toFixed(2) : undefined,
      totalMass: computedMass,
      realDose: calculations?.realDosePerGel.toFixed(2),
      reason,
      valid: feasibility === 'ok' ? (!!calculations && isBatchSumValid) : !!reason.trim()
    });
  }, [drugKey, feasibility, targetDose, totalGels, capsuleSize, calculations, reason, duration, batches, isBatchSumValid]);

  const currentDrugType = drugKey ? DRUG_MASTER[drugKey]?.type : 'tablet';

  return (
    <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 relative shadow-sm animate-[fadeIn_0.3s_ease-out]">
      <button 
        onClick={() => onDelete(id)} 
        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
        title="Supprimer la ligne"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Row Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase">Molécule</label>
          <select 
            value={drugKey} 
            onChange={(e) => setDrugKey(e.target.value)} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">-- Choisir --</option>
            {Object.entries(DRUG_MASTER).map(([key, d]) => {
              let labelSuffix = '';
              if (d.type === 'tablet') {
                if (!d.name.includes(`${d.sourceUnit}mg`)) {
                   labelSuffix = ` (${d.sourceUnit}mg)`;
                }
              } else {
                 labelSuffix = ' (Poudre)';
              }

              return (
                <option key={key} value={key}>
                  {d.name}{labelSuffix}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase">Faisabilité</label>
          <select 
            value={feasibility}
            onChange={(e) => setFeasibility(e.target.value as 'ok' | 'ko')}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="ok">✅ OUI - Faisable</option>
            <option value="ko">❌ NON - Non Faisable</option>
          </select>
        </div>
      </div>

      {/* OK MODE: CALCULATOR */}
      {feasibility === 'ok' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Taille Gélule</label>
                <select 
                  value={capsuleSize}
                  onChange={(e) => setCapsuleSize(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                   {Object.keys(CAPSULE_TYPES).reverse().map(k => (
                     <option key={k} value={k}>{CAPSULE_TYPES[k].label}</option>
                   ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Dose / Gélule (mg)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={targetDose}
                  onChange={(e) => setTargetDose(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Fréq (/j)</label>
                  <input type="number" value={freq} onChange={(e) => setFreq(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Durée (j)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">Total Gélules (Calculé)</label>
                <input 
                  type="number" 
                  value={totalGels}
                  readOnly={drugKey === 'bicarb'} // Read-only for bicarb as it's derivative
                  onChange={(e) => setTotalGels(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm font-black outline-none ${
                    drugKey === 'bicarb' 
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                      : 'bg-sky-50 text-sky-700 border-sky-200 focus:ring-2 focus:ring-sky-500 dark:bg-slate-700 dark:border-sky-900 dark:text-sky-400'
                  }`}
                />
              </div>
            </div>

            {/* Optimizer: Only show for Tablets */}
            {calculations && calculations.type === 'tablet' && (
              <div className="p-4 bg-slate-900 rounded-xl text-white">
                 <p className="text-[9px] font-black text-sky-400 uppercase mb-3 flex items-center gap-2">
                   <RefreshCw className="w-3 h-3" /> Optimiseur de Sécabilité
                 </p>
                 <div className="grid grid-cols-2 gap-3">
                    {calculations.suggestions.map((opt, idx) => {
                      const isActive = calculations.finalTabs && Math.abs(calculations.finalTabs - opt.tabs) < 0.01;
                      return (
                        <button 
                          key={idx}
                          onClick={() => setForcedTabs(opt.tabs)}
                          className={`p-3 rounded-lg text-left transition-all border ${
                            isActive 
                              ? 'bg-sky-600 border-sky-500 text-white' 
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-sky-500/50'
                          }`}
                        >
                          <div className="text-[10px] font-bold opacity-80 uppercase">{opt.tabs.toFixed(2)} Comprimés</div>
                          <div className="text-sm font-black">{opt.dose.toFixed(2)} mg/gél</div>
                          <div className={`text-[9px] font-bold ${opt.diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {opt.diff > 0 ? '+' : ''}{opt.diff.toFixed(1)}%
                          </div>
                        </button>
                      )
                    })}
                 </div>
              </div>
            )}
            
            {/* Info for Standard Powders */}
            {calculations && calculations.type === 'powder' && (
               <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800 rounded-xl flex items-start gap-3">
                   <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5" />
                   <div>
                       <h4 className="text-xs font-black text-sky-800 dark:text-sky-400 mb-1">Poudre Pure</h4>
                       <p className="text-xs text-sky-700 dark:text-sky-300">
                         Cette préparation utilise une substance active en poudre. La masse totale à peser correspond à la quantité exacte de principe actif nécessaire pour {totalGels} gélules.
                       </p>
                   </div>
               </div>
            )}
          </div>

          {/* RESULTS */}
          <div className={`lg:col-span-5 flex flex-col gap-3 transition-opacity duration-300 ${!calculations ? 'opacity-30' : 'opacity-100'}`}>
             
             {/* SPECIAL BICARB UI - BATCH MANAGER */}
             {calculations && calculations.type === 'bicarb' ? (
                 <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Gestion des Lots
                        </h4>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Précision 0.0001g
                        </div>
                    </div>

                    {/* MAGIC SUGGESTION BUTTON */}
                    {distributionSuggestions && (
                        <div className="mb-2">
                            <button 
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs font-black uppercase transition-all shadow-sm ${
                                    showSuggestions 
                                    ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' 
                                    : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-md hover:scale-[1.02]'
                                }`}
                            >
                                <Sparkles className="w-3 h-3" /> 
                                {showSuggestions ? 'Masquer' : 'Suggérer une répartition'}
                            </button>

                            {/* SUGGESTION OPTIONS PANEL */}
                            {showSuggestions && (
                                <div className="mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-xl animate-[fadeIn_0.2s_ease-out]">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                                        💡 Propositions pour {totalGels} gélules :
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Strategy A: Maximize 100 */}
                                        <button 
                                            onClick={() => applySuggestion(distributionSuggestions.stratA)}
                                            className="flex items-center justify-between p-2 rounded border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 group text-left"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded text-indigo-600 dark:text-indigo-400">
                                                    <Maximize className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-800 dark:text-white">Optimisé Gélulier</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Remplir 100 max</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                                                ({distributionSuggestions.stratA.join('/')})
                                            </div>
                                        </button>

                                        {/* Strategy B: Balanced (Only show if different) */}
                                        {!distributionSuggestions.areIdentical && (
                                            <button 
                                                onClick={() => applySuggestion(distributionSuggestions.stratB)}
                                                className="flex items-center justify-between p-2 rounded border border-fuchsia-100 dark:border-fuchsia-900/50 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 group text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded text-fuchsia-600 dark:text-fuchsia-400">
                                                        <AlignJustify className="w-3 h-3" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-slate-800 dark:text-white">Équilibré</div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Répartition homogène</div>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/30 px-2 py-1 rounded">
                                                    ({distributionSuggestions.stratB.join('/')})
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Batch List */}
                    <div className="space-y-2">
                        {batches.map((batch, idx) => {
                            const mass = (calculations.realDosePerGel * batch.qty) / 1000;
                            const vol = batch.qty * calculations.volPerCapsule;
                            const isOverLimit = batch.qty > 100;

                            return (
                                <div key={batch.id} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 shadow-sm flex items-center gap-3">
                                    {/* Number */}
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                        {idx + 1}
                                    </div>
                                    
                                    {/* Input Qty */}
                                    <div className="w-16">
                                        <input 
                                            type="number" 
                                            value={batch.qty}
                                            onChange={(e) => updateBatchQty(batch.id, e.target.value)}
                                            className={`w-full text-center font-black text-sm p-1 rounded border outline-none ${
                                                isOverLimit 
                                                ? 'text-orange-600 border-orange-300 bg-orange-50 focus:ring-2 focus:ring-orange-500' 
                                                : 'text-slate-800 dark:text-white border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    
                                    {/* Calculated Values */}
                                    <div className="flex-1 text-right">
                                        <div className="text-sm font-black text-slate-800 dark:text-white">
                                            {mass.toFixed(4)} g
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400">
                                            QSP {vol.toFixed(1)} ml
                                        </div>
                                    </div>

                                    {/* Delete Action */}
                                    <button 
                                        onClick={() => removeBatch(batch.id)}
                                        className="text-slate-300 hover:text-red-500 p-1"
                                        title="Supprimer ce lot"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Add Button */}
                    <button 
                        onClick={addBatch}
                        className="w-full py-2 flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 transition-all"
                    >
                        <Plus className="w-3 h-3" /> Ajouter un lot
                    </button>

                    {/* Total Check / Validation */}
                    <div className={`mt-2 p-3 rounded-lg flex items-center justify-between border ${
                        isBatchSumValid 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400'
                    }`}>
                        <div className="flex items-center gap-2">
                            {isBatchSumValid ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <div className="text-xs font-black uppercase">
                                {isBatchSumValid ? 'Total Validé' : 'Erreur Total'}
                            </div>
                        </div>
                        <div className="text-sm font-black">
                            {currentTotal} / {requiredTotal} Gél
                        </div>
                    </div>
                 </div>
             ) : (
                <>
                 {/* STANDARD RESULTS */}
                 {currentDrugType === 'powder' ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <p className="text-[10px] font-black text-indigo-500 uppercase mb-2 flex items-center gap-2">
                            <Scale className="w-3 h-3" /> Masse à Peser
                        </p>
                        <div className="flex justify-between items-end">
                          <span className="text-3xl font-black text-indigo-700 dark:text-indigo-400">
                              {calculations?.type === 'powder' ? calculations.totalMassG.toFixed(2) : '0.00'}
                          </span>
                          <span className="text-xs font-bold text-indigo-500 mb-1">g</span>
                        </div>
                    </div>
                 ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50">
                        <p className="text-[10px] font-black text-red-400 uppercase mb-2 flex items-center gap-2">
                            <Tablets className="w-3 h-3" /> Comprimés à utiliser
                        </p>
                        <div className="flex justify-between items-end">
                        <span className="text-3xl font-black text-red-600 dark:text-red-400">
                            {calculations?.type === 'tablet' ? calculations.finalTabs.toFixed(2) : '0.00'}
                        </span>
                        </div>
                    </div>
                 )}
                 
                 {/* REAL DOSE (Simplified for Powder) */}
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Dose Réelle</p>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{calculations?.realDosePerGel.toFixed(2) || '0.00'}</span>
                      <span className="text-xs font-bold text-emerald-500 mb-1">mg / gélule</span>
                    </div>
                    {calculations && calculations.type === 'tablet' && (
                      <div className={`text-[10px] font-bold mt-1 uppercase ${Math.abs(calculations.diffPercent) > 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {calculations.diffPercent > 0 ? '+' : ''}{calculations.diffPercent.toFixed(1)}% vs prescription
                      </div>
                    )}
                 </div>

                 {/* EXCIPIENT */}
                 <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl border border-sky-100 dark:border-sky-900/50">
                    <p className="text-[10px] font-black text-sky-500 uppercase mb-2">Volume Remplissage</p>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black text-sky-700 dark:text-sky-400">{calculations?.excipientVol.toFixed(2) || '0.00'}</span>
                      <span className="text-xs font-bold text-sky-500 mb-1">ml ({capsuleSize})</span>
                    </div>
                 </div>
                </>
             )}
          </div>
        </div>
      )}

      {/* KO MODE: REASON */}
      {feasibility === 'ko' && (
         <div className="animate-[fadeIn_0.3s_ease-out]">
            <label className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-2 mb-2">
              <AlertCircle className="w-3 h-3" /> Motif de non-faisabilité (Obligatoire)
            </label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none text-orange-900 placeholder-orange-300 h-24 dark:bg-slate-700 dark:border-orange-500 dark:text-white"
              placeholder="Ex: Dosage trop faible, Molécule en rupture, Contre-indication..."
            />
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Ce commentaire sera enregistré dans l'historique du patient.
            </p>
         </div>
      )}
    </div>
  );
};