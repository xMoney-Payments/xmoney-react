import type { OrderUpdate, OrderUpdateResult } from '@xmoney/react';
import { useEffect, useRef, useState } from 'react';
import { secretsError } from '../lib/config';
import { createPaymentIntent, type DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';

export interface OrderUpdater {
  updateOrder: (order: OrderUpdate) => Promise<OrderUpdateResult>;
}

/**
 * Creates an order for `amountMinor`, then keeps that mounted form and calls
 * `updateOrder` when the amount or description changes. Passing `0` tears the
 * form down. A cover should sit on the form while `updating` is true.
 */
export function useLiveOrder(amountMinor: number, description: string, resetKey = '') {
  const formRef = useRef<OrderUpdater>(null);
  const bound = useRef(false);
  const seq = useRef(0);
  const epoch = useRef(resetKey);
  const [mountOrder, setMountOrder] = useState<DemoOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const id = ++seq.current;
    if (epoch.current !== resetKey) {
      epoch.current = resetKey;
      bound.current = false;
      setMountOrder(null);
    }
    if (amountMinor <= 0) {
      bound.current = false;
      setMountOrder(null);
      setPreparing(false);
      setUpdating(false);
      return;
    }

    const blocked = secretsError();
    if (blocked) {
      setError(blocked);
      setPreparing(false);
      setUpdating(false);
      return;
    }

    const alreadyBound = bound.current;
    if (alreadyBound) setUpdating(true);
    else setPreparing(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = await createPaymentIntent(amountMinor, description);
          if (seq.current !== id) return;
          if (!bound.current) {
            bound.current = true;
            setMountOrder(next);
            return;
          }
          const result = await formRef.current?.updateOrder({
            orderPayload: next.payload,
            orderChecksum: next.checksum,
          });
          if (seq.current !== id) return;
          if (result && !result.success) {
            setError(result.error || 'Could not update the order');
          }
        } catch (cause: unknown) {
          if (seq.current !== id) return;
          setError(errorText(cause));
        } finally {
          if (seq.current === id) {
            setPreparing(false);
            setUpdating(false);
          }
        }
      })();
    }, alreadyBound ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [amountMinor, description, resetKey]);

  return { formRef, mountOrder, error, preparing, updating };
}
