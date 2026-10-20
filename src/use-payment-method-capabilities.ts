import {
  loadXMoney,
  type PaymentMethodCapabilities,
  type PaymentMethodCapabilitiesOptions,
} from '@xmoney/xmoney-js';
import { useEffect, useState } from 'react';

const DEFAULT_TIMEOUT_MS = 3000;

export interface PaymentMethodCapabilitiesState {
  capabilities: PaymentMethodCapabilities | null;
  loading: boolean;
  error: Error | null;
}

export function usePaymentMethodCapabilities(
  options?: PaymentMethodCapabilitiesOptions
): PaymentMethodCapabilitiesState {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const [capabilities, setCapabilities] = useState<PaymentMethodCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadXMoney()
      .then((xmoney) => xmoney.getPaymentMethodCapabilities({ timeout }))
      .then((result) => {
        if (cancelled) {
          return;
        }
        setCapabilities(result);
        setLoading(false);
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [timeout]);

  return { capabilities, loading, error };
}
