/**
 * SAY CLINIC - Priamy klientsky servis pre prácu s Google Drive API
 * Vykonáva požiadavky priamo z prehliadača používateľa s natívnou podporou CORS.
 * Tým obchádza sieťové timeouty (ConnectTimeoutError) a serverless obmedzenia na hostingu.
 */

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
}

export class DriveClientService {
  private static cachedRootFolderId: string | null = null;
  private static folderCache = new Map<string, string>(); // patientName -> folderId

  /**
   * Zabezpečí existenciu hlavného priečinka "Klienti SAY"
   */
  public static async ensureRootFolder(accessToken: string): Promise<string> {
    if (this.cachedRootFolderId) return this.cachedRootFolderId;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const q = "name = 'Klienti SAY' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers }
      );

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.files && data.files.length > 0) {
          this.cachedRootFolderId = data.files[0].id;
          return data.files[0].id;
        }
      }

      // Ak priečinok neexistuje, vytvoríme ho
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Klienti SAY',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (createRes.ok) {
        const created = await createRes.json();
        this.cachedRootFolderId = created.id;
        return created.id;
      }
    } catch (err) {
      console.warn('Priamy prístup k vytvoreniu kmeňového priečinka zlyhal, skúšam proxy:', err);
    }

    // Fallback cez internú Next.js API trasu
    const proxyRes = await fetch('/api/drive?patientName=Klienti_Init', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (proxyRes.ok) {
      const pData = await proxyRes.json();
      if (pData.rootFolderId) {
        this.cachedRootFolderId = pData.rootFolderId;
        return pData.rootFolderId;
      }
    }

    throw new Error('Nepodarilo sa vytvoriť ani načítať hlavný priečinok "Klienti SAY" na Google Disku.');
  }

  /**
   * Zabezpečí existenciu priečinka pre pacienta v "Klienti SAY"
   */
  public static async ensurePatientFolder(
    accessToken: string,
    patientName: string
  ): Promise<{ folderId: string; webViewLink: string }> {
    const cachedId = this.folderCache.get(patientName.toLowerCase().trim());
    if (cachedId) {
      return {
        folderId: cachedId,
        webViewLink: `https://drive.google.com/drive/folders/${cachedId}`,
      };
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const rootFolderId = await this.ensureRootFolder(accessToken);
    const escapedName = patientName.replace(/'/g, "\\'");
    const query = `'${rootFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers }
      );

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.files && data.files.length > 0) {
          const folder = data.files[0];
          this.folderCache.set(patientName.toLowerCase().trim(), folder.id);
          return {
            folderId: folder.id,
            webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
          };
        }
      }

      // Vytvoríme priečinok pacienta
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: patientName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId],
        }),
      });

      if (createRes.ok) {
        const folder = await createRes.json();
        this.folderCache.set(patientName.toLowerCase().trim(), folder.id);

        // Vytvoríme štandardné medicínske podzložky
        const subfolders = ['Fotodokumentácia', 'Dokumentácia', 'Predoperačné vyšetrenia', 'Súhlasy a protokoly'];
        for (const sub of subfolders) {
          try {
            await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                name: sub,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [folder.id],
              }),
            });
          } catch {
            // Tichý fallback
          }
        }

        return {
          folderId: folder.id,
          webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
        };
      }
    } catch (err) {
      console.warn('Priame vytvorenie priečinka pacienta na Google Drive zlyhalo, skúšam proxy:', err);
    }

    // Proxy fallback
    const proxyRes = await fetch('/api/drive/create-patient', {
      method: 'POST',
      headers,
      body: JSON.stringify({ patientName }),
    });
    if (proxyRes.ok) {
      const pData = await proxyRes.json();
      if (pData.folderId) {
        this.folderCache.set(patientName.toLowerCase().trim(), pData.folderId);
        return {
          folderId: pData.folderId,
          webViewLink: pData.webViewLink || `https://drive.google.com/drive/folders/${pData.folderId}`,
        };
      }
    }

    throw new Error(`Nepodarilo sa vytvoriť priečinok pre pacienta "${patientName}".`);
  }

  /**
   * Načíta súbory zo zložky pacienta
   */
  public static async getPatientFiles(
    accessToken: string,
    patientName: string
  ): Promise<{ found: boolean; folderLink?: string; files: DriveItem[]; error?: string }> {
    try {
      const { folderId, webViewLink } = await this.ensurePatientFolder(accessToken, patientName);
      const headers = { Authorization: `Bearer ${accessToken}` };

      // Načítame súbory a podzložky
      const q = `'${folderId}' in parents and trashed = false`;
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,modifiedTime)&orderBy=folder,modifiedTime desc&supportsAllDrives=true&includeItemsFromAllDrives=true`,
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        return {
          found: true,
          folderLink: webViewLink,
          files: data.files || [],
        };
      }
    } catch (err: any) {
      console.warn('Priame načítanie súborov zlyhalo, prepínam na proxy:', err?.message);
    }

    // Fallback cez Next.js server route
    try {
      const proxyRes = await fetch(`/api/drive?patientName=${encodeURIComponent(patientName)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch {
      // ignore
    }

    return {
      found: false,
      files: [],
      error: 'Nepodarilo sa načítať súbory z Google Drive.',
    };
  }

  /**
   * Synchronizuje profil pacienta (profil_klienta.json) do jeho priečinka na Google Disku
   */
  public static async syncPatientProfile(
    accessToken: string,
    patient: any
  ): Promise<{ success: boolean; driveFolderLink?: string }> {
    if (!accessToken || !patient?.name) {
      return { success: false };
    }

    try {
      const { folderId, webViewLink } = await this.ensurePatientFolder(accessToken, patient.name);
      const headers = { Authorization: `Bearer ${accessToken}` };

      const profilePayload = {
        ...patient,
        driveFolderId: folderId,
        driveFolderLink: webViewLink,
        synchronizedAt: new Date().toISOString(),
        system: 'SAY CLINIC Aesthetic & Surgery System',
      };

      const boundary = '-------sayclinic' + Date.now();
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadata = {
        name: 'profil_klienta.json',
        mimeType: 'application/json',
        parents: [folderId],
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(profilePayload, null, 2) +
        closeDelimiter;

      // Vyhľadáme, či už existuje profil_klienta.json
      const q = `'${folderId}' in parents and name = 'profil_klienta.json' and trashed = false`;
      const findRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true`,
        { headers }
      );

      if (findRes.ok) {
        const findData = await findRes.json();
        if (findData.files && findData.files.length > 0) {
          const fileId = findData.files[0].id;
          // Aktualizujeme existujúci
          await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          });

          return { success: true, driveFolderLink: webViewLink };
        }
      }

      // Vytvoríme nový súbor
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      return { success: true, driveFolderLink: webViewLink };
    } catch (err) {
      console.warn('Priamy zápis profilu na Google Drive zlyhal, skúšam proxy:', err);
      // Fallback na serverless proxy
      try {
        const proxyRes = await fetch('/api/drive/sync-patient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(patient),
        });
        if (proxyRes.ok) {
          const pData = await proxyRes.json();
          return { success: true, driveFolderLink: pData.driveFolderLink };
        }
      } catch {
        // ignore
      }
    }

    return { success: false };
  }
}
