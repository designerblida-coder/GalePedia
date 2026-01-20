import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanning } from '../contexts/PlanningContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Pill, Trash2, CheckCircle2, Plus, X, Lock, Phone, Search, ChevronRight as ArrowRight, Sparkles, Activity } from 'lucide-react';
import { ALGERIA_HOLIDAYS, MOCK_PATIENTS, Patient } from '../types';

export const Planning: React.FC = () => {
  const navigate = useNavigate();
  const { appointments, getDailyCount, addAppointment, deleteAppointment, MAX_CAPACITY } = usePlanning();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Form State
  const [newPatientName, setNewPatientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  // Autocomplete
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

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

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  let firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) - 1;
  if (firstDay < 0) firstDay = 6;

  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // HANDLERS
  const handleDayClick = (dateStr: string, isClosed: boolean, isFull: boolean) => {
      if (isClosed) return;
      
      setSelectedDate(dateStr);
      const dailyCount = getDailyCount(dateStr);

      if (dailyCount > 0) {
          setIsDetailModalOpen(true);
      } else if (!isFull) {
          openAddModal(dateStr);
      }
  };

  const openAddModal = (dateStr?: string) => {
      if (dateStr) setSelectedDate(dateStr);
      setNewPatientName('');
      setNewPhone('');
      setSuggestions([]);
      setIsDetailModalOpen(false); 
      setIsAddModalOpen(true);
  };

  const handlePatientNameChange = (val: string) => {
    setNewPatientName(val);
    if (val.trim().length > 1) {
       const filtered = MOCK_PATIENTS.filter(p => p.name.includes(val.toUpperCase()));
       setSuggestions(filtered);
       setShowSuggestions(true);
    } else {
       setShowSuggestions(false);
    }
  };

  const selectSuggestion = (p: Patient) => {
      setNewPatientName(p.name);
      setNewPhone(p.phone || '');
      setShowSuggestions(false);
  };

  const handleSaveAppointment = () => {
      if (!newPatientName.trim()) return alert("Nom du patient requis");
      
      try {
          addAppointment({
              id: crypto.randomUUID(),
              patientId: 'manual-' + Date.now(),
              patientName: newPatientName.toUpperCase(),
              date: selectedDate,
              status: 'confirmed',
              molecule: newPhone 
          });
          setIsAddModalOpen(false);
      } catch (err: any) {
          alert(err.message);
      }
  };

  const goToPatientProfile = (patientName: string) => {
      navigate('/patients', { state: { openPatient: patientName } });
  };

  // --- NEON LOAD RING COMPONENT ---
  const NeonRing = ({ count, max, colorHex }: { count: number, max: number, colorHex: string }) => {
      const radius = 18;
      const circumference = 2 * Math.PI * radius;
      const percent = Math.min(100, (count / max) * 100);
      const offset = circumference - (percent / 100) * circumference;

      return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Glow Container (Dark Mode Only) */}
            <div className="hidden dark:block absolute inset-0 rounded-full blur-[8px] opacity-40" style={{ backgroundColor: colorHex }}></div>
            
            <svg className="w-full h-full transform -rotate-90 relative z-10">
                {/* Track */}
                <circle 
                    cx="24" cy="24" r={radius} 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="transparent" 
                    className="text-slate-200 dark:text-white/10"
                />
                {/* Progress */}
                <circle 
                    cx="24" cy="24" r={radius} 
                    stroke={colorHex}
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pt-0.5 font-mono text-[10px] font-bold text-slate-700 dark:text-white drop-shadow-sm">
                {count}
            </div>
        </div>
      );
  };

  // --- RENDER DAYS ---
  const renderDays = () => {
      const days = [];
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-40 bg-slate-50 border border-slate-100 dark:bg-slate-900/20 rounded-3xl dark:border-white/5 backdrop-blur-sm"></div>);
      }

      for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          const count = getDailyCount(dateStr);
          const dailyAppts = appointments.filter(a => a.date === dateStr);
          
          const dayOfWeek = dateObj.getDay();
          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
          const holidayKey = `${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const holidayName = ALGERIA_HOLIDAYS[holidayKey];
          const isHoliday = !!holidayName;

          const isClosed = isWeekend || isHoliday;
          const isFull = count >= MAX_CAPACITY;
          
          // --- STYLE LOGIC (Hybrid: Clean Light / Neon Dark) ---
          // Defaults (Empty Day)
          let containerClass = "bg-white border-slate-200 hover:border-sky-300 dark:bg-slate-900/40 dark:border-white/10 dark:hover:border-white/30";
          let glowEffect = "";
          let iconOpacity = "opacity-[0.03] dark:opacity-5 text-slate-900 dark:text-white";
          let ringColor = "#64748b"; // Slate

          if (isClosed) {
             containerClass = "bg-slate-100 border-transparent opacity-60 dark:bg-[#050510]/80 dark:border-white/5 dark:opacity-80 dark:bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]";
          } else if (isFull) {
             // DANGER / FULL
             containerClass = "bg-rose-50 border-rose-200 dark:bg-gradient-to-br dark:from-rose-900/40 dark:to-red-950/80 dark:border-rose-500/50 dark:shadow-[0_0_30px_rgba(225,29,72,0.2)] dark:animate-pulse";
             glowEffect = "dark:shadow-[inset_0_0_20px_rgba(225,29,72,0.2)]";
             iconOpacity = "opacity-10 text-rose-500 dark:opacity-20";
             ringColor = "#f43f5e"; // Rose 500
          } else if (count >= 4) {
             // BUSY / TENDU
             containerClass = "bg-amber-50 border-amber-200 dark:bg-gradient-to-br dark:from-amber-900/30 dark:to-orange-950/60 dark:border-amber-500/40 dark:shadow-[0_0_20px_rgba(245,158,11,0.15)]";
             glowEffect = "dark:shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]";
             iconOpacity = "opacity-10 text-amber-500 dark:opacity-10";
             ringColor = "#f59e0b"; // Amber 500
          } else if (count > 0) {
             // AVAILABLE / DISPO
             containerClass = "bg-cyan-50 border-cyan-200 dark:bg-gradient-to-br dark:from-cyan-900/30 dark:to-emerald-900/30 dark:border-cyan-500/40 dark:shadow-[0_0_20px_rgba(6,182,212,0.15)]";
             glowEffect = "dark:shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]";
             iconOpacity = "opacity-10 text-cyan-400 dark:opacity-10";
             ringColor = "#22d3ee"; // Cyan 400
          }

          days.push(
              <div 
                key={d} 
                onClick={() => handleDayClick(dateStr, isClosed, isFull)}
                className={`h-44 p-4 rounded-3xl border backdrop-blur-md transition-all duration-500 ease-out relative group overflow-hidden flex flex-col justify-between cursor-pointer hover:scale-[1.03] hover:z-10 ${containerClass} ${glowEffect}`}
              >
                  {/* WATERMARK ICON */}
                  <div className={`absolute -right-4 -bottom-4 transform -rotate-12 transition-all duration-700 group-hover:scale-110 group-hover:rotate-0 ${iconOpacity}`}>
                     {isClosed ? <Lock className="w-24 h-24" /> : <Pill className="w-28 h-28" />}
                  </div>

                  {/* TOP ROW */}
                  <div className="flex justify-between items-start z-10">
                      <span className="text-3xl font-black text-slate-800 dark:text-white dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] tracking-tighter transition-colors">
                          {d}
                      </span>
                      
                      {!isClosed && (
                          <div className="group-hover:scale-110 transition-transform duration-300">
                             <NeonRing count={count} max={MAX_CAPACITY} colorHex={ringColor} />
                          </div>
                      )}
                  </div>

                  {/* MIDDLE CONTENT (CLOSED OR HOLIDAY) */}
                  <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                      {isClosed && (
                          <div className="flex flex-col items-center animate-[fadeIn_0.5s]">
                              <div className="p-3 rounded-full bg-slate-200/50 border border-slate-300 dark:bg-slate-950/50 dark:border-purple-500/30 dark:shadow-[0_0_15px_rgba(168,85,247,0.3)] mb-2 backdrop-blur-xl transition-colors">
                                  <Lock className="w-5 h-5 text-slate-500 dark:text-purple-400" />
                              </div>
                              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-purple-300 dark:drop-shadow-[0_0_5px_rgba(168,85,247,0.8)] uppercase transition-colors">
                                  {isHoliday ? 'Férié' : 'Fermé'}
                              </span>
                          </div>
                      )}

                      {/* Holiday Badge Overlay */}
                      {isHoliday && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center">
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300 uppercase bg-indigo-100 dark:bg-indigo-950/80 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-500/50 shadow-sm dark:shadow-[0_0_10px_rgba(99,102,241,0.5)] whitespace-nowrap transition-colors">
                                 ✨ {holidayName}
                              </span>
                          </div>
                      )}
                  </div>

                  {/* BOTTOM ROW (Avatars/Indicators) */}
                  {!isClosed && count > 0 && (
                      <div className="relative z-10 flex items-center gap-1 mt-2">
                          <div className="flex -space-x-2">
                             {dailyAppts.slice(0, 3).map((appt, idx) => (
                                 <div key={idx} className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-white/20 dark:text-white flex items-center justify-center text-[8px] font-bold shadow-md transition-colors">
                                     {appt.patientName.charAt(0)}
                                 </div>
                             ))}
                          </div>
                          {count > 3 && (
                             <span className="text-[10px] font-bold text-slate-500 dark:text-white/60 ml-1">+{count - 3}</span>
                          )}
                      </div>
                  )}

                  {/* HOVER GLOW EFFECT (Add Button) */}
                  {!isClosed && !isFull && (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-50/20 dark:bg-cyan-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                          <div className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg dark:shadow-[0_0_20px_rgba(34,211,238,0.6)] transform scale-0 group-hover:scale-100 transition-transform duration-300">
                              <Plus className="w-6 h-6" />
                          </div>
                      </div>
                  )}
              </div>
          );
      }
      return days;
  };

  const selectedDayAppointments = appointments.filter(a => a.date === selectedDate);

  // --- MAIN RENDER ---
  return (
    // Root container: White in Light Mode, Radial Gradient in Dark Mode
    <div className="min-h-screen -m-8 p-8 font-sans selection:bg-cyan-500/30 bg-slate-50 text-slate-900 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-[#1e293b] dark:via-[#0f172a] dark:to-[#020617] dark:text-white transition-colors duration-500">
        
        <div className="max-w-[1600px] mx-auto space-y-10 animate-[fadeIn_0.6s_ease-out]">
            
            {/* HUD HEADER */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl p-8 dark:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] flex items-center gap-4 transition-colors">
                            <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-100 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                                <Activity className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <span>PLANNING OPÉRATIONNEL</span>
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium tracking-wide">
                            <span className="text-cyan-500 dark:text-cyan-400">●</span> Système de régulation de charge activé. Capacité Max: {MAX_CAPACITY}.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 bg-slate-100 border border-slate-200 dark:bg-slate-950/50 p-2 rounded-2xl dark:border-white/10 dark:shadow-inner transition-colors">
                        <button onClick={prevMonth} className="p-4 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-cyan-600 dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <span className="font-black text-2xl w-64 text-center uppercase tracking-[0.2em] text-slate-800 dark:text-white dark:drop-shadow-md">
                            {monthName}
                        </span>
                        <button onClick={nextMonth} className="p-4 hover:bg-white rounded-xl transition-all text-slate-500 hover:text-cyan-600 dark:hover:bg-white/10 dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* LEGEND BADGES */}
            <div className="flex flex-wrap gap-4 justify-end">
                {[
                  { label: 'Disponible', color: 'bg-cyan-500', shadow: 'shadow-cyan-500/50' },
                  { label: 'Tendu', color: 'bg-amber-500', shadow: 'shadow-amber-500/50' },
                  { label: 'Complet', color: 'bg-rose-600', shadow: 'shadow-rose-600/50' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm dark:bg-slate-900/60 dark:border-white/5 dark:backdrop-blur-md transition-all">
                      <span className={`w-3 h-3 rounded-full ${item.color} shadow-sm dark:shadow-[0_0_10px] ${item.shadow}`}></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">{item.label}</span>
                  </div>
                ))}
            </div>

            {/* GRID CONTAINER */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl dark:bg-slate-900/30 dark:border-white/5 p-8 dark:backdrop-blur-sm dark:shadow-2xl relative transition-all duration-300">
                 {/* Decorative Grid Lines - Subtle in light mode */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none rounded-[2.5rem]"></div>

                 <div className="grid grid-cols-7 gap-6 mb-6 text-center relative z-10">
                     {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map((day, i) => (
                         <div key={day} className={`text-sm font-black tracking-[0.2em] py-4 ${i >= 5 ? 'text-rose-500 dark:text-rose-400 dark:drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'text-slate-400 dark:text-slate-500'}`}>
                             {day}
                         </div>
                     ))}
                 </div>
                 
                 <div className="grid grid-cols-7 gap-6 relative z-10">
                     {renderDays()}
                 </div>
            </div>
        </div>

        {/* ADD MODAL - GLASSMORPHISM / WHITE */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm dark:bg-slate-950/80 dark:backdrop-blur-xl transition-opacity"></div>
                <div className="bg-white border border-slate-100 shadow-2xl dark:bg-slate-900 dark:border-white/10 rounded-3xl w-full max-w-md p-8 relative z-10 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-[fadeIn_0.3s_ease-out] transition-all">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> NOUVEAU PATIENT
                        </h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-950/50 dark:border-white/5 flex items-center gap-4 transition-colors">
                            <CalendarIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Cible</div>
                                <div className="text-lg font-black text-slate-800 dark:text-white">
                                    {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </div>
                            </div>
                        </div>

                        <div ref={suggestionRef} className="relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Identité</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input 
                                    type="text" 
                                    value={newPatientName}
                                    onChange={(e) => handlePatientNameChange(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950/50 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 font-bold text-sm text-slate-800 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:focus:shadow-[0_0_15px_rgba(6,182,212,0.1)] outline-none uppercase transition-all" 
                                    placeholder="NOM DU PATIENT..."
                                    autoFocus
                                    autoComplete="off"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-20 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl mt-2 max-h-48 overflow-y-auto p-2 shadow-xl dark:shadow-2xl">
                                        {suggestions.map((p, idx) => (
                                            <div key={idx} onClick={() => selectSuggestion(p)} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg cursor-pointer text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                                                {p.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Contact</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 dark:text-slate-500" />
                                <input 
                                    type="tel" 
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950/50 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 font-mono text-sm text-slate-800 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all" 
                                    placeholder="06 XX XX XX XX"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveAppointment}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-4 rounded-xl font-black uppercase text-sm shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Confirmer Réservation
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* DETAIL MODAL - GLASSMORPHISM / WHITE */}
        {isDetailModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm dark:bg-slate-950/80 dark:backdrop-blur-xl transition-opacity"></div>
                <div className="bg-white border border-slate-100 shadow-2xl dark:bg-slate-900 dark:border-white/10 rounded-[2rem] w-full max-w-lg relative z-10 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] animate-[fadeIn_0.3s_ease-out] transition-all">
                    
                    {/* Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                         <div>
                             <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                 {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                             </h3>
                             <div className="flex items-center gap-2 mt-2">
                                <div className={`h-2 w-2 rounded-full ${selectedDayAppointments.length >= MAX_CAPACITY ? 'bg-rose-500 shadow-sm dark:shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-cyan-500 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`}></div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {selectedDayAppointments.length} / {MAX_CAPACITY} SLOT(S)
                                </span>
                             </div>
                         </div>
                         <button onClick={() => setIsDetailModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 rounded-full dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:text-white transition-colors">
                             <X className="w-5 h-5" />
                         </button>
                    </div>

                    {/* List */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-3">
                        {selectedDayAppointments.map(appt => (
                            <div key={appt.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 dark:bg-slate-950/50 dark:border-white/5 rounded-2xl hover:border-cyan-500/30 transition-all group cursor-pointer">
                                <div onClick={() => goToPatientProfile(appt.patientName)} className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                        {appt.patientName}
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-500" />
                                    </div>
                                    <div className="text-xs font-mono text-slate-500 flex items-center gap-2 mt-1">
                                        <Phone className="w-3 h-3" />
                                        {appt.molecule || '---'}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => deleteAppointment(appt.id)}
                                    className="p-3 text-slate-400 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 backdrop-blur-md rounded-b-[2rem]">
                        {!ALGERIA_HOLIDAYS[`${new Date(selectedDate).getMonth()+1}-${new Date(selectedDate).getDate()}`] && (new Date(selectedDate).getDay() !== 5 && new Date(selectedDate).getDay() !== 6) && selectedDayAppointments.length < MAX_CAPACITY && (
                            <button 
                                onClick={() => openAddModal()}
                                className="w-full py-4 bg-slate-800 hover:bg-cyan-600 border border-slate-700 dark:border-white/10 hover:border-cyan-500 hover:text-white hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] text-white dark:text-slate-300 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <Plus className="w-5 h-5" /> Ajouter Patient
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};