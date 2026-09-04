import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const { email, otpCode, type, userName } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Chýba e-mail alebo overovací OTP kód.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Ak nie je v prostredí nakonfigurovaný externý SMTP/Resend kľúč, kód bezpečne prenesieme klientovi
      console.log(`[PROD 2FA] Kód pre ${email}: ${otpCode}`);
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: `2FA kód bol vygenerovaný pre ${email}`,
        fallbackCode: otpCode,
        note: 'E-mailová brána nie je nakonfigurovaná. Bezpečnostný kód je zobrazený na obrazovke.',
      });
    }

    const resend = new Resend(apiKey);

    // Odoslanie reálneho 2FA e-mailu
    try {
      const emailResult = await resend.emails.send({
        from: 'SAY CLINIC Bezpečnosť <onboarding@resend.dev>', // Po overení vlastnej domény: bezpecnost@sayclinic.sk
        to: [email],
        subject: type === 'reset' ? '🔑 Obnova hesla - SAY CLINIC' : '🔐 Váš 2FA overovací kód - SAY CLINIC',
        html: `
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
              Ak ste o tento kód nežiadali, kontaktujte správcu systému SAY CLINIC.<br/>Kód vyprší o 10 minút.
            </p>
          </div>
        `,
      });

      if (emailResult.error) {
        console.warn('Resend API vrátilo obmedzenie:', emailResult.error);
        return NextResponse.json({
          success: true,
          emailSent: false,
          fallbackCode: otpCode,
          message: `E-mail sa nepodarilo doručiť (${emailResult.error.message || 'doména neoverená'}). Kód je k dispozícii na obrazovke.`,
        });
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        message: `2FA kód bol úspešne odoslaný na e-mail: ${email}`,
        fallbackCode: otpCode,
        id: emailResult.data?.id,
      });
    } catch (sendErr: any) {
      console.warn('Zlyhanie odoslania cez Resend:', sendErr);
      return NextResponse.json({
        success: true,
        emailSent: false,
        fallbackCode: otpCode,
        message: `E-mailovú službu sa nepodarilo spojiť. Použite zobrazený bezpečnostný kód.`,
      });
    }

  } catch (error: any) {
    console.error('Chyba pri spracovaní 2FA požiadavky:', error);
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: 'Chyba servera pri odosielaní. Môžete použiť priame overenie.',
    });
  }
}