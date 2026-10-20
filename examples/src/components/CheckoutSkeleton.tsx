import type { ReactNode } from 'react';

const bar =
  'h-[52px] shrink-0 animate-pulse rounded-xl bg-[color-mix(in_srgb,currentColor_8%,transparent)]';

export function CheckoutSkeleton() {
  return (
    <div className="absolute inset-0 z-[1] flex flex-col gap-3 py-1" aria-hidden="true">
      <span className={bar} />
      <span className={bar} />
      <span className={`${bar} w-[62%]`} />
      <span className={`${bar} mt-2 rounded-full`} />
    </div>
  );
}

const pill =
  'block h-[52px] animate-pulse rounded-full bg-[color-mix(in_srgb,currentColor_8%,transparent)]';

export function ButtonSkeleton() {
  return (
    <div className="absolute inset-0 z-[1]" aria-hidden="true">
      <span className={pill} />
    </div>
  );
}

export function CheckoutPending({ kind = 'form' }: { kind?: 'form' | 'button' }) {
  if (kind === 'button') {
    return (
      <div className="relative h-[52px] overflow-hidden" aria-busy="true">
        <ButtonSkeleton />
      </div>
    );
  }

  return (
    <div className="relative h-[360px] overflow-hidden" aria-busy="true">
      <CheckoutSkeleton />
    </div>
  );
}

export function CheckoutSlot({
  busy,
  children,
  kind = 'form',
}: {
  busy: boolean;
  children?: ReactNode;
  kind?: 'form' | 'button';
}) {
  if (kind === 'button') {
    return (
      <div className={busy ? 'relative h-[52px] overflow-hidden' : 'relative'} aria-busy={busy}>
        {busy ? <ButtonSkeleton /> : null}
        <div className={busy ? 'checkout-slot h-[52px]' : 'checkout-slot'}>{children}</div>
      </div>
    );
  }

  return (
    <div className={busy ? 'relative h-[360px] overflow-hidden' : 'relative'} aria-busy={busy}>
      {busy ? <CheckoutSkeleton /> : null}
      <div className={busy ? 'checkout-slot invisible h-0 overflow-hidden' : 'checkout-slot'}>{children}</div>
    </div>
  );
}
