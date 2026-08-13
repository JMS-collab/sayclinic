import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// GET: Načítanie udalostí zo všetkých kalendárov
export async function GET() {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
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

    const now = new Date();
    const pastYear = new Date(now);
    pastYear.setFullYear(pastYear.getFullYear() - 1);
    
    const futureYear = new Date(now);
    futureYear.setFullYear(futureYear.getFullYear() + 1);

    const timeMin = pastYear.toISOString();
    const timeMax = futureYear.toISOString();

    let allEvents: any[] = [];

    for (const cal of calendars) {
      const eventsUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events`);
      eventsUrl.searchParams.append('singleEvents', 'true');
      eventsUrl.searchParams.append('orderBy', 'startTime');
      eventsUrl.searchParams.append('maxResults', '2500');
      eventsUrl.searchParams.append('timeMin', timeMin);
      eventsUrl.searchParams.append('timeMax', timeMax);

      const eventsRes = await fetch(eventsUrl.toString(), {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

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
            patientName: item.summary || 'Udalosť bez názvu',
            doctorName: cal.summary,
            title: item.summary || 'Udalosť bez názvu',
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

// POST: Vytvorenie novej udalosti priamo v Google Kalendári
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: 'Nie ste prihlásený alebo chýba prístupový token.' }, 
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { title, patientName, date, startTime, endTime, notes, calendarId } = body;

    const targetCalendarId = calendarId || 'primary';

    // Skladanie ISO dátumov pre Google API
    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const googleEvent = {
      summary: `${title} - ${patientName}`,
      description: notes || '',
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    };

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Chyba pri vytváraní udalosti v Google Kalendári' }, 
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}