import type { TransactionDetails } from '@xmoney/react';
import { useEffect, useState, type CSSProperties } from 'react';
import { CartPanel } from '../components/Cart';
import { CheckoutPending } from '../components/CheckoutSkeleton';
import { ResultPanel, StatusChip, type PaymentOutcome } from '../components/SampleChrome';
import { WidgetShell } from '../components/WidgetShell';
import { useLiveOrder } from '../hooks/useLiveOrder';
import { itemCount, subtotalOf, type Brand, type Line } from '../lib/catalog';
import { formatMoney } from '../lib/format';
import { btnSecondary, lightMuted, payBlocker, payWrap, storeBtn } from '../ui';
import { StorePaymentForm } from './StorePaymentForm';

export type StoreStep = 'catalog' | 'cart' | 'checkout';

export function useQuantities() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  function setQuantity(id: string, next: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(0, next) }));
  }

  return { quantities, setQuantity, clear: () => setQuantities({}) };
}

export function orderDescription(brand: Brand, lines: Line[]): string {
  const count = itemCount(lines);
  return `${brand.name} · ${count} ${count === 1 ? 'item' : 'items'}`;
}

export function storeStyle(accent: string, onAccent: string): CSSProperties {
  return { '--accent': accent, '--on-accent': onAccent } as CSSProperties;
}

export function StoreCheckout({
  lines,
  description,
  active,
}: {
  lines: Line[];
  description: string;
  active: boolean;
}) {
  const amount = subtotalOf(lines);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);
  const live = useLiveOrder(!active || outcome ? 0 : amount, description);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(false), [live.mountOrder]);

  if (outcome) {
    return (
      <>
        <ResultPanel outcome={outcome} />
        <button type="button" className={btnSecondary} onClick={() => setOutcome(null)}>
          New payment
        </button>
      </>
    );
  }

  return (
    <div className={payWrap}>
      {live.preparing && !live.mountOrder ? <CheckoutPending /> : null}
      {live.error ? <StatusChip tone="error">{live.error}</StatusChip> : null}
      {live.mountOrder ? (
        <>
          {live.updating ? <div className={payBlocker} aria-hidden="true" /> : null}
          <StorePaymentForm
            ref={live.formRef}
            order={live.mountOrder}
            onReady={() => setReady(true)}
            onComplete={(transaction: TransactionDetails) => setOutcome({ kind: 'complete', transaction })}
            onError={(message) => setOutcome({ kind: 'error', message })}
          />
          <span className="sr-only">{ready ? 'Checkout ready' : 'Checkout loading'}</span>
        </>
      ) : null}
    </div>
  );
}

export function StoreCartStage({
  step,
  wide,
  lines,
  emptyHint,
  description,
  onBackToCatalog,
  onBackToCart,
  onCheckout,
}: {
  step: 'cart' | 'checkout';
  wide: boolean;
  lines: Line[];
  emptyHint: string;
  description: string;
  onBackToCatalog: () => void;
  onBackToCart: () => void;
  onCheckout: () => void;
}) {
  const total = subtotalOf(lines);
  const showCart = wide || step === 'cart';
  const showCheckout = wide || step === 'checkout';

  return (
    <div className="grid items-start gap-6 wide:grid-cols-[minmax(0,1fr)_minmax(280px,448px)]">
      {showCart ? (
        <section>
          <button type="button" className="mb-4 text-sm font-semibold" onClick={onBackToCatalog}>
            ← Shop
          </button>
          <CartPanel lines={lines} emptyHint={emptyHint}>
            <button type="button" className={`${storeBtn} w-full wide:hidden`} onClick={onCheckout}>
              Checkout · {formatMoney(total)}
            </button>
          </CartPanel>
        </section>
      ) : null}
      {showCheckout ? (
        <section className="flex justify-center">
          <div className="w-full max-w-[448px]">
            {wide ? null : (
              <button type="button" className="mb-4 text-sm font-semibold" onClick={onBackToCart}>
                ← Cart
              </button>
            )}
            <WidgetShell>
              {total > 0 ? (
                <StoreCheckout lines={lines} description={description} active />
              ) : (
                <p className={lightMuted}>{emptyHint}</p>
              )}
            </WidgetShell>
          </div>
        </section>
      ) : null}
    </div>
  );
}
