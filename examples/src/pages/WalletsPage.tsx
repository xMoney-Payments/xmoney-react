import { useState } from 'react';
import { CheckoutPending } from '../components/CheckoutSkeleton';
import { MethodSwitch, type CheckoutMethod } from '../components/MethodSwitch';
import {
  CheckoutLayout,
  OrderCard,
  PageHeader,
  ResultPanel,
  StatusChip,
  type PaymentOutcome,
} from '../components/SampleChrome';
import { TestCardsButton } from '../components/TestCardsDialog';
import { useSampleOrder } from '../hooks/useSampleOrder';
import { ApplePay } from '../integrations/ApplePay';
import { GooglePay } from '../integrations/GooglePay';
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { btnSecondary, page } from '../ui';

export function WalletsPage() {
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const [method, setMethod] = useState<CheckoutMethod>('applePay');
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);
  const wallet = method === 'googlePay' ? 'googlePay' : 'applePay';

  return (
    <div className={page}>
      <PageHeader
        title="Wallets"
        subtitle="One wallet at a time. applePay or googlePay, with the default button."
        action={<TestCardsButton />}
      />
      <CheckoutLayout
        summary={<OrderCard />}
        children={
          <div className="flex flex-col gap-4">
            <MethodSwitch
              value={wallet}
              options={['applePay', 'googlePay']}
              onChange={(next) => {
                setOutcome(null);
                setMethod(next);
              }}
            />
            {sample.loading && !sample.order ? <CheckoutPending kind="button" /> : null}
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {sample.order && !outcome && wallet === 'applePay' ? (
              <ApplePay
                order={sample.order}
                onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {sample.order && !outcome && wallet === 'googlePay' ? (
              <GooglePay
                order={sample.order}
                onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {outcome ? (
              <>
                <ResultPanel outcome={outcome} />
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setOutcome(null);
                    sample.reload();
                  }}
                >
                  New payment
                </button>
              </>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
