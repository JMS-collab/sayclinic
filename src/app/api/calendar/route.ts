import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: Request) {
  const session: any = await getServerSession();

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Nie ste prihlásený do Google účtu.' }, { status: 401 });
  }

  try {
    // Načítanie udalostí z primárneho Google Kalendára za posledný mesiac a dopredu
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
      return NextResponse.json({ error: data.error?.message || 'Chyba načítania' }, { status: res.status });
    }

    // Pretransformovanie dát z Googlu do formátu SAY CLINIC
    const formattedEvents = (data.items || []).map((item: any) => {
      const start = item.start?.dateTime || item.start?.date || '';
      const end = item.end?.dateTime || item.end?.date || '';

      const startDate = start.split('T')[0];
      const startTime = start.includes('T') ? start.split('T')[1].substring(0, 5) : '00:00';
      const endTime = end.includes('T') ? end.split('T')[1].substring(0, 5) : '23:59';

      return {
        id: item.id,
        patientName: item.summary || 'Bez názvu',
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