import { useEffect, useState } from 'react';
import { TEST_CARDS, testCardLine, type TestCard } from '../lib/test-cards';
import { backdrop, btnGhost, chip, dialog, dialogHead } from '../ui';

export function TestCardsButton({ nameCheckHint = false }: { nameCheckHint?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={btnGhost} onClick={() => setOpen(true)}>
        Test cards
      </button>
      {open ? (
        <TestCardsDialog nameCheckHint={nameCheckHint} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function TestCardsDialog({
  nameCheckHint,
  onClose,
}: {
  nameCheckHint: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(id);
  }

  return (
    <div className={backdrop} onClick={onClose} role="presentation">
      <div
        className={`${dialog} flex max-h-[min(760px,calc(100dvh-4rem))] max-w-[820px] flex-col overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-cards-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={`${dialogHead} shrink-0`}>
          <div>
            <h2 id="test-cards-title" className="text-lg font-bold tracking-[-0.02em]">
              Test cards
            </h2>
            <p className="mt-1 text-sm text-black/55 dark:text-zinc-400">
              Sandbox Visa and Mastercard numbers. Tap a field to copy it.
            </p>
          </div>
          <button type="button" className={btnGhost} onClick={onClose}>
            Close
          </button>
        </header>
        {nameCheckHint ? (
          <p className={`${chip} shrink-0`}>This sample pays only when the cardholder name matches John Doe.</p>
        ) : null}
        <div className="max-h-[min(34rem,calc(100dvh-12rem))] overflow-y-auto overscroll-contain pr-1">
          <div className="grid grid-cols-1 gap-4 wide:grid-cols-2">
            {TEST_CARDS.map((card) => (
              <TestCardFace key={card.id} card={card} copied={copied} onCopy={copy} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TestCardFace({
  card,
  copied,
  onCopy,
}: {
  card: TestCard;
  copied: string | null;
  onCopy: (id: string, value: string) => void;
}) {
  const visa = card.brand === 'Visa';
  const logo = visa ? '/assets/visa-logo.svg' : '/assets/mastercard-logo.svg';
  const face = visa
    ? 'bg-[linear-gradient(145deg,#071433_0%,#16357a_46%,#4a62b8_100%)]'
    : 'bg-[linear-gradient(145deg,#1a1012_0%,#5c1c24_48%,#a34a22_100%)]';

  return (
    <article className="overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_12px_28px_rgba(22,20,26,0.08)] dark:border-white/10 dark:bg-[#121214] dark:shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
      <div className={`relative overflow-hidden px-5 pt-5 pb-4 text-white ${face}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(255,255,255,0.2),transparent_58%)]" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-black/25" />
        <header className="relative flex items-center justify-between gap-3">
          <CardChip />
          <span className="grid h-8 place-items-center rounded-lg bg-white px-2">
            <img src={logo} alt={card.brand} className="h-[18px] w-auto" />
          </span>
        </header>
        <CopyValue
          id={`${card.id}-pan`}
          label="Copy card number"
          caption="Card number"
          copied={copied}
          value={card.pan}
          className="relative mt-6 font-mono text-[17px] tracking-[0.14em]"
          onCopy={onCopy}
        />
        <div className="relative mt-5 flex items-end justify-between gap-3">
          <div className="flex gap-6">
            <CopyValue
              id={`${card.id}-expiry`}
              label="Copy expiry"
              caption="Expiry"
              copied={copied}
              value={card.expiry}
              onCopy={onCopy}
            />
            <CopyValue
              id={`${card.id}-cvv`}
              label="Copy CVV"
              caption="CVV"
              copied={copied}
              value={card.cvv}
              onCopy={onCopy}
            />
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.18)] ${
              card.success ? 'bg-emerald-300 text-emerald-950' : 'bg-red-400 text-red-950'
            }`}
          >
            {card.success ? 'Approved' : 'Declined'}
          </span>
        </div>
      </div>
      <div className="grid gap-3 px-4 py-3.5">
        <div className="flex flex-wrap gap-1.5">
          <Meta>{card.brand}</Meta>
          <Meta>3DS2</Meta>
          <Meta>{card.flow}</Meta>
        </div>
        <p className="text-[13px] leading-5 text-black/60 dark:text-zinc-400">{card.detail}</p>
        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
          <dt className="text-black/45 dark:text-zinc-500">Outcome</dt>
          <dd className="font-semibold">{card.status}</dd>
          <dt className="text-black/45 dark:text-zinc-500">3DS code</dt>
          <dd>
            <CopyValue
              id={`${card.id}-threeDS`}
              label="Copy 3DS code"
              copied={copied}
              value={card.threeDS}
              className="font-mono tracking-[0.08em]"
              onCopy={onCopy}
            />
          </dd>
        </dl>
        <button
          type="button"
          className="justify-self-start text-[13px] font-semibold text-[#5b35d5] dark:text-[#c4b5fd]"
          onClick={() => onCopy(`${card.id}-all`, testCardLine(card))}
        >
          {copied === `${card.id}-all` ? 'Copied number, expiry, CVV, and 3DS' : 'Copy all fields'}
        </button>
      </div>
    </article>
  );
}

function Meta({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#f4f3fb] px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-black/60 uppercase dark:bg-white/8 dark:text-zinc-300">
      {children}
    </span>
  );
}

function CardChip() {
  return (
    <span
      className="grid h-8 w-11 grid-cols-2 overflow-hidden rounded-md bg-gradient-to-br from-[#f6e7b2] to-[#b8923e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]"
      aria-hidden="true"
    >
      <span className="border-r border-b border-black/25" />
      <span className="border-b border-black/25" />
      <span className="border-r border-black/25" />
      <span />
    </span>
  );
}

function CopyValue({
  id,
  label,
  caption,
  value,
  copied,
  className,
  onCopy,
}: {
  id: string;
  label: string;
  caption?: string;
  value: string;
  copied: string | null;
  className?: string;
  onCopy: (id: string, value: string) => void;
}) {
  const justCopied = copied === id;
  return (
    <button type="button" className={`grid text-left ${className ?? ''}`} aria-label={label} onClick={() => onCopy(id, value)}>
      {caption || justCopied ? (
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase opacity-70">
          {justCopied ? 'Copied' : caption}
        </span>
      ) : null}
      <strong className="font-semibold">{value}</strong>
    </button>
  );
}
