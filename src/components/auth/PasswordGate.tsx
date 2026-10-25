/**
 * @file PasswordGate.tsx
 * @description Barrera de acceso con contraseña protegida para GitHub Pages con persistencia local.
 */

import React, { useState, useEffect } from 'react';
import { Lock, Cpu, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

interface PasswordGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'arduino_sim_auth_token';
const DEFAULT_ACCESS_KEY = 'arduino2026';

export const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si ya fue autenticado previamente en este dispositivo
    const savedToken = localStorage.getItem(STORAGE_KEY);
    if (savedToken === 'granted') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === DEFAULT_ACCESS_KEY) {
      if (remember) {
        localStorage.setItem(STORAGE_KEY, 'granted');
      }
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-screen bg-slate-950" />;
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur relative overflow-hidden">
        {/* Adorno lumínico de fondo */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icono y Título */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-arduino-teal flex items-center justify-center shadow-lg shadow-teal-500/25 mb-3">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Arduino Sim <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full font-mono uppercase font-semibold">PWA</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulador de Circuitos & Código Offline
          </p>
        </div>

        {/* Formulario de Contraseña */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá la contraseña..."
                autoFocus
                className={`w-full bg-slate-950 border rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                  error
                    ? 'border-red-500 focus:ring-red-500/30'
                    : 'border-slate-800 focus:border-arduino-teal focus:ring-teal-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-red-400 mt-1.5 animate-shake">
                Contraseña incorrecta. Intentalo nuevamente.
              </p>
            )}
          </div>

          {/* Recordar en este dispositivo */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-arduino-teal focus:ring-0 accent-teal-500"
              />
              <span>Recordar en este celular / netbook</span>
            </label>
          </div>

          {/* Botón de Ingreso */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-arduino-teal hover:bg-arduino-darkTeal active:scale-98 text-white font-semibold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2"
          >
            <span>Acceder al Simulador</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Nota al pie */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Acceso docente y estudiantil protegido</span>
        </div>
      </div>
    </div>
  );
};
