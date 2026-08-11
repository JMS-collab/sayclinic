// Typ pre Pacienta v aplikácii
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthNumber: string; // Rodné číslo
  insuranceCompany: string; // Dôvera, VšZP, Union
  createdAt: Date;
}

// Typ pre dáta, ktoré posielaš do HealthPro (eZdravie)
export interface HealthProPayload {
  patientBirthNumber: string;
  diagnosisCode: string; // napr. "A00.0"
  notes: string;
  doctorLicenseCode: string;
}
