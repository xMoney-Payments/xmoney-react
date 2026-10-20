export type CheckoutMethod = 'paymentForm' | 'paymentCard' | 'applePay' | 'googlePay';

export const CHECKOUT_METHODS: { id: CheckoutMethod; label: string }[] = [
  { id: 'paymentForm', label: 'Payment form' },
  { id: 'paymentCard', label: 'Payment card' },
  { id: 'applePay', label: 'Apple Pay' },
  { id: 'googlePay', label: 'Google Pay' },
];

function CardMark({ pay }: { pay: boolean }) {
  return (
    <svg viewBox="0 0 28 20" className="h-5 w-7" fill="none" aria-hidden="true">
      <rect x="1.25" y="1.25" width="25.5" height="17.5" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 7h25" stroke="currentColor" strokeWidth="1.5" />
      {pay ? (
        <rect x="16" y="12" width="8" height="3.5" rx="1.75" fill="currentColor" />
      ) : (
        <path d="M4.5 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function MethodIcon({ method }: { method: CheckoutMethod }) {
  if (method === 'applePay' || method === 'googlePay') {
    const src =
      method === 'applePay'
        ? '/assets/Apple_Pay_Mark_RGB_041619.svg'
        : '/assets/google-pay-mark_800.svg';
    return (
      <span className="flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden">
        <img src={src} alt="" aria-hidden="true" className="h-5 w-7 max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span className="flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden">
      <CardMark pay={method === 'paymentForm'} />
    </span>
  );
}

export function MethodSwitch({
  value,
  options,
  onChange,
}: {
  value: CheckoutMethod;
  options: CheckoutMethod[];
  onChange: (method: CheckoutMethod) => void;
}) {
  const columns = options.length > 2 ? 2 : options.length;

  return (
    <div
      className="grid w-full gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Checkout method"
    >
      {options.map((method) => {
        const label = CHECKOUT_METHODS.find((item) => item.id === method)?.label ?? method;
        const selected = value === method;
        return (
          <button
            key={method}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`flex min-h-12 min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-3 text-xs font-semibold whitespace-nowrap ${
              selected
                ? 'border-transparent bg-[#7c4dff]/12'
                : 'border-black/[0.08] bg-transparent dark:border-white/12'
            }`}
            onClick={() => onChange(method)}
          >
            <MethodIcon method={method} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function WalletUnavailable({ method }: { method: 'applePay' | 'googlePay' }) {
  const name = method === 'applePay' ? 'Apple Pay' : 'Google Pay';
  return (
    <div className="flex min-h-16 items-center gap-3 py-2">
      <MethodIcon method={method} />
      <span>
        <strong className="block">{name}</strong>
        <span className="block text-[13px] text-black/55 dark:text-zinc-400">
          Not available in this browser.
        </span>
      </span>
    </div>
  );
}
