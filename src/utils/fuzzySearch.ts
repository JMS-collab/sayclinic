/**
 * Utility pre pokročilé inteligentné vyhľadávanie v SAY CLINIC
 * - Odstraňovanie slovenskej a českej diakritiky (á->a, š->s, č->c, ž->z, ô->o, atď.)
 * - Tolerancia preklepov (Damerau-Levenshtein vzdialenosť: prehodené písmená, chýbajúce písmeno, preklep)
 * - Normalizácia rodných čísel (s lomítkom aj bez) a telefónnych čísel
 * - Rebríčkové skórovanie zhôd (presné zhody navrchu, potom bez diakritiky, potom preklepy)
 */

export function removeDiacritics(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/ß/g, 'ss');
}

export function normalizeSearchString(text: string): string {
  if (!text) return '';
  return removeDiacritics(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeDigits(text: string): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

/**
 * Damerau-Levenshtein vzdialenosť
 * Podporuje:
 * 1. Vloženie (insertion)
 * 2. Vymazanie (deletion)
 * 3. Zámenu (substitution)
 * 4. Transpozíciu (prehodenie susedných znakov: napr. "márz" -> "mraz", "jran" -> "jan")
 */
export function damerauLevenshteinDistance(source: string, target: string): number {
  const m = source.length;
  const n = target.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Ak je rozdiel dĺžok príliš veľký, preskočíme drahý výpočet
  if (Math.abs(m - n) > 3) return Math.abs(m - n);

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // vymazanie
        d[i][j - 1] + 1, // vloženie
        d[i - 1][j - 1] + cost // zámena
      );

      // Transpozícia susedných písmen
      if (
        i > 1 &&
        j > 1 &&
        source[i - 1] === target[j - 2] &&
        source[i - 2] === target[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[m][n];
}

export interface TokenMatchResult {
  match: boolean;
  score: number;
  isFuzzy: boolean;
}

/**
 * Porovnanie jedného tokenu hľadaného výrazu s jedným tokenom v cieli (napr. meno, priezvisko)
 */
export function matchToken(queryToken: string, targetToken: string): TokenMatchResult {
  if (!queryToken || !targetToken) {
    return { match: false, score: 0, isFuzzy: false };
  }

  // 1. Presná zhoda
  if (queryToken === targetToken) {
    return { match: true, score: 100, isFuzzy: false };
  }

  // 2. Prefixová zhoda (napr. "kov" matches "kovacova")
  if (targetToken.startsWith(queryToken)) {
    const ratio = queryToken.length / targetToken.length;
    return { match: true, score: 85 + Math.round(ratio * 10), isFuzzy: false };
  }

  // 3. Substring zhoda (napr. "vac" v "kovacova")
  if (targetToken.includes(queryToken) && queryToken.length >= 3) {
    return { match: true, score: 75, isFuzzy: false };
  }

  // 4. Preklepová (Fuzzy) zhoda:
  // Pre príliš krátke tokeny (1-2 znaky) nepovoľujeme preklepy, aby nevznikali falošné zhody
  if (queryToken.length < 3) {
    return { match: false, score: 0, isFuzzy: false };
  }

  // Maximálny povolený počet chýb v závislosti od dĺžky slova
  const maxAllowedDist = queryToken.length <= 4 ? 1 : queryToken.length <= 7 ? 1 : 2;

  // Priame porovnanie celých slov
  const dist = damerauLevenshteinDistance(queryToken, targetToken);
  if (dist <= maxAllowedDist) {
    const score = dist === 1 ? 68 : 52;
    return { match: true, score, isFuzzy: true };
  }

  // Ak je cieľové slovo dlhšie (napr. hľadáme "kovac" alebo "kovas" a v cieli je "kovacova"),
  // skúsime otestovať prefix cieľového slova s rovnakou dĺžkou ± 1
  if (targetToken.length > queryToken.length) {
    const targetPrefix = targetToken.slice(0, queryToken.length);
    const prefixDist = damerauLevenshteinDistance(queryToken, targetPrefix);
    if (prefixDist <= 1) {
      return { match: true, score: 65, isFuzzy: true };
    }

    const targetPrefixPlusOne = targetToken.slice(0, queryToken.length + 1);
    const prefixDist2 = damerauLevenshteinDistance(queryToken, targetPrefixPlusOne);
    if (prefixDist2 <= 1) {
      return { match: true, score: 62, isFuzzy: true };
    }
  }

  return { match: false, score: 0, isFuzzy: false };
}

export interface StringMatchResult {
  match: boolean;
  score: number;
  isFuzzy: boolean;
}

/**
 * Porovnáva ľubovoľný reťazec voči hľadanému výrazu
 * Ignoruje diakritiku, malé/veľké písmená a povoľuje malé preklepy
 */
export function matchesQuery(targetText: string, query: string): StringMatchResult {
  const normTarget = normalizeSearchString(targetText);
  const normQuery = normalizeSearchString(query);

  if (!normQuery) {
    return { match: true, score: 100, isFuzzy: false };
  }
  if (!normTarget) {
    return { match: false, score: 0, isFuzzy: false };
  }

  // 1. Priama zhoda bez diakritiky
  if (normTarget === normQuery) {
    return { match: true, score: 100, isFuzzy: false };
  }
  if (normTarget.startsWith(normQuery)) {
    return { match: true, score: 95, isFuzzy: false };
  }
  if (normTarget.includes(normQuery)) {
    return { match: true, score: 85, isFuzzy: false };
  }

  // 2. Tokenizované porovnanie (viacslovné dotazy napr. "jan mraz", "mraz jan")
  const queryTokens = normQuery.split(' ').filter(t => t.length > 0);
  const targetTokens = normTarget.split(/[\s,./-]+/).filter(t => t.length > 0);

  if (queryTokens.length === 0) {
    return { match: true, score: 100, isFuzzy: false };
  }

  let totalScore = 0;
  let hasFuzzy = false;
  let allTokensMatched = true;

  for (const qToken of queryTokens) {
    let bestTokenMatch: TokenMatchResult = { match: false, score: 0, isFuzzy: false };

    for (const tToken of targetTokens) {
      const res = matchToken(qToken, tToken);
      if (res.match && res.score > bestTokenMatch.score) {
        bestTokenMatch = res;
      }
    }

    if (!bestTokenMatch.match) {
      allTokensMatched = false;
      break;
    }

    totalScore += bestTokenMatch.score;
    if (bestTokenMatch.isFuzzy) {
      hasFuzzy = true;
    }
  }

  if (allTokensMatched) {
    const avgScore = Math.round(totalScore / queryTokens.length);
    return { match: true, score: avgScore, isFuzzy: hasFuzzy };
  }

  // 3. Ak viacslovný dotaz zlyhal, overíme ešte celkový edit distance pri 1 slove
  if (queryTokens.length === 1 && normQuery.length >= 3) {
    const dist = damerauLevenshteinDistance(normQuery, normTarget);
    if (dist <= (normQuery.length >= 6 ? 2 : 1)) {
      return { match: true, score: dist === 1 ? 60 : 45, isFuzzy: true };
    }
  }

  return { match: false, score: 0, isFuzzy: false };
}

export interface PatientMatchResult {
  match: boolean;
  score: number;
  isFuzzy: boolean;
  matchField: 'name' | 'birthNumber' | 'phone' | 'email' | 'other' | 'none';
  matchedValue?: string;
}

export interface SearchablePatientLike {
  name: string;
  birthNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  insurance?: string;
  dob?: string;
}

/**
 * Špecializovaný filter pre pacienta / klienta
 * Kontroluje:
 * - Meno (bez diakritiky, ľubovoľné poradie slov, preklepy)
 * - Rodné číslo (s lomítkom aj čisté čísla, čiastkové čísla)
 * - Telefónne číslo (+421, nuly, medzery, pomlčky)
 * - E-mail
 * - Adresu / Poisťovňu
 */
export function matchesPatient(patient: SearchablePatientLike, query: string): PatientMatchResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return { match: true, score: 100, isFuzzy: false, matchField: 'none' };
  }

  const digitsQuery = normalizeDigits(trimmed);
  const normQuery = normalizeSearchString(trimmed);

  // 1. KONTROLA RODNÉHO ČÍSLA (ak dotaz obsahuje čísla)
  if (digitsQuery.length >= 2 && patient.birthNumber) {
    const rawRc = patient.birthNumber;
    const cleanRc = normalizeDigits(rawRc);
    
    // Presné rodné číslo alebo podreťazec
    if (cleanRc === digitsQuery) {
      return { match: true, score: 98, isFuzzy: false, matchField: 'birthNumber', matchedValue: rawRc };
    }
    if (cleanRc.startsWith(digitsQuery)) {
      return { match: true, score: 90, isFuzzy: false, matchField: 'birthNumber', matchedValue: rawRc };
    }
    if (cleanRc.includes(digitsQuery)) {
      return { match: true, score: 85, isFuzzy: false, matchField: 'birthNumber', matchedValue: rawRc };
    }
    if (rawRc.toLowerCase().includes(normQuery)) {
      return { match: true, score: 88, isFuzzy: false, matchField: 'birthNumber', matchedValue: rawRc };
    }
  }

  // 2. KONTROLA TELEFÓNU (ak dotaz obsahuje aspoň 3 číslice)
  if (digitsQuery.length >= 3 && patient.phone) {
    const rawPhone = patient.phone;
    const cleanPhone = normalizeDigits(rawPhone);
    const localCleanPhone = cleanPhone.startsWith('421') ? '0' + cleanPhone.slice(3) : cleanPhone;
    const localDigitsQuery = digitsQuery.startsWith('421') ? '0' + digitsQuery.slice(3) : digitsQuery;
    const barePhone = cleanPhone.replace(/^(421|0)/, '');
    const bareQuery = digitsQuery.replace(/^(421|0)/, '');
    
    if (
      cleanPhone.includes(digitsQuery) ||
      localCleanPhone.includes(localDigitsQuery) ||
      (bareQuery.length >= 3 && barePhone.includes(bareQuery))
    ) {
      return { match: true, score: 86, isFuzzy: false, matchField: 'phone', matchedValue: rawPhone };
    }
    if (rawPhone.toLowerCase().includes(normQuery)) {
      return { match: true, score: 84, isFuzzy: false, matchField: 'phone', matchedValue: rawPhone };
    }
  }

  // 3. KONTROLA MENA (s diakritikou, bez diakritiky a s toleranciou preklepov)
  const nameResult = matchesQuery(patient.name || '', trimmed);
  if (nameResult.match) {
    return {
      match: true,
      score: nameResult.score,
      isFuzzy: nameResult.isFuzzy,
      matchField: 'name',
      matchedValue: patient.name,
    };
  }

  // 4. KONTROLA E-MAILU
  if (patient.email) {
    const emailRes = matchesQuery(patient.email, trimmed);
    if (emailRes.match) {
      return {
        match: true,
        score: Math.min(emailRes.score, 75),
        isFuzzy: emailRes.isFuzzy,
        matchField: 'email',
        matchedValue: patient.email,
      };
    }
  }

  // 5. KONTROLA POISŤOVNE / ADRESY
  if (patient.insurance && normQuery.length >= 2) {
    const insRes = matchesQuery(patient.insurance, trimmed);
    if (insRes.match) {
      return {
        match: true,
        score: 65,
        isFuzzy: insRes.isFuzzy,
        matchField: 'other',
        matchedValue: patient.insurance,
      };
    }
  }

  if (patient.address && normQuery.length >= 3) {
    const addrRes = matchesQuery(patient.address, trimmed);
    if (addrRes.match) {
      return {
        match: true,
        score: 60,
        isFuzzy: addrRes.isFuzzy,
        matchField: 'other',
        matchedValue: patient.address,
      };
    }
  }

  return { match: false, score: 0, isFuzzy: false, matchField: 'none' };
}

export type RankedPatient<T> = T & {
  _searchScore: number;
  _isFuzzyMatch: boolean;
  _matchField: 'name' | 'birthNumber' | 'phone' | 'email' | 'other' | 'none';
  _matchedValue?: string;
};

/**
 * Filtruje a zoraďuje zoznam pacientov podľa relevantnosti vyhľadávania
 */
export function filterAndRankPatients<T extends SearchablePatientLike>(
  patients: T[],
  query: string
): RankedPatient<T>[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return patients.map(p => ({
      ...p,
      _searchScore: 100,
      _isFuzzyMatch: false,
      _matchField: 'none' as const,
    }));
  }

  const results: RankedPatient<T>[] = [];

  for (const patient of patients) {
    const matchRes = matchesPatient(patient, trimmed);
    if (matchRes.match) {
      results.push({
        ...patient,
        _searchScore: matchRes.score,
        _isFuzzyMatch: matchRes.isFuzzy,
        _matchField: matchRes.matchField,
        _matchedValue: matchRes.matchedValue,
      });
    }
  }

  // Zoradenie podľa skóre zostupne
  results.sort((a, b) => b._searchScore - a._searchScore);

  return results;
}
