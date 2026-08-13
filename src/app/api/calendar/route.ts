import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime',
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Chyba Google API' }, 
        { status: res.status }
      );
    }

    const formattedEvents = (data.items || []).map((item: any) => {
      const start = item.start?.dateTime || item.start?.date || '';
      const end = item.end?.dateTime || item.end?.date || '';

      const startDate = start.split('T')[0];
      const startTime = start.includes('T') ? start.split('T')[1].substring(0, 5) : '00:00';
      const endTime = end.includes('T') ? end.split('T')[1].substring(0, 5) : '23:59';

      return {
        id: item.id,
        patientName: item.summary || 'Udalosť z Google Kalendára',
        doctorName: 'Google Calendar',
        title: item.summary || 'Bez názvu',
        date: startDate,
        startTime: startTime,
        endTime: endTime,
        type: 'operacia',
        notes: item.description || ''
      };
    });

    return NextResponse.json(formattedEvents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}