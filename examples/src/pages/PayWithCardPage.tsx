import { useState } from 'react';
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
import { SavedCardPayment } from '../integrations/SavedCardPayment';
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { btnSecondary, page } from '../ui';

export function PayWithCardPage() {
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);

  function restart() {
    setOutcome(null);
    sample.reload();
  }

  return (
    <div className={page}>
      <PageHeader
        title="Pay with card"
        subtitle="savedCardPayment has no iframe. This page draws the cards and calls pay()."
        action={<TestCardsButton />}
      />
      <CheckoutLayout
        summary={<OrderCard />}
        children={
          <>
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {!outcome ? (
              <SavedCardPayment
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
