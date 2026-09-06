import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendEmailViaGmail } from '@/services/emailService';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);

    const body = await req.json();
    const { email, otpCode, type, userName } = body;

    const accessToken = bearerToken || body.token || session?.accessToken || process.env.GMAIL_ACCESS_TOKEN;

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Chýba e-mail alebo overovací OTP kód.' },
        { status: 400 }
      );
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #FBF9F6; color: #2C2A29; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #E8E2D9;">
        <div style="text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #2C2A29; font-size: 24px; font-weight: 300; letter-spacing: 3px; margin: 0;">SAY CLINIC</h1>
          <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #8C857B; margin-top: 5px;">PLASTICKÁ CHIRURGIA & DERMATOLÓGIA</p>
        </div>
        
        <p style="font-size: 14px;">Dobrý deň, <strong>${userName || 'člen tímu'}</strong>,</p>
        <p style="font-size: 13px; color: #555;">${type === 'reset' ? 'Boli požiadaní o obnovu hesla do systému SAY CLINIC.' : 'Pre dokončenie prihlásenia do interného systému SAY CLINIC použite nasledujúci 2FA overovací kód:'}</p>
        
        <div style="background-color: #2C2A29; color: #C5A059; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 18px; text-align: center; border-radius: 10px; margin: 25px 0; border: 1px solid #C5A059;">
          ${otpCode}
        </div>
        
        <p style="font-size: 11px; color: #8C857B; text-align: center; margin-top: 20px;">
          Odoslané priamo cez oficiálnu bránu SAY CLINIC (Google Workspace / Gmail API).<br/>
          Ak ste o tento kód nežiadali, kontaktujte správcu systému SAY CLINIC.<br/>
          Kód vyprší o 10 minút.
        </p>
      </div>
    `;

    // Ak máme Gmail OAuth prístupový token, odošleme skutočný e-mail cez Gmail API
    if (accessToken) {
      try {
        const result = await sendEmailViaGmail(
          {
            to: [email],
            subject: type === 'reset' ? '🔑 Obnova hesla - SAY CLINIC' : '🔐 Váš 2FA overovací kód - SAY CLINIC',
            bodyHtml: htmlBody,
          },
          accessToken
        );

        if (result.success) {
          return NextResponse.json({
            success: true,
            emailSent: true,
            message: `2FA kód bol úspešne odoslaný cez Gmail na e-mail: ${email}`,
            fallbackCode: otpCode,
            messageId: result.messageId,
          });
        } else {
          console.warn('Gmail API odoslanie zlyhalo, prepínam na fallback:', result.error);
          return NextResponse.json({
            success: true,
            emailSent: false,
            fallbackCode: otpCode,
            message: `Gmail API: ${result.error || 'nepodarilo sa doručiť'}. Kód je k dispozícii na obrazovke.`,
          });
        }
      } catch (gmailErr: any) {
        console.warn('Zlyhanie pri volaní Gmail API v send-otp:', gmailErr);
      }
    }

    // Fallback: ak token nie je v tomto okamihu k dispozícii, kód sa zobrazí na obrazovke
    console.log(`[PROD 2FA] Kód pre ${email}: ${otpCode}`);
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: `2FA overovací kód bol pripravený pre ${email}`,
      fallbackCode: otpCode,
      note: 'Pre automatické odosielanie cez Gmail sa prihláste cez Google účet alebo zadajte kód z obrazovky.',
    });

  } catch (error: any) {
    console.error('Chyba pri spracovaní 2FA požiadavky:', error);
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: 'Chyba servera pri odosielaní. Môžete použiť priame overenie.',
    });
  }
}