import { google } from 'googleapis';

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 kódovaný obsah súboru
  contentType: string; // napr. 'application/pdf', 'image/png'
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  from?: string; // Voliteľné zobrazené meno odosielateľa (napr. 'SAY CLINIC <recepcia@sayclinic.sk>')
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

/**
 * Zakóduje reťazec do formátu Base64URL požadovaného pre Gmail API
 */
export function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === 'string' ? Buffer.from(str, 'utf-8') : str;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Zostaví korektnú MIME / RFC 2822 e-mailovú správu podporujúcu UTF-8 a prílohy
 */
export function createRfc2822Message(options: SendEmailOptions, senderEmail?: string): string {
  const boundary = `__SAY_CLINIC_BOUNDARY_${Date.now()}__`;
  const toAddresses = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  
  const fromHeader = options.from 
    ? options.from 
    : (senderEmail ? `SAY CLINIC <${senderEmail}>` : 'SAY CLINIC <me>');

  // UTF-8 kódovaný predmet pre bezchybné zobrazenie diakritiky
  const encodedSubject = `=?UTF-8?B?${Buffer.from(options.subject, 'utf-8').toString('base64')}?=`;

  const headers = [
    `From: ${fromHeader}`,
    `To: ${toAddresses}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
  ];

  if (options.replyTo) {
    headers.push(`Reply-To: ${options.replyTo}`);
  }

  if (options.attachments && options.attachments.length > 0) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    
    let message = headers.join('\r\n') + '\r\n\r\n';

    // HTML telo
    message += `--${boundary}\r\n`;
    message += `Content-Type: text/html; charset="UTF-8"\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n\r\n`;
    message += Buffer.from(options.bodyHtml, 'utf-8').toString('base64') + '\r\n\r\n';

    // Prílohy
    for (const att of options.attachments) {
      const cleanContent = att.content.replace(/^data:[^;]+;base64,/, '');
      message += `--${boundary}\r\n`;
      message += `Content-Type: ${att.contentType}; name="${att.filename}"\r\n`;
      message += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
      message += `Content-Transfer-Encoding: base64\r\n\r\n`;
      message += cleanContent + '\r\n\r\n';
    }

    message += `--${boundary}--`;
    return message;
  } else {
    headers.push(`Content-Type: text/html; charset="UTF-8"`);
    headers.push(`Content-Transfer-Encoding: base64`);
    return headers.join('\r\n') + '\r\n\r\n' + Buffer.from(options.bodyHtml, 'utf-8').toString('base64');
  }
}

/**
 * Server-side odoslanie e-mailu priamo cez oficiálnu knižnicu googleapis (Gmail API v1).
 * Využíva OAuth token prihláseného používateľa (Google Workspace @sayclinic.sk alebo @gmail.com).
 */
export async function sendEmailViaGmail(
  options: SendEmailOptions,
  accessToken: string
): Promise<SendEmailResult> {
  try {
    if (!accessToken) {
      return {
        success: false,
        error: 'Chýba OAuth prístupový token pre Gmail API.',
      };
    }

    // Inicializácia OAuth2 klienta
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Získanie profilu odosielateľa pre korektnú adresu v hlavičke From
    let senderEmail = 'me';
    try {
      const profile = await gmail.users.getProfile({ userId: 'me' });
      if (profile.data.emailAddress) {
        senderEmail = profile.data.emailAddress;
      }
    } catch (profileErr) {
      console.warn('Nepodarilo sa načítať profil odosielateľa:', profileErr);
    }

    // Zostavenie RFC 2822 správy a zakódovanie do base64url
    const rawRfc = createRfc2822Message(options, senderEmail !== 'me' ? senderEmail : undefined);
    const rawBase64Url = base64UrlEncode(rawRfc);

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawBase64Url,
      },
    });

    if (res.status !== 200 || !res.data.id) {
      return {
        success: false,
        error: `Gmail API vrátilo status ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: res.data.id,
      threadId: res.data.threadId || undefined,
    };
  } catch (err: any) {
    console.error('Chyba pri volaní Gmail API (sendEmailViaGmail):', err);
    return {
      success: false,
      error: err.message || 'Chyba servera pri odosielaní e-mailu cez Gmail API',
    };
  }
}

/**
 * Klientska funkcia na odoslanie e-mailu cez zabezpečený Next.js endpoint /api/gmail/send
 */
export async function sendTransactionalEmail(
  options: SendEmailOptions,
  token?: string | null
): Promise<SendEmailResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/gmail/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(options),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        error: data.error || `Chyba pri odosielaní (${res.status})`,
      };
    }

    return {
      success: true,
      messageId: data.messageId,
      threadId: data.threadId,
    };
  } catch (err: any) {
    console.error('Chyba spojenia pri odosielaní e-mailu:', err);
    return {
      success: false,
      error: err.message || 'Chyba siete',
    };
  }
}
