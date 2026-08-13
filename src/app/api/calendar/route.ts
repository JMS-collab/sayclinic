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
    // 1. Zistíme zoznam všetkých kalendárov
    const listRes = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      }
    );

    const listData = await listRes.json();

    if (!listRes.ok) {
      return NextResponse.json(
        { error: listData.error?.message || 'Chyba pri načítaní zoznamu kalendárov' }, 
        { status: listRes.status }
      );
    }

    const calendars = (listData.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary || 'Bez názvu',
      primary: cal.primary || false,
    }));

    let allEvents: any[] = [];

    // 2. Prejdeme každý kalendár a stiahneme z neho udalosti
    for (const cal of calendars) {
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?singleEvents=true&orderBy=startTime`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const items = eventsData.items || [];

        const formatted = items.map((item: any) => {
          const start = item.start?.dateTime || item.start?.date || '';
          const end = item.end?.dateTime || item.end?.date || '';

          const startDate = start.split('T')[0];
          const startTime = start.includes('T') ? start.split('T')[1].substring(0, 5) : '00:00';
          const endTime = end.includes('T') ? end.split('T')[1].substring(0, 5) : '23:59';

          return {
            id: item.id,
            calendarId: cal.id,
            calendarName: cal.summary,
            patientName: item.summary || 'Udalosť z Google Kalendára',
            doctorName: cal.summary,
            title: item.summary || 'Bez názvu',
            date: startDate,
            startTime: startTime,
            endTime: endTime,
            type: 'operacia',
            notes: item.description || ''
          };
        });

        allEvents = [...allEvents, ...formatted];
      }
    }

    return NextResponse.json({
      calendars,
      events: allEvents
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}