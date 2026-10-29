/**
 * Služba pre inteligentnú klasifikáciu, rekurzívne čítanie a fyzické roztriedenie
 * súborov pacienta na Google Disku do príslušných medicínskych zložiek.
 */

export type DriveCategory = 
  | 'fotodokumentacia' 
  | 'predoperacne' 
  | 'dokumentacia' 
  | 'suhlasy' 
  | 'sheet' 
  | 'profile' 
  | 'other';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
  category: DriveCategory;
  targetSubfolderName?: string;
  subCategory?: string; // napr. 'EKG', 'Krvné testy', 'Interné' pri predoperačných; alebo 'Predoperačné', 'Pooperačné' pri fotkách
  parentFolderId?: string;
  isInsideSubfolder?: boolean;
}

export interface CategorizedPatientFiles {
  folderId: string;
  folderLink?: string;
  patientName: string;
  subfolderIds: {
    fotodokumentacia?: string;
    dokumentacia?: string;
    predoperacne?: string;
    suhlasy?: string;
  };
  fotodokumentacia: DriveFileItem[];
  dokumentacia: DriveFileItem[];
  predoperacne: DriveFileItem[];
  suhlasy: DriveFileItem[];
  rootUnsorted: DriveFileItem[]; // Súbory ležiace voľne v koreni, ktoré patria do podzložiek
  sheetFile?: DriveFileItem;
  profileFile?: DriveFileItem;
  totalCount: number;
}

const STANDARD_SUBFOLDERS = [
  'Fotodokumentácia',
  'Dokumentácia',
  'Predoperačné vyšetrenia',
  'Súhlasy a protokoly'
];

export class PatientDriveOrganizerService {
  private static cache = new Map<string, { timestamp: number; data: CategorizedPatientFiles }>();
  private static CACHE_TTL_MS = 60 * 1000; // 60 sekúnd cache

  /**
   * Vymaže cache pre daného pacienta (napr. po presune súborov alebo nahrávaní)
   */
  public static invalidateCache(patientName: string): void {
    this.cache.delete(patientName.toLowerCase().trim());
  }

