import { SSEHub } from '@/lib/sseHub';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      unsubscribe = SSEHub.addSubscriber(controller);

      const encoder = new TextEncoder();
      // Úvodná správa o úspešnom pripojení k real-time hubu SAY CLINIC
      const initPayload = {
        type: 'init' as const,
        activeCount: SSEHub.getActiveCount(),
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initPayload)}\n\n`));

      // Pravidelný keep-alive ping každých 15 sekúnd (zabraňuje ukončeniu spojenia zo strany proxy/load balancera)
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
