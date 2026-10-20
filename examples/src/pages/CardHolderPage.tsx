import { MatchStatus, type CardHolderVerificationResult } from '@xmoney/react';
import { useState } from 'react';
import { CardHolderCard, CardHolderForm } from '../advanced/CardHolderCheckout';
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
import { btnSecondary, muted, page } from '../ui';

const EXPECTED = { firstName: 'John', lastName: 'Doe' };
const METHODS: CheckoutMethod[] = ['paymentForm', 'paymentCard'];

export function CardHolderPage() {
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const [method, setMethod] = useState<CheckoutMethod>('paymentForm');
  const [match, setMatch] = useState<CardHolderVerificationResult | null>(null);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);

  function restart() {
    setOutcome(null);
    setMatch(null);
    sample.reload();
  }

  return (
    <div className={page}>
      <PageHeader
        title="Card holder verification"
        subtitle="Pay continues only when account validation matches John Doe."
        action={<TestCardsButton nameCheckHint />}
      />
      <CheckoutLayout
        summary={
          <OrderCard>
            <p className={muted}>Expected name</p>
            <p className="my-1 text-[22px] font-bold">John Doe</p>
            <p className={muted}>
              Return true from onCardHolderVerification only for {MatchStatus.Matched}. Any other status blocks pay.
            </p>
          </OrderCard>
        }
        children={
          <div className="flex flex-col gap-4">
            <MethodSwitch
              value={method}
              options={METHODS}
              onChange={(next) => {
                setOutcome(null);
                setMatch(null);
                setMethod(next);
              }}
            />
            {sample.loading && !sample.order ? <CheckoutPending /> : null}
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {match ? <StatusChip tone="neutral">Verification: {match.status}</StatusChip> : null}
            {sample.order && !outcome && method === 'paymentForm' ? (
              <CardHolderForm
                order={sample.order}
                firstName={EXPECTED.firstName}
                lastName={EXPECTED.lastName}
                onResult={setMatch}
                onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {sample.order && !outcome && method === 'paymentCard' ? (
              <CardHolderCard
                order={sample.order}
                firstName={EXPECTED.firstName}
                lastName={EXPECTED.lastName}
                onResult={setMatch}
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
          </div>
        }
      />
    </div>
  );
}