  /**
   * Inteligentná klasifikácia jedného súboru podľa prípony, MIME typu a názvu
   */
  public static classifyFile(file: { name: string; mimeType: string }): {
    category: DriveCategory;
    targetSubfolderName: string;
    subCategory?: string;
  } {
    const nameLower = file.name.toLowerCase().trim();
    const mime = (file.mimeType || '').toLowerCase();

    // 1. Profil pacienta
    if (nameLower === 'profil_klienta.json') {
      return { category: 'profile', targetSubfolderName: '' };
    }

    // 2. Google Sheet / Excel kartotéka
    if (
      mime.includes('spreadsheet') ||
      nameLower.endsWith('.xlsx') ||
      nameLower.endsWith('.xls') ||
      nameLower.endsWith('.csv') ||
      nameLower.includes('kartoteka') ||
      nameLower.includes('sheet')
    ) {
      return { category: 'sheet', targetSubfolderName: '' };
    }

    // 3. Fotodokumentácia (obrázky)
    if (
      mime.startsWith('image/') ||
      /\.(jpe?g|png|heic|webp|avif|gif|bmp|tiff)$/i.test(nameLower) ||
      nameLower.includes('foto')
    ) {
      let subCat = 'Fotodokumentácia';
      if (/pred|preop|predop/i.test(nameLower)) {
        subCat = 'Predoperačné';
      } else if (/po|postop|poop|1m|6m|1y|vysled|kontrola/i.test(nameLower)) {
        subCat = 'Pooperačné';
      } else if (/konzult|uvod/i.test(nameLower)) {
        subCat = 'Konzultácia';
      }

      return {
        category: 'fotodokumentacia',
        targetSubfolderName: 'Fotodokumentácia',
        subCategory: subCat
      };
    }

    // 4. Predoperačné vyšetrenia (EKG, odbery krvi, laboratóriá, interné vyšetrenia)
    if (
      /predoperac|vysetren|ekg|krv|odber|lab|intern|rtg|anestez|koagul|inr|quick|bioch|trombo|leukoc|hemogl/i.test(nameLower)
    ) {
      let subCat = 'Predoperačné vyšetrenie';
      if (/ekg/i.test(nameLower)) {
        subCat = 'EKG záznam';
      } else if (/krv|odber|lab|bioch|koagul|inr|quick|trombo/i.test(nameLower)) {
        subCat = 'Laboratórne odbery';
      } else if (/intern/i.test(nameLower)) {
        subCat = 'Interné predoperačné';
      } else if (/rtg|pluca|hrud/i.test(nameLower)) {
        subCat = 'RTG hrudníka';
      } else if (/anestez/i.test(nameLower)) {
        subCat = 'Anestéziologické vyšetrenie';
      }

      return {
        category: 'predoperacne',
        targetSubfolderName: 'Predoperačné vyšetrenia',
        subCategory: subCat
      };
    }

    // 5. Súhlasy a protokoly
    if (
      /suhlas|informovany|protokol|gdpr|poucenie|vyhlasenie|zmluva|cennik/i.test(nameLower)
    ) {
      return {
        category: 'suhlasy',
        targetSubfolderName: 'Súhlasy a protokoly',
        subCategory: 'Informovaný súhlas'
      };
    }

    // 6. Lekárska dokumentácia (dekurzy, správy, nálezy)
    if (
      mime.includes('pdf') ||
      mime.includes('document') ||
      /\.(pdf|docx?|odt|txt|rtf)$/i.test(nameLower) ||
      /sprava|dekurz|nalez|epikriz|prepust|ambulant|lekar/i.test(nameLower)
    ) {
      return {
        category: 'dokumentacia',
        targetSubfolderName: 'Dokumentácia',
        subCategory: 'Lekárska správa'
      };
    }

    // V predvolenom stave do dokumentácie
    return {
      category: 'dokumentacia',
      targetSubfolderName: 'Dokumentácia',
      subCategory: 'Dokument'
    };
  }

  /**
   * Zabezpečí existenciu všetkých 4 štandardných podzložiek pre pacienta
   */
  public static async ensureSubfolders(
    accessToken: string,
    parentFolderId: string
  ): Promise<Record<string, string>> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const subfolderMap: Record<string, string> = {};

    try {
      // 1. Zistíme existujúce podzložky
      const q = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        for (const f of (data.files || [])) {
          subfolderMap[f.name.toLowerCase().trim()] = f.id;
        }
      }

