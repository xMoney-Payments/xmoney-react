import { currency, publicKey, secretsError } from './config';

export interface DemoOrder {
  payload: string;
  checksum: string;
}

/**
 * Demo-only checkout backend.
 *
 * Do not copy this into a merchant app. The page posts to `/api/orders` on
 * this dev server. That middleware holds `API_KEY` and talks to the demo host.
 * The browser never sees the key.
 *
 * In production the page holds only `publicKey`. Your server creates the
 * order and returns `payload` and `checksum`.
 */
export async function createPaymentIntent(
  amountMinor: number,
  description: string,
): Promise<DemoOrder> {
  const message = secretsError();
  if (message) throw new Error(message);

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      amount: amountMinor / 100,
      currency: currency(),
      description,
      publicKey: publicKey(),
    }),
  });

  const json = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    payload?: string;
    checksum?: string;
  };

  if (!response.ok) {
    throw new Error(json.error || json.message || `HTTP ${response.status}`);
  }
  if (!json.payload || !json.checksum) {
    throw new Error('Missing payload or checksum in API response');
  }
  return { payload: json.payload, checksum: json.checksum };
}
