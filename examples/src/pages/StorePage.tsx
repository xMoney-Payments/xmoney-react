import { useMemo, useState } from 'react';
import { CartBadge, ProductVisual, Qty } from '../components/Cart';
import { TestCardsButton } from '../components/TestCardsDialog';
import { itemCount, linesOf, subtotalOf, type Brand } from '../lib/catalog';
import { formatMoney } from '../lib/format';
import { h1, lightCard, lightEyebrow, lightMuted, storeBtn, storeShell } from '../ui';
import { useWide } from '../hooks/useWide';
import { StoreCartStage, orderDescription, storeStyle, useQuantities, type StoreStep } from './store-shared';

export function StorePage({ brand, layout }: { brand: Brand; layout: 'menu' | 'plans' }) {
  const { quantities, setQuantity } = useQuantities();
  const [step, setStep] = useState<StoreStep>('catalog');
  const wide = useWide();
  const lines = useMemo(() => linesOf(quantities, brand.products), [quantities, brand.products]);
  const total = subtotalOf(lines);
  const count = itemCount(lines);
  const description = orderDescription(brand, lines);

  function add(id: string) {
    setQuantity(id, (quantities[id] ?? 0) + 1);
  }

  return (
    <div className={storeShell} style={storeStyle(brand.accent, brand.onAccent)}>
      <header className="mb-7 flex items-end justify-between gap-4">
        <div>
          {step === 'catalog' ? (
            <>
              <p className={lightEyebrow}>Example app</p>
              <h1 className={h1}>{brand.name}</h1>
              <p className={`mt-1.5 ${lightMuted}`}>{brand.tagline}</p>
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
          <div className={layout === 'plans' ? 'grid grid-cols-1 gap-3 wide:grid-cols-2' : 'grid gap-3'}>
            {brand.products.map((product) => (
              <article
                key={product.id}
                className={`${lightCard} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c4dff] ${
                  layout === 'plans'
                    ? 'grid grid-cols-1 items-start gap-3.5'
                    : 'grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3.5'
                }`}
                onClick={() => add(product.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    add(product.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <ProductVisual product={product} size={layout === 'plans' ? 'plan' : 'thumb'} />
                <div>
                  <p className={lightEyebrow}>{product.category}</p>
                  <h2 className="text-lg font-bold tracking-[-0.02em]">{product.name}</h2>
                  <p className={lightMuted}>{product.blurb}</p>
                </div>
                <footer
                  className="col-span-full flex items-center justify-between gap-2"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
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
          emptyHint={brand.emptyHint}
          description={description}
          onBackToCatalog={() => setStep('catalog')}
          onBackToCart={() => setStep('cart')}
          onCheckout={() => setStep('checkout')}
        />
      )}
    </div>
  );
}