      // 2. Vytvoríme chýbajúce
      for (const stdName of STANDARD_SUBFOLDERS) {
        const key = stdName.toLowerCase().trim();
        if (!subfolderMap[key]) {
          const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: stdName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [parentFolderId]
            })
          });

          if (createRes.ok) {
            const created = await createRes.json();
            subfolderMap[key] = created.id;
          }
        }
      }
    } catch (err) {
      console.warn('Chyba pri overovaní podzložiek pacienta:', err);
    }

    return subfolderMap;
  }

  /**
   * Načíta a kompletne zorganizuje súbory pacienta zo všetkých podzložiek aj koreňa
   */
  public static async getCategorizedPatientFiles(
    accessToken: string,
    patientName: string,
    folderId?: string,
    forceRefresh: boolean = false
  ): Promise<CategorizedPatientFiles> {
    const cacheKey = patientName.toLowerCase().trim();
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
        return cached.data;
      }
    }

    const headers = { Authorization: `Bearer ${accessToken}` };

    // 1. Získame ID hlavnej zložky pacienta
    let targetFolderId = folderId;
    let webViewLink = `https://drive.google.com/drive/folders/${folderId}`;

    if (!targetFolderId) {
      // Importujeme dynamicky driveClientService aby nevznikla kruhová závislosť
      const { DriveClientService } = await import('./driveClientService');
      const folderInfo = await DriveClientService.ensurePatientFolder(accessToken, patientName);
      targetFolderId = folderInfo.folderId;
      webViewLink = folderInfo.webViewLink;
    }

    // 2. Overíme a zabezpečíme 4 medicínske podzložky
    const subfolderMap = await this.ensureSubfolders(accessToken, targetFolderId);
    const subIds = {
      fotodokumentacia: subfolderMap['fotodokumentácia'] || subfolderMap['fotodokumentacia'],
      dokumentacia: subfolderMap['dokumentácia'] || subfolderMap['dokumentacia'],
      predoperacne: subfolderMap['predoperačné vyšetrenia'] || subfolderMap['predoperacne vysetrenia'],
      suhlasy: subfolderMap['súhlasy a protokoly'] || subfolderMap['suhlasy a protokoly']
    };

    // 3. Načítame súbory v koreňovom priečinku
    const rootQ = `'${targetFolderId}' in parents and trashed = false`;
    const rootFields = 'files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,modifiedTime)';
    const rootRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(rootQ)}&fields=${encodeURIComponent(rootFields)}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers }
    );
    const rootData = rootRes.ok ? await rootRes.json() : { files: [] };
    const rawRootFiles: any[] = rootData.files || [];

    // 4. Načítame paralelne súbory z jednotlivých 4 podzložiek
    const fetchSubFiles = async (subId?: string): Promise<any[]> => {
      if (!subId) return [];
      try {
        const q = `'${subId}' in parents and trashed = false`;
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(rootFields)}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
          { headers }
        );
        if (res.ok) {
          const d = await res.json();
          return d.files || [];
        }
      } catch (err) {
        console.warn(`Nepodarilo sa načítať súbory z podzložky ${subId}:`, err);
      }
      return [];
    };

    const [rawFoto, rawDoku, rawPred, rawSuhl] = await Promise.all([
      fetchSubFiles(subIds.fotodokumentacia),
      fetchSubFiles(subIds.dokumentacia),
      fetchSubFiles(subIds.predoperacne),
      fetchSubFiles(subIds.suhlasy)
    ]);

    // 5. Spracujeme súbory z podzložiek
    const mapFile = (raw: any, defaultCat: DriveCategory, subfolderId?: string): DriveFileItem => {
      const cls = this.classifyFile(raw);
      return {
        id: raw.id,
        name: raw.name,
        mimeType: raw.mimeType,
        webViewLink: raw.webViewLink,
        iconLink: raw.iconLink,
        thumbnailLink: raw.thumbnailLink,
        size: raw.size,
        modifiedTime: raw.modifiedTime,
        category: defaultCat,
        targetSubfolderName: cls.targetSubfolderName,
        subCategory: cls.subCategory,
        parentFolderId: subfolderId,
        isInsideSubfolder: true
      };
    };

    const fotoList: DriveFileItem[] = rawFoto.map(f => mapFile(f, 'fotodokumentacia', subIds.fotodokumentacia));
    const dokuList: DriveFileItem[] = rawDoku.map(f => mapFile(f, 'dokumentacia', subIds.dokumentacia));
    const predList: DriveFileItem[] = rawPred.map(f => mapFile(f, 'predoperacne', subIds.predoperacne));
    const suhlList: DriveFileItem[] = rawSuhl.map(f => mapFile(f, 'suhlasy', subIds.suhlasy));

    // 6. Roztriedime súbory v koreni (vynecháme podzložky)
    let sheetFile: DriveFileItem | undefined;
    let profileFile: DriveFileItem | undefined;
    const rootUnsorted: DriveFileItem[] = [];

    for (const rf of rawRootFiles) {
      if (rf.mimeType === 'application/vnd.google-apps.folder') {
        continue; // Preskočíme samotné priečinky
      }

      const cls = this.classifyFile(rf);
      const item: DriveFileItem = {
        id: rf.id,
        name: rf.name,
        mimeType: rf.mimeType,
        webViewLink: rf.webViewLink,
        iconLink: rf.iconLink,
        thumbnailLink: rf.thumbnailLink,
        size: rf.size,
        modifiedTime: rf.modifiedTime,
        category: cls.category,
        targetSubfolderName: cls.targetSubfolderName,
        subCategory: cls.subCategory,
        parentFolderId: targetFolderId,
        isInsideSubfolder: false
      };

      if (cls.category === 'sheet') {
        sheetFile = item;
      } else if (cls.category === 'profile') {
        profileFile = item;
      } else {
        // Tento súbor je voľne v koreni a mal by byť presunutý do podzložky
        rootUnsorted.push(item);

        // Pre potreby okamžitého zobrazenia v UI ho virtuálne priradíme do kategórie
        if (cls.category === 'fotodokumentacia') fotoList.push(item);
        else if (cls.category === 'predoperacne') predList.push(item);
        else if (cls.category === 'dokumentacia') dokuList.push(item);
        else if (cls.category === 'suhlasy') suhlList.push(item);
      }
    }

    const result: CategorizedPatientFiles = {
      folderId: targetFolderId,
      folderLink: webViewLink,
      patientName,
      subfolderIds: subIds,
      fotodokumentacia: fotoList,
      dokumentacia: dokuList,
      predoperacne: predList,
      suhlasy: suhlList,
      rootUnsorted,
      sheetFile,
      profileFile,
      totalCount: fotoList.length + dokuList.length + predList.length + suhlList.length + (sheetFile ? 1 : 0)
    };

    // Uložíme do vyrovnávacej pamäte
    this.cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  /**
   * Fyzicky presunie súbory z koreňa pacienta do ich cieľových medicínskych podzložiek na Google Disku
   */
  public static async autoOrganizePatientFolder(
    accessToken: string,
    patientName: string,
    folderId?: string
  ): Promise<{ success: boolean; movedCount: number; errors: string[] }> {
    const current = await this.getCategorizedPatientFiles(accessToken, patientName, folderId, true);
    if (!current.rootUnsorted || current.rootUnsorted.length === 0) {
      return { success: true, movedCount: 0, errors: [] };
    }

    const headers = { Authorization: `Bearer ${accessToken}` };
    let movedCount = 0;
    const errors: string[] = [];

    for (const file of current.rootUnsorted) {
      let targetSubId: string | undefined;

      if (file.category === 'fotodokumentacia') targetSubId = current.subfolderIds.fotodokumentacia;
      else if (file.category === 'predoperacne') targetSubId = current.subfolderIds.predoperacne;
      else if (file.category === 'suhlasy') targetSubId = current.subfolderIds.suhlasy;
      else if (file.category === 'dokumentacia') targetSubId = current.subfolderIds.dokumentacia;

      if (!targetSubId) {
        errors.push(`Cieľová zložka pre "${file.name}" nebola nájdená.`);
        continue;
      }

      try {
        // Google Drive API: presun pomocou pridania nového rodiča a odobratia pôvodného koreňa
        const moveUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?addParents=${targetSubId}&removeParents=${current.folderId}&supportsAllDrives=true`;
        const res = await fetch(moveUrl, {
          method: 'PATCH',
          headers
        });

        if (res.ok) {
          movedCount++;
        } else {
          const err = await res.json();
          errors.push(`Chyba pri presune "${file.name}": ${err?.error?.message || 'Neznáma chyba'}`);
        }
      } catch (err: any) {
        errors.push(`Chyba siete pri presune "${file.name}": ${err?.message || 'Neznáma chyba'}`);
      }
    }

    // Invalidujeme cache, aby sa po presune načítala čistá štruktúra
    this.invalidateCache(patientName);

    return {
      success: errors.length === 0 || movedCount > 0,
      movedCount,
      errors
    };
  }
}
