import type { TransactionDetails } from '@xmoney/react';
import { useState, type ReactNode } from 'react';
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { formatMajor, formatMoney } from '../lib/format';
import { card, chip, chipError, eyebrow, h1, h2, lead, muted } from '../ui';
import { WidgetShell } from './WidgetShell';

export type PaymentOutcome =
  | { kind: 'complete'; transaction: TransactionDetails }
  | { kind: 'error'; message: string };

export function CheckoutLayout({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-7 wide:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)]">
      <div className="min-w-0">{summary}</div>
      <div className="flex min-w-0 justify-center">
        <WidgetShell>{children}</WidgetShell>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className={h1}>{title}</h1>
        <p className={lead}>{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

export function OrderCard({
  amountMinor = SAMPLE_AMOUNT_MINOR,
  title = SAMPLE_DESCRIPTION,
  children,
}: {
  amountMinor?: number;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <section className={card}>
      <p className={eyebrow}>Order summary</p>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={h2}>{title}</h2>
          <p className={`mt-1 ${muted}`}>Qty 1</p>
        </div>
        <p className="shrink-0 font-semibold">{formatMoney(amountMinor)}</p>
      </div>
      <OrderTotals amountMinor={amountMinor} />
      {children}
    </section>
  );
}

export function OrderTotals({ amountMinor }: { amountMinor: number }) {
  const money = formatMoney(amountMinor);
  return (
    <div className="mt-4 space-y-2 border-t border-black/[0.08] pt-4 text-sm dark:border-white/12">
      <div className="flex justify-between gap-3">
        <span className={muted}>Subtotal</span>
        <span>{money}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className={muted}>Tax</span>
        <span className={`text-right text-xs ${muted}`}>Enter address to calculate</span>
      </div>
      <div className="flex items-baseline justify-between gap-3 border-t border-black/[0.08] pt-3 dark:border-white/12">
        <span className="font-semibold">Total due</span>
        <span className="text-[28px] leading-none font-bold tracking-[-0.03em]">{money}</span>
      </div>
    </div>
  );
}

export function StatusChip({ tone, children }: { tone: 'error' | 'neutral'; children: ReactNode }) {
  return <p className={tone === 'error' ? chipError : chip}>{children}</p>;
}

const STATUS_LABEL: Record<string, string> = {
  start: 'Started',
  'complete-ok': 'Completed',
  'cancel-ok': 'Cancelled',
  'refund-ok': 'Refunded',
  'void-ok': 'Voided',
  'charge-back': 'Chargeback',
  'charge-back-in-progress': 'Chargeback in progress',
  'complete-failed': 'Failed',
  'in-progress': 'In progress',
  '3d-pending': '3-D Secure pending',
  uncertain: 'Uncertain',
  reversed: 'Reversed',
};

const TRANSACTION_KEYS = new Set([
  'id',
  'transactionStatus',
  'amount',
  'currencyKey',
  'amountInEuro',
  'customerData',
  'externalOrderId',
  'description',
]);

const CUSTOMER_KEYS = new Set([
  'id',
  'siteId',
  'identifier',
  'firstName',
  'lastName',
  'country',
  'state',
  'city',
  'zipCode',
  'address',
  'phone',
  'email',
  'isWhitelisted',
  'isWhitelistedUntil',
  'creationDate',
  'creationTimestamp',
]);

export function ResultPanel({ outcome }: { outcome: PaymentOutcome }) {
  const [rawOpen, setRawOpen] = useState(false);
  const failed = outcome.kind === 'error';
  const transaction = outcome.kind === 'complete' ? outcome.transaction : undefined;
  const payload = recordOf(transaction);
  const customer = recordOf(payload.customerData);
  const status = text(payload.transactionStatus);
  const tone = outcomeTone(status, failed);
  const amount = money(payload.amount, payload.currencyKey);
  const paymentRows = failed ? errorRows(outcome.message) : paymentDetailRows(payload, customer);
  const customerRows = failed ? [] : customerDetailRows(customer);
  const extraRows = failed ? [] : unknownRows(payload, TRANSACTION_KEYS).concat(unknownRows(customer, CUSTOMER_KEYS, 'Customer'));

  return (
    <ResultCard
      tone={tone}
      title={outcomeTitle(status, failed)}
      subtitle={outcomeSubtitle(status, failed)}
      amount={failed ? '' : amount}
    >
      <DetailSection title="Payment" rows={paymentRows} />
      <DetailSection title="Customer" rows={customerRows} />
      <DetailSection title="Other" rows={extraRows} />
      {transaction ? (
        <div className="mt-4 border-t border-black/[0.08] pt-3 dark:border-white/12">
          <button
            type="button"
            className={`flex w-full cursor-pointer items-center justify-between text-sm font-semibold ${muted}`}
            aria-expanded={rawOpen}
            onClick={() => setRawOpen((open) => !open)}
          >
            <span>{rawOpen ? 'Hide raw response' : 'View raw response'}</span>
            <Chevron open={rawOpen} />
          </button>
          {rawOpen ? (
            <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-[#f4f3fb] p-3 text-[11px] leading-relaxed break-all whitespace-pre-wrap text-black/70 dark:bg-white/6 dark:text-zinc-300">
              {JSON.stringify(transaction, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </ResultCard>
  );
}

function paymentDetailRows(payload: Record<string, unknown>, customer: Record<string, unknown>): DetailRow[] {
  const rows: DetailRow[] = [];
  push(rows, 'Status', statusLabel(text(payload.transactionStatus)));
  push(rows, 'Amount', money(payload.amount, payload.currencyKey));
  push(rows, 'Currency', text(payload.currencyKey));
  push(rows, 'Amount in EUR', money(payload.amountInEuro, 'EUR'));
  push(rows, 'Transaction ID', payload.id == null || payload.id === '' ? '' : `#${payload.id}`, true);
  push(rows, 'Order ID', text(payload.externalOrderId) ? `#${text(payload.externalOrderId)}` : '', true);
  push(rows, 'Description', text(payload.description));
  push(rows, 'Date', formatWhen(customer.creationDate) || formatWhen(customer.creationTimestamp));
  return rows;
}

function customerDetailRows(customer: Record<string, unknown>): DetailRow[] {
  const rows: DetailRow[] = [];
  push(rows, 'Customer ID', text(customer.id), true);
  push(rows, 'Site', text(customer.siteId), true);
  push(rows, 'Identifier', text(customer.identifier), true);
  push(rows, 'First name', text(customer.firstName));
  push(rows, 'Last name', text(customer.lastName));
  push(rows, 'Email', text(customer.email));
  push(rows, 'Phone', text(customer.phone));
  push(rows, 'Country', text(customer.country));
  push(rows, 'State', text(customer.state));
  push(rows, 'City', text(customer.city));
  push(rows, 'Address', text(customer.address));
  push(rows, 'Postal code', text(customer.zipCode));
  push(rows, 'Whitelisted', yesNo(customer.isWhitelisted));
  push(rows, 'Whitelisted until', formatWhen(customer.isWhitelistedUntil));
  push(rows, 'Created', formatWhen(customer.creationTimestamp));
  return rows;
}

function errorRows(message: string): DetailRow[] {
  return [
    { label: 'Status', value: 'Failed' },
    { label: 'Message', value: message || 'Something went wrong' },
  ];
}

function unknownRows(source: Record<string, unknown>, known: Set<string>, prefix = ''): DetailRow[] {
  const rows: DetailRow[] = [];
  for (const [key, value] of Object.entries(source)) {
    if (known.has(key)) continue;
    const label = prefix ? `${prefix} ${labelFromKey(key)}` : labelFromKey(key);
    push(rows, label, displayValue(value));
  }
  return rows;
}

function outcomeTone(status: string, failed: boolean): ResultTone {
  if (failed || status === 'complete-failed' || status === 'cancel-ok' || status === 'charge-back' || status === 'reversed') {
    return 'error';
  }
  if (!status || status === 'complete-ok') return 'complete';
  return 'neutral';
}

function outcomeTitle(status: string, failed: boolean): string {
  if (failed || status === 'complete-failed') return 'Payment failed';
  if (!status || status === 'complete-ok') return 'Payment complete';
  return statusLabel(status);
}

function outcomeSubtitle(status: string, failed: boolean): string {
  if (failed) return 'Something went wrong. You can try again.';
  if (!status || status === 'complete-ok') return 'Your payment went through.';
  if (status === 'complete-failed') return 'The payment did not go through.';
  return 'The checkout returned this transaction.';
}

function statusLabel(status: string): string {
  if (!status) return 'Complete';
  return STATUS_LABEL[status] ?? status;
}

function money(amount: unknown, currency: unknown): string {
  const value = asAmount(amount);
  const code = text(currency);
  if (value == null) return text(amount);
  if (!code) return String(value);
  return formatMajor(value, code);
}

function asAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function yesNo(value: unknown): string {
  if (value === true || value === 1 || value === '1' || value === 'true') return 'Yes';
  if (value === false || value === 0 || value === '0' || value === 'false') return 'No';
  return '';
}

function formatWhen(value: unknown): string {
  if (value == null || value === '') return '';
  const date =
    typeof value === 'number' ? new Date(value > 1e12 ? value : value * 1000) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return text(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function displayValue(value: unknown): string {
  const plain = text(value);
  if (plain) return plain;
  const flag = yesNo(value);
  if (flag && typeof value === 'boolean') return flag;
  if (value == null || value === '') return '';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function labelFromKey(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function push(rows: DetailRow[], label: string, value: string, mono = false) {
  if (!value) return;
  rows.push({ label, value, mono });
}

function recordOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

type ResultTone = 'complete' | 'error' | 'neutral';

function ResultCard({
  tone,
  title,
  subtitle,
  amount,
  children,
}: {
  tone: ResultTone;
  title: string;
  subtitle: string;
  amount?: string;
  children: ReactNode;
}) {
  const wash =
    tone === 'error' ? 'bg-[#ff4757]/12' : tone === 'complete' ? 'bg-emerald-600/12' : 'bg-black/[0.04] dark:bg-white/6';
  return (
    <section className={card}>
      <div className={`rounded-2xl px-4 py-4 ${wash}`}>
        <div className="flex items-start gap-3">
          <ResultMark tone={tone} />
          <div className="min-w-0">
            <p className={eyebrow}>Result</p>
            <h2 className={h2}>{title}</h2>
            <p className={`mt-1 ${muted}`}>{subtitle}</p>
          </div>
        </div>
        {amount ? <p className="mt-4 text-[28px] leading-none font-bold tracking-[-0.03em]">{amount}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ResultMark({ tone }: { tone: ResultTone }) {
  const ink =
    tone === 'error'
      ? 'bg-[#ff4757] text-white'
      : tone === 'complete'
        ? 'bg-emerald-600 text-white'
        : 'bg-black/10 text-current dark:bg-white/12';
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${ink}`} aria-hidden="true">
      {tone === 'error' ? (
        <span className="text-xl leading-none font-bold">!</span>
      ) : tone === 'complete' ? (
        <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
          <path d="M4.5 10.5 8 14l7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <span className="text-sm font-bold">…</span>
      )}
    </span>
  );
}

function DetailSection({ title, rows }: { title: string; rows: DetailRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-5">
      <p className={eyebrow}>{title}</p>
      <DetailRows rows={rows} />
    </div>
  );
}

interface DetailRow {
  label: string;
  value: string;
  mono?: boolean;
}

function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="border-t border-black/[0.08] dark:border-white/12">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-3 border-b border-black/[0.08] py-2.5 last:border-b-0 dark:border-white/12"
        >
          <dt className={`shrink-0 ${muted}`}>{row.label}</dt>
          <dd className={`min-w-0 text-right font-semibold break-words ${row.mono ? 'font-mono text-xs break-all' : ''}`}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
