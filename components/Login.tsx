import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let msg = 'Échec de la connexion. Vérifiez vos identifiants.';
      if (err.code === 'auth/invalid-credential') msg = 'Email ou mot de passe incorrect.';
      if (err.code === 'auth/too-many-requests') msg = 'Trop de tentatives. Réessayez plus tard.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-sky-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-sky-600/30">
                 <span className="font-bold text-2xl">GP</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">GalePedia <span className="text-sky-600">Pro</span></h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Accès Sécurisé Pharmaciens</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-3 rounded-xl mb-6 flex items-center gap-2 text-sm font-bold animate-pulse">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
                <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    placeholder="pharmacie@galepedia.com"
                />
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mot de passe</label>
            <div className="relative">
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all"
                    placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Se connecter'}
          </button>
        </form>
        
        <p className="text-center text-xs text-slate-400 mt-6">
           Problème d'accès ? Contactez l'administrateur réseau.
        </p>
      </div>
    </div>
  );
};