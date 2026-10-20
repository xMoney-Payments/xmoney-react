import { useEffect, useRef, useState } from 'react';
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
import { PaymentCard, type PaymentCardHandle } from '../integrations/PaymentCard';
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { btnAccent, btnSecondary, page } from '../ui';

export function EmbeddedCheckout() {
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const cardRef = useRef<PaymentCardHandle>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);

  useEffect(() => {
    setReady(false);
  }, [sample.order]);

  function restart() {
    setOutcome(null);
    setReady(false);
    setProcessing(false);
    sample.reload();
  }

  return (
    <div className={page}>
      <PageHeader
        title="Payment Card"
        subtitle="paymentCard in your layout, with the default order. This page calls submit()."
        action={<TestCardsButton />}
      />
      <CheckoutLayout
        summary={<OrderCard />}
        children={
          <>
            {sample.loading && !sample.order ? <CheckoutPending /> : null}
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {sample.order && !outcome ? (
              <>
                <PaymentCard
                  ref={cardRef}
                  order={sample.order}
                  onReady={() => setReady(true)}
                  onProcessing={setProcessing}
                  onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                  onError={(message) => setOutcome({ kind: 'error', message })}
                />
                <button
                  type="button"
                  className={btnAccent}
                  disabled={!ready || processing}
                  onClick={() => cardRef.current?.submit()}
                >
                  {processing ? 'Processing…' : 'Pay'}
                </button>
              </>
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
