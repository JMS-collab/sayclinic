import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendEmailViaGmail, SendEmailOptions } from '@/services/emailService';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const session: any = await getServerSession(authOptions);

    const body = await req.json();
    const accessToken = bearerToken || body.token || session?.accessToken || process.env.GMAIL_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Nie ste autorizovaný na odosielanie cez Gmail. Prihláste sa cez Google Workspace účet (@sayclinic.sk alebo @gmail.com).',
        },
        { status: 401 }
      );
    }

    const to = body.to || body.toEmail;
    const subject = body.subject;
    const bodyHtml = body.bodyHtml || body.html || body.message;

    if (!to || !subject || !bodyHtml) {
      return NextResponse.json(
        { error: 'Chýba príjemca (to), predmet (subject) alebo obsah e-mailu (bodyHtml).' },
        { status: 400 }
      );
    }

    const emailOptions: SendEmailOptions = {
      to,
      subject,
      bodyHtml,
      from: body.from,
      replyTo: body.replyTo,
      attachments: body.attachments || [],
    };

    const result = await sendEmailViaGmail(emailOptions, accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Nepodarilo sa odoslať e-mail cez Gmail API.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    });
  } catch (error: any) {
    console.error('Chyba v /api/gmail/send:', error);
    return NextResponse.json(
      { error: error.message || 'Chyba servera pri odosielaní e-mailu.' },
      { status: 500 }
    );
  }
}
