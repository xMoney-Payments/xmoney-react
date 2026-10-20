import { useEffect, useState } from 'react';
import { secretsError } from '../lib/config';
import { createPaymentIntent, type DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';

export function useSampleOrder(amountMinor: number, description: string) {
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const blocked = secretsError();
    if (blocked) {
      setOrder(null);
      setError(blocked);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setOrder(null);
    createPaymentIntent(amountMinor, description)
      .then((next) => {
        if (!cancelled) setOrder(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(errorText(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [amountMinor, description, nonce]);

  return {
    order,
    error,
    loading,
    reload: () => setNonce((value) => value + 1),
  };
}
