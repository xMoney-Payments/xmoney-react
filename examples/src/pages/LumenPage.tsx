import { useMemo, useState } from 'react';
import { CartBadge, ProductVisual, Qty } from '../components/Cart';
import { TestCardsButton } from '../components/TestCardsDialog';
import { itemCount, linesOf, lumen, subtotalOf } from '../lib/catalog';
import { formatMoney } from '../lib/format';
import { h1, lightCard, lightEyebrow, lightMuted, storeBtn, storeShell } from '../ui';
import { useWide } from '../hooks/useWide';
import { StoreCartStage, orderDescription, storeStyle, useQuantities, type StoreStep } from './store-shared';

export function LumenPage() {
  const { quantities, setQuantity } = useQuantities();
  const [step, setStep] = useState<StoreStep>('catalog');
  const wide = useWide();
  const lines = useMemo(() => linesOf(quantities, lumen.products), [quantities]);
  const total = subtotalOf(lines);
  const count = itemCount(lines);
  const description = orderDescription(lumen, lines);

  return (
    <div className={storeShell} style={storeStyle(lumen.accent, lumen.onAccent)}>
      <header className="mb-7 flex items-end justify-between gap-4">
        <div>
          {step === 'catalog' ? (
            <>
              <p className={lightEyebrow}>Example app</p>
              <h1 className={h1}>{lumen.name}</h1>
              <p className={`mt-1.5 ${lightMuted}`}>{lumen.tagline}</p>
            </>
          ) : (
            <h1 className={h1}>{step === 'checkout' && !wide ? 'Checkout' : 'Cart'}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step === 'catalog' ? <CartBadge count={count} onClick={() => setStep('cart')} /> : null}
          <TestCardsButton />
        </div>
      </header>
      {step === 'catalog' ? (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {lumen.products.map((product) => (
              <article key={product.id} className={lightCard}>
                <ProductVisual product={product} />
                <p className={lightEyebrow}>{product.category}</p>
                <h2 className="my-0.5 text-lg font-bold tracking-[-0.02em]">{product.name}</h2>
                <p className={lightMuted}>{product.blurb}</p>
                <footer className="mt-3 flex items-center justify-between gap-2">
                  <strong>{formatMoney(product.priceMinor)}</strong>
                  <Qty value={quantities[product.id] ?? 0} onChange={(next) => setQuantity(product.id, next)} />
                </footer>
              </article>
            ))}
          </div>
          {count > 0 ? (
            <button type="button" className={`${storeBtn} sticky bottom-4 mt-6 w-full`} onClick={() => setStep('cart')}>
              Cart · {count} {count === 1 ? 'item' : 'items'} · {formatMoney(total)}
            </button>
          ) : null}
        </>
      ) : (
        <StoreCartStage
          step={step}
          wide={wide}
          lines={lines}
          emptyHint={lumen.emptyHint}
          description={description}
          onBackToCatalog={() => setStep('catalog')}
          onBackToCart={() => setStep('cart')}
          onCheckout={() => setStep('checkout')}
        />
      )}
    </div>
  );
}
