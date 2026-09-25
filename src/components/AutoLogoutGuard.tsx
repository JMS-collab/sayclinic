'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, LogOut, Clock, Activity } from 'lucide-react';
import { UserAccount } from './LoginForm';
import { AuditLogService } from '../services/auditLogService';

interface AutoLogoutGuardProps {
  currentUser: UserAccount | null;
  onLogout: (reason?: string) => void;
  inactivityLimitMinutes?: number; // default: 60
  warningCountdownSeconds?: number; // default: 120 (2 minúty)
}

export default function AutoLogoutGuard({
  currentUser,
  onLogout,
  inactivityLimitMinutes = 60,
  warningCountdownSeconds = 120,
}: AutoLogoutGuardProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningCountdownSeconds);
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(warningCountdownSeconds);
      if (currentUser) {
        AuditLogService.log({
          user: currentUser,
          category: 'AUTH',
          action: 'PREDĹŽENIE RELÁCIE',
          details: `Používateľ potvrdil prítomnosť, relácia bola predĺžená o ${inactivityLimitMinutes} minút.`,
          severity: 'info'
        });
      }
    }
  }, [showWarning, warningCountdownSeconds, currentUser, inactivityLimitMinutes]);

  // Sledovanie interakcií používateľa
  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => {
      // Ak sa práve nezobrazuje dialóg varovania, posúvame čas poslednej aktivity
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => window.addEventListener(ev, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleUserActivity));
    };
  }, [currentUser, showWarning]);

  // Hlavný interval na kontrolu nečinnosti každých 5 sekúnd
  useEffect(() => {
    if (!currentUser) {
      setShowWarning(false);
      return;
    }

    const checkInterval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastActivityRef.current;
      const totalLimitMs = inactivityLimitMinutes * 60 * 1000;
      const warningThresholdMs = totalLimitMs - warningCountdownSeconds * 1000;

      if (elapsedMs >= totalLimitMs) {
        // Vypršal plný čas nečinnosti -> odhlásenie
        clearInterval(checkInterval);
        setShowWarning(false);
        if (currentUser) {
          AuditLogService.log({
            user: currentUser,
            category: 'AUTH',
            action: 'AUTOMATICKÉ ODHLÁSENIE',
            details: `Automatické odhlásenie používateľa po ${inactivityLimitMinutes} minútach nečinnosti (GDPR ochrana).`,
            severity: 'warning'
          });
        }
        onLogout(`Boli ste automaticky odhlásený po ${inactivityLimitMinutes} minútach nečinnosti z dôvodu ochrany zdravotných údajov.`);
      } else if (elapsedMs >= warningThresholdMs && !showWarning) {
        // Sme v zóne varovania (posledných 120 sekúnd)
        setShowWarning(true);
        const rem = Math.max(1, Math.ceil((totalLimitMs - elapsedMs) / 1000));
        setSecondsRemaining(rem);
      }
    }, 4000);

    return () => clearInterval(checkInterval);
  }, [currentUser, inactivityLimitMinutes, warningCountdownSeconds, showWarning, onLogout]);

  // Odpočítavanie po sekundách, keď je varovné okno zobrazené
  useEffect(() => {
    if (!showWarning) return;

    warningTimerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(warningTimerRef.current!);
          setShowWarning(false);
          if (currentUser) {
            AuditLogService.log({
              user: currentUser,
              category: 'AUTH',
              action: 'AUTOMATICKÉ ODHLÁSENIE',
              details: `Automatické odhlásenie používateľa po ${inactivityLimitMinutes} minútach nečinnosti.`,
              severity: 'warning'
            });
          }
          onLogout(`Boli ste automaticky odhlásený po ${inactivityLimitMinutes} minútach nečinnosti.`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [showWarning, currentUser, inactivityLimitMinutes, onLogout]);

  if (!showWarning || !currentUser) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-amber-200 text-center space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* IKONA UPOZORNENIA */}
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mx-auto text-amber-600 shadow-inner">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>GDPR Bezpečnostná poistka</span>
          </div>
          <h3 className="text-lg font-bold text-[#2C2A29]">
            Upozornenie na nečinnosť
          </h3>
          <p className="text-xs text-[#5C554F] mt-2 leading-relaxed">
            Neboli ste aktívny viac ako <strong>{inactivityLimitMinutes - Math.ceil(warningCountdownSeconds / 60)} minút</strong>.
            Z dôvodu ochrany citlivých zdravotných údajov pacientov SAY CLINIC bude vaša relácia automaticky ukončená o:
          </p>
        </div>

        {/* ODPOČÍTAVANIE */}
        <div className="py-3 px-6 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] inline-block mx-auto">
          <div className="font-mono text-3xl font-extrabold text-amber-700 tracking-wider">
            {formattedCountdown}
          </div>
          <p className="text-[10px] text-[#8C857B] uppercase tracking-wider font-semibold mt-0.5">
            do automatického odhlásenia
          </p>
        </div>

        {/* TLAČIDLÁ */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={resetActivity}
            className="flex-1 bg-[#2C2A29] hover:bg-[#C5A059] text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-[#C5A059]" />
            <span>Zostať prihlásený</span>
          </button>

          <button
            type="button"
            onClick={() => onLogout('Používateľ zvolil odhlásenie pri upozornení na nečinnosť')}
            className="px-4 py-3 rounded-xl border border-[#E8E2D9] text-[#8C857B] hover:text-[#2C2A29] hover:bg-[#FAF8F5] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Odhlásiť teraz</span>
          </button>
        </div>

      </div>
    </div>
  );
}
