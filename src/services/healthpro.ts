import { HealthProPayload } from '../types';


const API_URL = process.env.HEALTHPRO_API_URL || 'https://sandbox.healthpro.sk/api/v1';
const API_KEY = process.env.HEALTHPRO_API_KEY;

// Ak nie je API kľúč alebo je zapnutý MOCK režim, použije sa simulácia
const IS_MOCK_MODE = process.env.HEALTHPRO_MOCK_MODE === 'true' || !API_KEY;

export interface HealthProResponse {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  message?: string;
  isMock?: boolean;
}

/**
 * Helper na simuláciu sieťového opozdenia (napr. 1 sekunda)
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const HealthProService = {
  /**
   * Odoslanie zdravotného záznamu do NCZI cez HealthPro
   */
  async sendMedicalRecord(payload: HealthProPayload): Promise<HealthProResponse> {
    // === MOCK / SIMULOVANÝ REŽIM ===
    if (IS_MOCK_MODE) {
      console.log('🧪 [HealthPro Service - MOCK MODE] Odsielam fiktívne dáta:', payload);
      
      // Simulujeme spracovanie na serveri (1 sekunda)
      await delay(1000);

      // Základná validácia vstupu v simulácii
      if (!payload.patientBirthNumber) {
        return {
          success: false,
          errorCode: 'INVALID_BIRTH_NUMBER',
          message: '[MOCK] Rodné číslo pacienta je povinné.',
          isMock: true,
        };
      }

      const generatedId = `MOCK-TX-${Math.floor(100000 + Math.random() * 900000)}`;
      
      return {
        success: true,
        transactionId: generatedId,
        message: `[MOCK] Záznam bol úspešne odoslaný do NCZI (Transakcia: ${generatedId})`,
        isMock: true,
      };
    }

    // === REÁLNY REŽIM (keď doplníš produkčný API kľúč) ===
    try {
      const response = await fetch(`${API_URL}/records/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          errorCode: data.errorCode || 'API_ERROR',
          message: data.message || 'Nepodarilo sa odoslať záznam do HealthPro.',
        };
      }

      return {
        success: true,
        transactionId: data.transactionId,
        message: 'Záznam bol úspešne odoslaný do NCZI.',
      };
    } catch (error) {
      console.error('HealthPro Service Exception:', error);
      return {
        success: false,
        errorCode: 'NETWORK_ERROR',
        message: 'Chyba siete pri komunikácii s HealthPro API.',
      };
    }
  },

  /**
   * Overenie stavu spracovania záznamu podľa ID transakcie
   */
  async checkTransactionStatus(transactionId: string): Promise<HealthProResponse> {
    if (IS_MOCK_MODE) {
      await delay(500);
      return {
        success: true,
        transactionId,
        message: `[MOCK] Transakcia ${transactionId} je vo fáze: SPRACOVANÁ (NCZI Potvrdené).`,
        isMock: true,
      };
    }

    try {
      const response = await fetch(`${API_URL}/records/status/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      const data = await response.json();
      return {
        success: response.ok,
        transactionId: data.transactionId,
        message: data.status,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Chyba pri overovaní stavu transakcie.',
      };
    }
  }
};
