import type { ReactNode } from 'react';
import { formatMoney } from '../lib/format';
import type { Line, Product } from '../lib/catalog';
import { lightCard, lightEyebrow, lightMuted, qty, qtyBtn, storeBtn } from '../ui';

export function CartBadge({ count, onClick }: { count: number; onClick: () => void }) {
  const label = count > 0 ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart';
  return (
    <button
      type="button"
      className="relative grid h-11 w-11 place-items-center bg-transparent"
      aria-label={label}
      onClick={onClick}
    >
      <BagIcon />
      {count > 0 ? (
        <span className="absolute top-0.5 right-0.5 grid min-w-4 place-items-center rounded-full bg-(--accent) px-1 text-[10px] leading-4 font-bold text-(--on-accent)">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M6.2 8h11.6l-.9 11.1a1.6 1.6 0 0 1-1.6 1.4H8.7a1.6 1.6 0 0 1-1.6-1.4L6.2 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6.2a3 3 0 0 1 6 0V8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Qty({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  if (value <= 0) {
    return (
      <button type="button" className={storeBtn} onClick={() => onChange(1)}>
        Add
      </button>
    );
  }
  return (
    <div className={qty}>
      <button type="button" className={qtyBtn} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        −
      </button>
      <span className="min-w-6 text-center text-[13px] font-semibold">{value}</span>
      <button type="button" className={qtyBtn} onClick={() => onChange(value + 1)} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

export function CartPanel({
  lines,
  emptyHint,
  updating,
  children,
}: {
  lines: Line[];
  emptyHint: string;
  updating?: boolean;
  children?: ReactNode;
}) {
  const total = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  return (
    <aside className={`${lightCard} wide:sticky wide:top-6`}>
      <p className={lightEyebrow}>Cart</p>
      {lines.length === 0 ? (
        <p className={lightMuted}>{emptyHint}</p>
      ) : (
        <>
          <ul className="my-3 grid list-none gap-2.5 p-0">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-center gap-2.5">
                <img
                  src={`/products/${line.product.image}`}
                  alt=""
                  className="h-12 w-12 rounded-[10px] object-cover"
                />
                <span>
                  <strong className="block">
                    {line.product.name}
                    {line.quantity > 1 ? ` × ${line.quantity}` : ''}
                  </strong>
                  <span className={`block ${lightMuted}`}>{formatMoney(line.lineTotalMinor)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 mb-3.5 flex justify-between text-base">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </div>
          {updating ? <p className={lightMuted}>Updating order…</p> : null}
          {children}
        </>
      )}
    </aside>
  );
}

export function ProductVisual({
  product,
  size = 'card',
}: {
  product: Product;
  size?: 'card' | 'thumb' | 'plan';
}) {
  const frame =
    size === 'thumb' ? 'h-[88px] w-[88px]' : size === 'plan' ? 'h-[140px] w-full' : 'mb-3 aspect-square w-full';
  return (
    <img className={`${frame} rounded-2xl bg-[#eceaf3] object-cover`} src={`/products/${product.image}`} alt={product.name} />
  );
}
