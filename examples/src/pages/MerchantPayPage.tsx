import { useEffect, useRef, useState } from 'react';
import { MerchantPayCard, MerchantPayForm, type MerchantPayHandle } from '../advanced/MerchantPayCheckout';
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
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { btnAccent, btnSecondary, page } from '../ui';

const METHODS: CheckoutMethod[] = ['paymentForm', 'paymentCard'];

export function MerchantPayPage() {
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const payRef = useRef<MerchantPayHandle>(null);
  const [method, setMethod] = useState<CheckoutMethod>('paymentForm');
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);

  useEffect(() => {
    setReady(false);
  }, [method, sample.order]);

  function restart() {
    setOutcome(null);
    setReady(false);
    setProcessing(false);
    sample.reload();
  }

  return (
    <div className={page}>
      <PageHeader
        title="Merchant Pay button"
        subtitle="The SDK stays visible with its Pay button hidden. This page calls submit()."
        action={<TestCardsButton />}
      />
      <CheckoutLayout
        summary={<OrderCard />}
        children={
          <div className="flex flex-col gap-4">
            <MethodSwitch
              value={method}
              options={METHODS}
              onChange={(next) => {
                setOutcome(null);
                setReady(false);
                setProcessing(false);
                setMethod(next);
              }}
            />
            {sample.loading && !sample.order ? <CheckoutPending /> : null}
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {sample.order && !outcome && method === 'paymentForm' ? (
              <MerchantPayForm
                ref={payRef}
                order={sample.order}
                onReady={() => setReady(true)}
                onProcessing={setProcessing}
                onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {sample.order && !outcome && method === 'paymentCard' ? (
              <MerchantPayCard
                ref={payRef}
                order={sample.order}
                onReady={() => setReady(true)}
                onProcessing={setProcessing}
                onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {sample.order && !outcome ? (
              <button
                type="button"
                className={btnAccent}
                disabled={!ready || processing}
                onClick={() => payRef.current?.submit()}
              >
                {processing ? 'Processing…' : 'Pay'}
              </button>
            ) : null}
            {outcome ? (
              <>
                <ResultPanel outcome={outcome} />
                <button type="button" className={btnSecondary} onClick={restart}>
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
