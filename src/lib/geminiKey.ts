import fs from 'fs';
import path from 'path';

/**
 * Získa platný Gemini API kľúč.
 * Prioritne číta kľúč priamo z `.env.local` na disku, aby nové kľúče zadané používateľom
 * okamžite prebili staré vyčerpané premenné prostredia z terminálu/shellu.
 */
export function getEffectiveGeminiApiKey(): string | undefined {
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const match = content.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
      if (match && match[1].trim()) {
        const key = match[1].trim().replace(/^["']|["']$/g, '');
        if (key.length > 5) {
          return key;
        }
      }
    }
  } catch {
    // ignorovať chyby pri čítaní súboru, použiť process.env
  }
  return process.env.GEMINI_API_KEY;
}
