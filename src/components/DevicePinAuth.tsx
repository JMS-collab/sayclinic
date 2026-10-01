'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Monitor, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft, 
  Edit3, 
  Check, 
  Eye, 
  EyeOff,
  Cpu
} from 'lucide-react';
import { UserAccount } from './LoginForm';
import { DevicePinService } from '../services/devicePinService';
import { AuditLogService } from '../services/auditLogService';

interface DevicePinAuthProps {
  user: UserAccount;
  rememberMe: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DevicePinAuth: React.FC<DevicePinAuthProps> = ({
  user,
  rememberMe,
  onSuccess,
  onCancel,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockCountdown, setLockCountdown] = useState<number>(0);

  // Informácie o konkrétnom zariadení (machineId)
  const [machineId, setMachineId] = useState<string>('');
  const [machineName, setMachineName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [customNameInput, setCustomNameInput] = useState<string>('');
  
  // Režim: bežné overenie vs. prvé nastavenie PINu
  const [isFirstSetup, setIsFirstSetup] = useState<boolean>(false);
  const [confirmPinDigits, setConfirmPinDigits] = useState<string[]>(['', '', '', '']);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Inicializácia informácií o machineId a kontrole PINu
  useEffect(() => {
    const id = DevicePinService.getMachineId();
    const name = DevicePinService.getMachineName();
    setMachineId(id);
    setMachineName(name);
    setCustomNameInput(name);

    const hasPin = DevicePinService.hasConfiguredPin(user.id);
    setIsFirstSetup(!hasPin);

    // Automatický focus na prvú bunku PINu
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  }, [user.id]);

  // Časovač pre lockout po neúspešných pokusoch
  useEffect(() => {
    if (lockCountdown <= 0) {
      if (isLocked) {
        setIsLocked(false);
        setFailedAttempts(0);
        setErrorMessage('');
      }
      return;
    }
    const timer = setInterval(() => {
      setLockCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockCountdown, isLocked]);

  // Spracovanie zmeny číslice v bunke
  const handleDigitChange = (index: number, value: string, isConfirm: boolean = false) => {
    if (isLocked) return;

    // Povolené sú iba číslice 0-9
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const targetDigits = isConfirm ? [...confirmPinDigits] : [...pinDigits];
    targetDigits[index] = cleanValue;

    if (isConfirm) {
      setConfirmPinDigits(targetDigits);
    } else {
      setPinDigits(targetDigits);
    }

    setErrorMessage('');

    // Posun na ďalšiu bunku
    if (cleanValue && index < 3) {
      const nextRefs = isConfirm ? confirmInputRefs : inputRefs;
      nextRefs.current[index + 1]?.focus();
    }

    // Ak sú vyplnené všetky 4 číslice:
    if (!isConfirm && targetDigits.every(d => d !== '')) {
      if (!isFirstSetup) {
        // Okamžité overenie
        handleVerifyPin(targetDigits.join(''));
      } else {
        // Pri prvom nastavovaní presunieme kurzor na potvrdenie
        setTimeout(() => {
          confirmInputRefs.current[0]?.focus();
        }, 100);
      }
    } else if (isConfirm && targetDigits.every(d => d !== '')) {
      // Automatické uloženie a overenie pri prvom nastavení
      handleSaveAndVerifyPin(pinDigits.join(''), targetDigits.join(''));
    }
  };

  // Spracovanie klávesu Backspace pre plynulý návrat
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isConfirm: boolean = false) => {
    if (e.key === 'Backspace') {
      const currentDigits = isConfirm ? confirmPinDigits : pinDigits;
      if (!currentDigits[index] && index > 0) {
        const refs = isConfirm ? confirmInputRefs : inputRefs;
        refs.current[index - 1]?.focus();
      }
    }
  };

  // Spracovanie vloženia (Paste) 4 číslic naraz
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const digits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      digits[i] = pasted[i];
    }
    setPinDigits(digits);

    if (pasted.length === 4) {
      if (!isFirstSetup) {
        handleVerifyPin(pasted);
      } else {
        confirmInputRefs.current[0]?.focus();
      }
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  // Kliknutie na virtuálnu numerickú klávesnicu
  const handleKeypadPress = (val: string) => {
    if (isLocked) return;

    if (val === 'CLEAR') {
      if (isFirstSetup && confirmPinDigits.some(d => d !== '')) {
        setConfirmPinDigits(['', '', '', '']);
        confirmInputRefs.current[0]?.focus();
      } else {
        setPinDigits(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
      return;
    }

    if (val === 'BACK') {
      const target = isFirstSetup && confirmPinDigits.some(d => d !== '') 
        ? confirmPinDigits 
        : pinDigits;
      const isConfirm = target === confirmPinDigits;
      
      const lastIndex = target.map((d, i) => d !== '' ? i : -1).filter(i => i !== -1).pop();
      if (lastIndex !== undefined) {
        handleDigitChange(lastIndex, '', isConfirm);
        const refs = isConfirm ? confirmInputRefs : inputRefs;
        refs.current[lastIndex]?.focus();
      }
      return;
    }

    // Číslica
    const currentTarget = isFirstSetup && pinDigits.every(d => d !== '') 
      ? confirmPinDigits 
      : pinDigits;
    const isConfirm = currentTarget === confirmPinDigits;
    const emptyIndex = currentTarget.findIndex(d => d === '');

    if (emptyIndex !== -1) {
      handleDigitChange(emptyIndex, val, isConfirm);
    }
  };

  // Overenie 4-miestneho PINu viazaného na toto zariadenie
  const handleVerifyPin = async (pinToVerify: string) => {
    if (isLocked || isVerifying) return;
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const res = await DevicePinService.verifyDevicePin(user.id, pinToVerify);

      if (res.valid) {
        setSuccessMessage('PIN overený. Zariadenie autorizované.');

        // Zápis úspešného 2FA overenia zariadenia do klinického AuditLogu
        AuditLogService.log({
          user,
          category: 'AUTH',
          action: 'DEVICE_PIN_AUTORIZOVANÉ',
          details: `${user.name} úspešne overil 4-miestny PIN viazaný na pracovnú stanicu (${machineName} • ID: ${machineId}).`,
          severity: 'info',
        });

        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        // Zápis neúspešného pokusu do audit logu
        AuditLogService.log({
          user,
          category: 'AUTH',
          action: 'DEVICE_PIN_ZLYHALO',
          details: `Neúspešné zadanie 4-miestneho PINu pre ${user.name} na stanici ${machineName} (pokus ${newAttempts}/5).`,
          severity: 'warning',
        });

        if (newAttempts >= 5) {
          setIsLocked(true);
          setLockCountdown(300); // 5 minút
          setErrorMessage('Zariadenie je zablokované na 5 minút z dôvodu 5 nesprávnych pokusov o zadanie PINu.');
        } else {
          setErrorMessage(`Nesprávny PIN kód. Zostáva pokusov: ${5 - newAttempts}.`);
          setPinDigits(['', '', '', '']);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Chyba overenia PINu.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Uloženie a prvé overenie nového PINu
  const handleSaveAndVerifyPin = async (firstPin: string, secondPin: string) => {
    if (firstPin !== secondPin) {
      setErrorMessage('Zadané PIN kódy sa nezhodujú. Zadajte ich prosím znova.');
      setConfirmPinDigits(['', '', '', '']);
      confirmInputRefs.current[0]?.focus();
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const saved = await DevicePinService.saveDevicePin(user.id, firstPin);
      if (saved) {
        setSuccessMessage('Váš osobný PIN bol úspešne uložený pre toto zariadenie.');

        AuditLogService.log({
          user,
          category: 'AUTH',
          action: 'DEVICE_PIN_NASTAVENÉ',
          details: `${user.name} aktivoval nový 4-miestny osobný PIN viazaný na stanicu ${machineName} (${machineId}).`,
          severity: 'info',
        });

        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setErrorMessage('Nepodarilo sa uložiť PIN do pamäte zariadenia.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Chyba pri ukladaní PINu.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Uloženie upraveného názvu pracoviska
  const handleSaveMachineName = () => {
    if (customNameInput.trim()) {
      DevicePinService.setMachineName(customNameInput.trim());
      setMachineName(customNameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="max-w-md mx-auto w-full backdrop-blur-3xl bg-white/75 border border-white/90 p-7 sm:p-9 rounded-[36px] shadow-[0_30px_70px_-15px_rgba(44,42,41,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.95)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* HLAVIČKA A AVATAR POUŽÍVATEĽA */}
      <div className="flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 backdrop-blur-xl bg-gradient-to-b from-white/90 via-white/50 to-white/20 border-2 border-[#C5A059]/70 shadow-[0_12px_28px_-6px_rgba(197,160,89,0.25)] flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#2C2A29] to-[#C5A059] flex items-center justify-center text-white font-bold text-xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#2C2A29] text-[#C5A059] border-2 border-white shadow-xs">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-semibold text-[#2C2A29]">{user.name}</h2>
        <p className="text-xs text-[#8C857B] font-medium">{user.title}</p>
      </div>

      {/* ODZNAK MACHINE ID A AUTORIZOVANEJ STANICE */}
      <div className="bg-[#FAF8F5]/90 border border-[#E8E2D9] rounded-2xl p-3 text-left shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2C2A29]">
            <Monitor className="w-3.5 h-3.5 text-[#C5A059]" />
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  className="text-[11px] px-2 py-0.5 border rounded-lg bg-white outline-none focus:border-[#C5A059]"
                  placeholder="Názov pracoviska"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveMachineName}
                  className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  title="Uložiť názov"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="truncate max-w-[210px]">{machineName}</span>
            )}
          </div>

          {!isEditingName && (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-[#8C857B] hover:text-[#2C2A29] p-1 transition-colors cursor-pointer"
              title="Pomenovať pracovisko"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#8C857B] border-t border-[#E8E2D9]/60 pt-1.5 font-mono">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#C5A059]" />
            <span>ID stanice:</span>
          </span>
          <span className="text-[#2C2A29] font-semibold bg-white/80 px-2 py-0.5 rounded-md border border-[#E8E2D9]">
            {machineId || 'Generujem...'}
          </span>
        </div>
      </div>

      {/* HLAVNÝ FORMULÁR PINU */}
      <div className="space-y-4 text-center">
        <div>
          {DevicePinService.isEligibleForSameDayPinOnly(user.id) && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF4E8] text-[#8C6D2B] border border-[#E8DCBE] text-[10px] font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dnes overené heslom • Rýchly denný PIN vstup</span>
            </div>
          )}
          <h3 className="text-sm font-semibold text-[#2C2A29]">
            {isFirstSetup 
              ? 'Nastavte si 4-miestny PIN stanice' 
              : DevicePinService.isEligibleForSameDayPinOnly(user.id)
                ? 'Rýchly denný PIN vstup'
                : 'Zadajte váš osobný 4-miestny PIN'}
          </h3>
          <p className="text-[11px] text-[#8C857B] mt-0.5">
            {isFirstSetup 
              ? 'Tento PIN bude bezpečne viazaný na toto konkrétne zariadenie pre rýchle 2FA overenie.' 
              : DevicePinService.isEligibleForSameDayPinOnly(user.id)
                ? 'Dnes ste sa už na tejto stanici overili heslom. Pre odomknutie stačí zadať váš 4-miestny PIN.'
                : 'Druhý faktor overenia viazaný na toto zariadenie podľa zdravotníckeho štandardu.'}
          </p>
        </div>

        {/* BRUTE FORCE LOCKOUT BANNER */}
        {isLocked && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex flex-col gap-1 text-left animate-pulse">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Zariadenie je dočasne zablokované</span>
            </div>
            <p className="text-[11px] text-rose-700">
              Odomknutie za: <strong className="font-mono text-sm">{Math.floor(lockCountdown / 60)}:{(lockCountdown % 60).toString().padStart(2, '0')}</strong>
            </p>
          </div>
        )}

        {/* BUNKY PRE ZADANIE PINU */}
        <div className="space-y-3">
          <div className="flex justify-center items-center gap-3">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                disabled={isLocked || isVerifying}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] outline-none ${
                  digit 
                    ? 'border-[#C5A059] bg-white text-[#2C2A29] shadow-[0_0_15px_rgba(197,160,89,0.15)] ring-2 ring-[#C5A059]/20' 
                    : 'border-[#E8E2D9] bg-white/70 focus:border-[#C5A059] focus:bg-white'
                } ${isLocked ? 'opacity-50 cursor-not-allowed bg-rose-50 border-rose-200' : ''}`}
              />
            ))}

            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="p-2 text-[#8C857B] hover:text-[#2C2A29] transition-colors cursor-pointer"
              title={showPin ? 'Skryť číslice' : 'Zobraziť číslice'}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* AK IDE O PRVÉ NASTAVENIE: POTVRDZUJÚCE BUNKY */}
          {isFirstSetup && (
            <div className="pt-2 animate-in fade-in duration-200">
              <label className="block text-[11px] font-medium text-[#5C554F] mb-1.5">
                Potvrďte zadaný PIN znova:
              </label>
              <div className="flex justify-center items-center gap-3">
                {confirmPinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { confirmInputRefs.current[idx] = el; }}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    disabled={isLocked || isVerifying}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(idx, e, true)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl border transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] outline-none ${
                      digit 
                        ? 'border-[#C5A059] bg-white text-[#2C2A29] shadow-[0_0_15px_rgba(197,160,89,0.15)] ring-2 ring-[#C5A059]/20' 
                        : 'border-[#E8E2D9] bg-white/70 focus:border-[#C5A059] focus:bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CHYBOVÉ A INFORMAČNÉ HLÁSENIA */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200/80 text-rose-700 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* DOTYKOVÁ NUMERICKÁ KLÁVESNICA NA OBRAZOVKE (PRE TABLETY / AMBULANTNÉ DOTYKOVÉ DISPLEJE) */}
        <div className="pt-2">
          <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                disabled={isLocked || isVerifying}
                onClick={() => handleKeypadPress(num)}
                className="h-11 rounded-xl bg-white/80 hover:bg-white active:bg-[#FAF4E8] border border-[#E8E2D9] text-base font-semibold text-[#2C2A29] shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={isLocked || isVerifying}
              onClick={() => handleKeypadPress('CLEAR')}
              className="h-11 rounded-xl bg-rose-50/60 hover:bg-rose-100/80 active:bg-rose-200 border border-rose-200 text-xs font-semibold text-rose-700 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              Zmazať
            </button>
            <button
              type="button"
              disabled={isLocked || isVerifying}
              onClick={() => handleKeypadPress('0')}
              className="h-11 rounded-xl bg-white/80 hover:bg-white active:bg-[#FAF4E8] border border-[#E8E2D9] text-base font-semibold text-[#2C2A29] shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              disabled={isLocked || isVerifying}
              onClick={() => handleKeypadPress('BACK')}
              className="h-11 rounded-xl bg-white/80 hover:bg-white active:bg-[#FAF4E8] border border-[#E8E2D9] text-sm font-semibold text-[#2C2A29] shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
              title="Krok späť"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* TLAČIDLÁ AKCIE */}
        <div className="pt-3 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1 py-3 px-3 rounded-2xl bg-white/70 hover:bg-white border border-white/90 text-[#8C857B] hover:text-[#2C2A29] text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Späť</span>
          </button>

          {isFirstSetup && (
            <button
              type="button"
              disabled={isVerifying || pinDigits.some(d => d === '') || confirmPinDigits.some(d => d === '')}
              onClick={() => handleSaveAndVerifyPin(pinDigits.join(''), confirmPinDigits.join(''))}
              className="flex-1 bg-gradient-to-r from-[#2C2A29] to-[#C5A059] hover:from-[#C5A059] hover:to-[#9C7D3D] disabled:opacity-40 text-white py-3 px-3 rounded-2xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ukladám...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Uložiť PIN</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* BEZPEČNOSTNÝ ŠTÍTOK */}
        <div className="pt-2 text-center text-[10px] text-[#8C857B] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zdravotnícky štandard SAY CLINIC: PIN + autorizovaný hardvér</span>
        </div>
      </div>
    </div>
  );
};
