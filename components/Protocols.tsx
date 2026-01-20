import React, { useState, useMemo } from 'react';
import { 
  Search, 
  BookOpen, 
  AlertTriangle, 
  Thermometer, 
  Beaker, 
  Clock, 
  Info, 
  Calculator, 
  Scale, 
  Droplets,
  X,
  FileText,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

// --- TYPES ---

type Category = 'Cardiologie' | 'Néphrologie' | 'Pédiatrie' | 'Métabolisme';

interface Protocol {
  id: string;
  molecule: string;
  category: Category;
  commercialNames: string[]; // Noms commerciaux (DZ)
  dosagesAvailable: number[]; // mg
  excipient: string;
  stability: string;
  instructions: string[];
  precautions?: string;
  reference?: string; // Source (ex: ANSM, CNPM)
}

// --- MOCK DATA (ALGERIA CONTEXT) ---

const PROTOCOLS_DB: Protocol[] = [
  {
    id: 'furosemide',
    molecule: 'Furosémide',
    category: 'Néphrologie',
    commercialNames: ['Lasilix', 'Furosemide LDP', 'Furosemide UPC'],
    dosagesAvailable: [20, 40],
    excipient: 'Amidon de Maïs / Lactose',
    stability: '30 jours (Température ambiante < 25°C)',
    instructions: [
      'Calculer la quantité de comprimés nécessaire.',
      'Broyer finement les comprimés dans un mortier.',
      'Ajouter progressivement l\'excipient (Amidon) par trituration géométrique.',
      'Homogénéiser la poudre pendant 2 minutes.',
      'Répartir dans les gélules selon la taille choisie (T4 préconisé).'
    ],
    precautions: 'Photosensible : Conserver les gélules à l\'abri de la lumière (Conditionnement opaque).',
    reference: 'Fiche Stabilis 2023'
  },
  {
    id: 'spiro',
    molecule: 'Spironolactone',
    category: 'Cardiologie',
    commercialNames: ['Aldactone', 'Prispan', 'Spiro'],
    dosagesAvailable: [50, 75],
    excipient: 'Lactose / Amidon',
    stability: '60 jours (Si conditionné en flacon hermétique)',
    instructions: [
      'Attention au goût très amer de la molécule.',
      'Utiliser de préférence des gélules colorées pour masquer la poudre.',
      'Possibilité d\'ajouter une faible quantité d\'arôme poudre (fraise) si toléré.',
      'Effectuer le mélange par trituration classique.'
    ],
    precautions: 'Goût amer prononcé. Risque de refus chez l\'enfant si la gélule est ouverte.',
    reference: 'Thèse Dr. Benali (2021)'
  },
  {
    id: 'captopril',
    molecule: 'Captopril',
    category: 'Cardiologie',
    commercialNames: ['Lopril', 'Capocard'],
    dosagesAvailable: [25, 50],
    excipient: 'Amidon de Maïs (Éviter le Lactose si possible)',
    stability: '21 jours (Instable à l\'humidité)',
    instructions: [
      'Travailler dans un environnement à faible humidité.',
      'Écraser les comprimés rapidement pour éviter l\'oxydation (odeur de soufre).',
      'Mélanger avec l\'excipient et mettre en gélule immédiatement.',
      'Ajouter un sachet desséchant dans le pilulier final.'
    ],
    precautions: 'Molécule instable. Odeur sulfurée normale mais signe de dégradation si trop forte.',
    reference: 'Guide Pédiatrique CHU Alger'
  },
  {
    id: 'propranolol',
    molecule: 'Propranolol',
    category: 'Cardiologie',
    commercialNames: ['Avlocardyl'],
    dosagesAvailable: [40],
    excipient: 'Cellulose Microcristalline ou Amidon',
    stability: '60 jours',
    instructions: [
      'Utilisé fréquemment pour les hémangiomes infantiles.',
      'Les comprimés sont sécables mais la pulvérisation permet un dosage précis (ex: 3.5mg).',
      'Mélange stable et facile à réaliser.'
    ],
    reference: 'Protocole Hémangiome 2022'
  },
  {
    id: 'bicarb',
    molecule: 'Bicarbonate de Sodium',
    category: 'Métabolisme',
    commercialNames: ['Bicarbonate Vrac', 'Matière Première'],
    dosagesAvailable: [], // Vrac
    excipient: 'Aucun (Poudre Pure)',
    stability: 'Indéfinie (Si sec)',
    instructions: [
      'Peser directement la poudre active (Pas d\'excipient).',
      'Remplissage manuel ou gélulier semi-auto.',
      'Tasser légèrement pour atteindre la masse cible.',
      'Formule conversion : 1g = 12 mEq de Na+ et HCO3-.'
    ],
    precautions: 'Hygroscopique. Bien refermer le pot source après usage.',
    reference: 'Pharmacopée Européenne'
  }
];

// --- COMPONENTS ---

export const Protocols: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Tous'>('Tous');
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  // Logic: Search by Molecule OR Commercial Name
  const filteredProtocols = useMemo(() => {
    return PROTOCOLS_DB.filter(p => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        p.molecule.toLowerCase().includes(term) || 
        p.commercialNames.some(cn => cn.toLowerCase().includes(term));
      
      const matchesCategory = selectedCategory === 'Tous' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const categories: (Category | 'Tous')[] = ['Tous', 'Cardiologie', 'Néphrologie', 'Métabolisme', 'Pédiatrie'];

  const getCategoryColor = (cat: Category) => {
    switch(cat) {
      case 'Cardiologie': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Néphrologie': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Métabolisme': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full animate-[fadeIn_0.4s_ease-out]">
      
      {/* LEFT COLUMN: KNOWLEDGE BASE */}
      <div className="flex-1 flex flex-col gap-6">
          
          {/* HEADER & SEARCH */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
             {/* Decor */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-700/20 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

             <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                            Codex Galénique
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            Référentiel des protocoles de préparation et stabilités.
                        </p>
                    </div>
                    
                    <div className="relative w-full md:w-96 group">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher (ex: Lasilix, Aldactone...)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-900/30 transition-all"
                        />
                        <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                    </div>
                </div>

                {/* CATEGORY TABS */}
                <div className="flex flex-wrap gap-3">
                    {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all border shadow-sm ${
                        selectedCategory === cat
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 transform scale-105'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                    >
                        {cat}
                    </button>
                    ))}
                </div>
             </div>
          </div>

          {/* PROTOCOL GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {filteredProtocols.map(proto => (
               <div 
                 key={proto.id}
                 onClick={() => setSelectedProtocol(proto)}
                 className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group relative overflow-hidden"
               >
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${getCategoryColor(proto.category)}`}>
                            {proto.category}
                        </span>
                        {proto.precautions && (
                            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                                <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mb-2">
                        {proto.molecule}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {proto.commercialNames.map((cn, i) => (
                            <span key={i} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                {cn}
                            </span>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400">
                                <Beaker className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-[10px] font-black text-slate-400 uppercase">Excipient</div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={proto.excipient}>
                                    {proto.excipient}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase">Stabilité</div>
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {proto.stability.split(' ')[0]} {proto.stability.split(' ')[1]}
                                </div>
                            </div>
                        </div>
                      </div>
                  </div>
                  
                  {/* Hover Arrow */}
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </div>
               </div>
             ))}

             {filteredProtocols.length === 0 && (
                <div className="col-span-full py-16 text-center">
                   <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                   </div>
                   <h3 className="text-lg font-black text-slate-700 dark:text-white mb-1">Aucun protocole trouvé</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">
                       Essayez de rechercher par DCI ou nom de spécialité.
                   </p>
                </div>
             )}
          </div>
      </div>

      {/* RIGHT COLUMN: SIDEBAR WIDGETS */}
      <div className="w-full xl:w-80 space-y-6">
          
          {/* WIDGET 1: BSA CALCULATOR */}
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2 bg-white/10 dark:bg-slate-100 rounded-lg">
                        <Calculator className="w-5 h-5 text-sky-400 dark:text-sky-600" />
                   </div>
                   <h3 className="font-black text-sm uppercase tracking-widest">Aide-Mémoire</h3>
                </div>
                
                <div className="space-y-4">
                   <div className="bg-white/5 dark:bg-slate-100/80 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                      <h4 className="text-xs font-black text-sky-300 dark:text-sky-700 mb-2 uppercase tracking-wide">Surface Corporelle (BSA)</h4>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-3 font-medium">Formule de Mosteller</div>
                      <div className="text-xl font-black font-mono tracking-wider text-center bg-black/20 dark:bg-white/50 py-3 rounded-xl border border-white/5">
                         √([T x P] / 3600)
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold px-2">
                          <span>T (cm)</span>
                          <span>P (kg)</span>
                      </div>
                   </div>

                   <div className="bg-white/5 dark:bg-slate-100/80 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                      <h4 className="text-xs font-black text-sky-300 dark:text-sky-700 mb-3 uppercase tracking-wide">Conversions Rapides</h4>
                      <ul className="text-xs space-y-3 font-medium">
                         <li className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                             <span className="text-slate-400 dark:text-slate-600">1 cuillère café</span> 
                             <span className="font-bold">5 ml</span>
                         </li>
                         <li className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                             <span className="text-slate-400 dark:text-slate-600">1 cuillère soupe</span> 
                             <span className="font-bold">15 ml</span>
                         </li>
                         <li className="flex justify-between items-center">
                             <span className="text-slate-400 dark:text-slate-600">1 ml (eau)</span> 
                             <span className="font-bold">20 gouttes</span>
                         </li>
                      </ul>
                   </div>
                </div>
             </div>
             
             {/* Background Glow */}
             <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-sky-500/20 rounded-full blur-[80px]"></div>
          </div>

          {/* WIDGET 2: GOOD PRACTICES */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm">
             <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Scale className="w-4 h-4" /> Bonnes Pratiques
             </h3>
             <ul className="space-y-4">
                <li className="flex gap-4 items-start text-xs text-slate-600 dark:text-slate-300">
                   <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">1</span>
                   <span className="leading-relaxed">Toujours vérifier la tare de la balance avant chaque pesée de précision.</span>
                </li>
                <li className="flex gap-4 items-start text-xs text-slate-600 dark:text-slate-300">
                   <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">2</span>
                   <span className="leading-relaxed">Nettoyer le mortier à l'alcool 70° entre deux molécules différentes.</span>
                </li>
                <li className="flex gap-4 items-start text-xs text-slate-600 dark:text-slate-300">
                   <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">3</span>
                   <span className="leading-relaxed">Double contrôle obligatoire pour toute dose pédiatrique inférieure à 5mg.</span>
                </li>
             </ul>
          </div>

      </div>

      {/* DETAIL MODAL (Overlay) */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
           <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col relative">
              
              {/* Header */}
              <div className="p-8 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 flex justify-between items-start">
                 <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-3 border ${getCategoryColor(selectedProtocol.category)}`}>
                       {selectedProtocol.category}
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                       {selectedProtocol.molecule}
                    </h2>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                       <span className="uppercase text-[10px] tracking-wider text-slate-400">Sources:</span> 
                       {selectedProtocol.commercialNames.join(', ')}
                    </p>
                 </div>
                 <button onClick={() => setSelectedProtocol(null)} className="p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500 dark:text-white" />
                 </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-8 space-y-8">
                 
                 {/* ALERT BOX */}
                 {selectedProtocol.precautions && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-5 flex gap-5">
                       <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-orange-800 dark:text-orange-300 uppercase mb-1">Précautions Importantes</h4>
                          <p className="text-sm text-orange-700 dark:text-orange-200 leading-relaxed font-medium">
                             {selectedProtocol.precautions}
                          </p>
                       </div>
                    </div>
                 )}

                 {/* TECHNICAL SPECS */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                       <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs font-black uppercase tracking-wider">
                          <Beaker className="w-4 h-4" /> Excipient
                       </div>
                       <div className="text-sm font-bold text-slate-800 dark:text-white">
                          {selectedProtocol.excipient}
                       </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                       <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs font-black uppercase tracking-wider">
                          <Thermometer className="w-4 h-4" /> Stabilité
                       </div>
                       <div className="text-sm font-bold text-slate-800 dark:text-white">
                          {selectedProtocol.stability}
                       </div>
                    </div>
                 </div>

                 {/* INSTRUCTIONS */}
                 <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                       <Droplets className="w-4 h-4 text-sky-500" /> Mode Opératoire
                    </h3>
                    <div className="space-y-0 relative pl-4 border-l-2 border-slate-100 dark:border-slate-700 ml-2">
                       {selectedProtocol.instructions.map((step, idx) => (
                          <div key={idx} className="relative pb-8 last:pb-0">
                             <span className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-sky-500 ring-4 ring-white dark:ring-slate-800"></span>
                             <div className="flex gap-4">
                                <span className="text-xs font-black text-slate-300 dark:text-slate-600 mt-0.5">{(idx + 1).toString().padStart(2, '0')}</span>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    {step}
                                </p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-center rounded-b-3xl">
                 <p className="text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                    <Info className="w-3 h-3" />
                    Source : {selectedProtocol.reference || 'Protocole Interne Validé'}
                 </p>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};