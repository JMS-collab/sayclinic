// Server-Sent Events (SSE) Hub pre real-time komunikáciu naprieč všetkými počítačmi v SAY CLINIC

type SSEController = ReadableStreamDefaultController;

// Globálna referencia na pripojené klienty (pretrváva v pamäti Node.js procesu)
const globalSubscribers = (globalThis as any).__say_clinic_sse_subscribers || new Set<SSEController>();
(globalThis as any).__say_clinic_sse_subscribers = globalSubscribers;

export const SSEHub = {
  // Pridanie nového pripojeného počítača / klienta
  addSubscriber(controller: SSEController): () => void {
    globalSubscribers.add(controller);
    
    return () => {
      globalSubscribers.delete(controller);
    };
  },

  // Odoslanie real-time udalosti do všetkých pripojených počítačov
  broadcast(data: {
    type: 'change' | 'ping' | 'init';
    collection?: string;
    data?: any;
    sourceUserId?: string;
    timestamp: string;
  }): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    const toDelete: SSEController[] = [];
    globalSubscribers.forEach((controller: SSEController) => {
      try {
        controller.enqueue(encoded);
      } catch (err) {
        // Klient sa odpojil
        toDelete.push(controller);
      }
    });

    toDelete.forEach((c) => globalSubscribers.delete(c));
  },

  // Počet aktuálne online pripojených počítačov / tabov
  getActiveCount(): number {
    return globalSubscribers.size;
  }
};
