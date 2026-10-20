import { useState } from 'react';
import { CheckoutPending } from '../components/CheckoutSkeleton';
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
import { PaymentForm } from '../integrations/PaymentForm';
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { btnSecondary, page } from '../ui';

export function CheckoutSample() {
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);

  function restart() {
    setOutcome(null);
    sample.reload();
  }

  return (
    <div className={page}>
      <PageHeader
        title="Payment form"
        subtitle="Drop-in paymentForm. The SDK renders the card fields and Pay button."
        action={<TestCardsButton />}
      />
      <CheckoutLayout
        summary={<OrderCard />}
        children={
          <>
            {sample.loading && !sample.order ? <CheckoutPending /> : null}
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {sample.order && !outcome ? (
              <PaymentForm
                order={sample.order}
                onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {outcome ? (
              <>
                <ResultPanel outcome={outcome} />
                <button type="button" className={btnSecondary} onClick={restart}>
                  New payment
                </button>
              </>
            ) : null}
          </>
        }
      />
    </div>
  );
}
