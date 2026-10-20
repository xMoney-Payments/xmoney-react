import type { IncomingMessage } from 'node:http';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const DEMO_CUSTOMER = 'customer-12333';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '');
  const demoApi = (env.VITE_API_BASE || 'https://demo.xmoney.com').replace(/\/$/, '');
  const apiKey = env.API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react(), tailwindcss(), basicSsl(), demoApiPlugin(demoApi, env.VITE_PUBLIC_KEY ?? '', apiKey)],
    resolve: {
      alias: {
        '@xmoney/react': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
      },
      dedupe: ['react', 'react-dom'],
    },
    server: {
      port: 5174,
      fs: { allow: ['..'] },
    },
  };
});

function demoApiPlugin(demoApi: string, publicKey: string, apiKey: string): Plugin {
  const key = apiKey.trim();
  const siteKey = publicKey.trim();
  return {
    name: 'xmoney-demo-api',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          const path = req.url?.split('?')[0];
          if (req.method !== 'POST' || (path !== '/api/orders' && path !== '/api/cards')) {
            next();
            return;
          }
          if (path === '/api/cards') {
            void writeCards(res, siteKey, key);
            return;
          }
          void writeOrder(req, res, demoApi, key);
        });
      };
    },
  };
}

async function writeOrder(req: IncomingMessage, res: JsonResponse, demoApi: string, apiKey: string) {
  try {
    if (!apiKey) {
      send(res, 500, { error: 'Set API_KEY in examples/.env' });
      return;
    }
    const body = (await readJson(req)) as Record<string, unknown>;
    delete body.apiKey;
    const response = await fetch(`${demoApi}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ ...body, apiKey }),
    });
    const json = await response.text();
    res.statusCode = response.status;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.end(json);
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : 'Failed to create order';
    send(res, 500, { error: message });
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

async function writeCards(res: JsonResponse, publicKey: string, apiKey: string) {
  try {
    if (!publicKey || !apiKey) {
      send(res, 500, { error: 'Set VITE_PUBLIC_KEY and API_KEY in examples/.env' });
      return;
    }
    const cards = await listSavedCards(publicKey, apiKey);
    send(res, 200, { cards });
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : 'Failed to load cards';
    send(res, 500, { error: message });
  }
}

interface JsonResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body: string) => void;
}

function send(res: JsonResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function listSavedCards(publicKey: string, apiKey: string) {
  const host = publicKey.startsWith('pk_live') ? 'https://api.xmoney.com' : 'https://api-stage.xmoney.com';
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const customerResponse = await fetch(
    `${host}/customer?identifier=${encodeURIComponent(DEMO_CUSTOMER)}`,
    { headers },
  );
  if (customerResponse.status === 404) return [];
  const customerBody = (await customerResponse.json().catch(() => ({}))) as {
    message?: string;
    data?: { id?: number }[];
  };
  if (!customerResponse.ok) {
    throw new Error(customerBody.message || `Customer lookup failed (${customerResponse.status})`);
  }
  const customerId = customerBody.data?.[0]?.id;
  if (!customerId) return [];

  const cardsResponse = await fetch(`${host}/card?customerId=${customerId}`, { headers });
  const cardsBody = (await cardsResponse.json().catch(() => ({}))) as {
    message?: string;
    data?: RawCard[];
  };
  if (!cardsResponse.ok) {
    throw new Error(cardsBody.message || `Card lookup failed (${cardsResponse.status})`);
  }
  return (cardsBody.data ?? []).map(slimCard).filter((card) => card.id > 0);
}

interface RawCard {
  id?: number;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  type?: string;
  nameOnCard?: string;
  cardHolderCountry?: string;
  cardProvider?: string;
  binInfo?: {
    brand?: string;
    type?: string;
    level?: string;
    countryCode?: string;
    bank?: string;
  };
}

function slimCard(card: RawCard) {
  const bin = card.binInfo;
  return {
    id: card.id ?? 0,
    brand: bin?.brand || card.type || card.cardProvider || 'Card',
    number: card.cardNumber ?? '',
    expiryMonth: card.expiryMonth ?? '',
    expiryYear: card.expiryYear ?? '',
    nameOnCard: card.nameOnCard ?? '',
    funding: bin?.type ?? '',
    level: bin?.level ?? '',
    bank: bin?.bank ?? '',
    country: bin?.countryCode || card.cardHolderCountry || '',
  };
}
