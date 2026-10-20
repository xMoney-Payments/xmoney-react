import { useSavedCardPayment, type TransactionDetails } from '@xmoney/react';
import { useEffect, useState } from 'react';
import { StatusChip } from '../components/SampleChrome';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { btnAccent } from '../ui';

interface SavedCard {
  id: number;
  brand: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  nameOnCard?: string;
  funding?: string;
  level?: string;
  bank?: string;
  country?: string;
}

export function SavedCardPayment({
  order,
  onComplete,
  onError,
}: {
  order: DemoOrder | null;
  onComplete: (transaction: TransactionDetails) => void;
  onError: (message: string) => void;
}) {
  const [cards, setCards] = useState<SavedCard[] | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/cards', { method: 'POST' });
        const body = (await response.json().catch(() => ({}))) as { error?: string; cards?: SavedCard[] };
        if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
        if (cancelled) return;
        const list = body.cards ?? [];
        setCards(list);
        setSelectedId(list[0]?.id ?? null);
      } catch (cause: unknown) {
        if (cancelled) return;
        setCardsError(cause instanceof Error ? cause.message : 'Failed to load cards');
        setCards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {cards === null && !cardsError ? (
        <p className="text-sm text-black/55 dark:text-zinc-400">Loading cards…</p>
      ) : null}
      {cardsError ? <StatusChip tone="error">{cardsError}</StatusChip> : null}
      {cards && cards.length === 0 && !cardsError ? (
        <p className="text-sm text-black/55 dark:text-zinc-400">No saved cards for this customer.</p>
      ) : null}
      {cards && cards.length > 0 ? (
        <>
          <p className="mb-2 text-xs font-bold tracking-[0.1em] text-black/55 uppercase dark:text-zinc-400">
            Saved cards
          </p>
          <ul
            className="card-list m-0 grid max-h-80 list-none gap-2 overflow-y-auto overscroll-contain p-0.5"
            aria-label="Saved cards"
          >
            {cards.map((card) => {
              const selected = card.id === selectedId;
              const meta = [expiryLabel(card), pretty(card.funding), pretty(card.level), card.country]
                .filter(Boolean)
                .join(' · ');
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={`grid w-full gap-1.5 rounded-2xl border px-3.5 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c4dff] ${
                      selected
                        ? 'border-[#7c4dff]/40 bg-[#7c4dff]/12'
                        : 'border-black/[0.08] bg-transparent hover:bg-black/[0.03] dark:border-white/12 dark:hover:bg-white/[0.04]'
                    }`}
                    onClick={() => setSelectedId(card.id)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <BrandMark brand={card.brand} />
                        <span className="truncate text-sm font-semibold">
                          {card.nameOnCard || pretty(card.brand)}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                          selected ? 'border-[#7c4dff] bg-[#7c4dff]' : 'border-black/20 dark:border-white/30'
                        }`}
                      >
                        {selected ? <span className="size-1.5 rounded-full bg-white" /> : null}
                      </span>
                    </span>
                    <span className="font-mono text-[15px] tracking-wide">{formatPan(card.number)}</span>
                    {meta ? <span className="text-xs text-black/55 dark:text-zinc-400">{meta}</span> : null}
                    {card.bank ? (
                      <span className="truncate text-xs text-black/45 dark:text-zinc-500">{card.bank}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {order ? (
            <SavedCardPay
              order={order}
              selectedId={selectedId}
              onComplete={onComplete}
              onError={onError}
            />
          ) : (
            <button type="button" className={btnAccent} disabled>
              Pay
            </button>
          )}
        </>
      ) : null}
    </>
  );
}

function SavedCardPay({
  order,
  selectedId,
  onComplete,
  onError,
}: {
  order: DemoOrder;
  selectedId: number | null;
  onComplete: (transaction: TransactionDetails) => void;
  onError: (message: string) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const saved = useSavedCardPayment({
    publicKey: publicKey(),
    orderPayload: order.payload,
    orderChecksum: order.checksum,
    onPaymentProcessing: setProcessing,
    onPaymentComplete: onComplete,
    onError: (error) => onError(errorText(error)),
  });

  return (
    <button
      type="button"
      className={btnAccent}
      disabled={saved == null || processing || selectedId == null}
      onClick={() => {
        if (selectedId == null) return;
        saved?.pay({ cardId: selectedId });
      }}
    >
      {processing ? 'Processing…' : 'Pay'}
    </button>
  );
}

function formatPan(number: string): string {
  const compact = number.replace(/\s/g, '');
  const leading = compact.match(/^\d+/)?.[0] ?? '';
  const trailing = compact.match(/\d+$/)?.[0] ?? '';
  const end = trailing.slice(-4);
  if (leading.length >= 6 && end) {
    return `${leading.slice(0, 4)} ${leading.slice(4, 6)}•• •••• ${end}`;
  }
  return end ? `•••• •••• •••• ${end}` : number;
}

function expiryLabel(card: SavedCard): string {
  if (!card.expiryMonth && !card.expiryYear) return '';
  const month = card.expiryMonth.padStart(2, '0');
  const year = card.expiryYear.length > 2 ? card.expiryYear.slice(-2) : card.expiryYear;
  return `Exp ${month}/${year}`;
}

function pretty(value: string | undefined): string {
  const text = value?.trim() ?? '';
  if (!text) return '';
  if (text !== text.toUpperCase()) return text;
  if (text.length <= 3) return text;
  return text.toLowerCase().replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

function BrandMark({ brand }: { brand: string }) {
  const key = brand.toLowerCase();
  const tone = key.includes('visa')
    ? 'bg-[#1a1f71] text-white'
    : key.includes('master')
      ? 'bg-[#eb001b] text-white'
      : key.includes('amex') || key.includes('american')
        ? 'bg-[#2e77bc] text-white'
        : key.includes('discover')
          ? 'bg-[#ff6000] text-white'
          : 'bg-[#7c4dff] text-white';
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide ${tone}`}>
      {brand.trim().slice(0, 12).toUpperCase() || 'CARD'}
    </span>
  );
}
