import { useEffect, useState } from 'react';
import { UpdateOrderCard, UpdateOrderForm, UpdateOrderWallet } from '../advanced/UpdateOrderCheckout';
import { CheckoutPending } from '../components/CheckoutSkeleton';
import { MethodSwitch, type CheckoutMethod } from '../components/MethodSwitch';
import {
  CheckoutLayout,
  OrderTotals,
  PageHeader,
  ResultPanel,
  StatusChip,
  type PaymentOutcome,
} from '../components/SampleChrome';
import { TestCardsButton } from '../components/TestCardsDialog';
import { useLiveOrder } from '../hooks/useLiveOrder';
import { AMOUNT_MIN_MINOR, AMOUNT_STEP_MINOR, SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { formatMoney } from '../lib/format';
import { btnSecondary, card, eyebrow, h2, muted, page, payBlocker, payWrap, price, qty, qtyBtn } from '../ui';

const METHODS: CheckoutMethod[] = ['paymentForm', 'paymentCard', 'applePay', 'googlePay'];

export function UpdateOrderPage() {
  const [method, setMethod] = useState<CheckoutMethod>('paymentForm');
  const [amount, setAmount] = useState(SAMPLE_AMOUNT_MINOR);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const wallet = method === 'applePay' || method === 'googlePay';
  const live = useLiveOrder(outcome ? 0 : amount, SAMPLE_DESCRIPTION, method);

  useEffect(() => setReady(false), [live.mountOrder, method]);

  const stepperEnabled = ready && !processing && !live.updating && !outcome;

  return (
    <div className={page}>
      <PageHeader
        title="Update order"
        subtitle="Change the amount. The page creates a new order, then updateOrder() on the mounted checkout."
        action={<TestCardsButton />}
      />
      <CheckoutLayout
        summary={
          <section className={card}>
            <p className={eyebrow}>Order summary</p>
            <h2 className={h2}>{SAMPLE_DESCRIPTION}</h2>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={price}>{formatMoney(amount)}</p>
              <div className={qty}>
                <button
                  type="button"
                  className={qtyBtn}
                  disabled={!stepperEnabled || amount <= AMOUNT_MIN_MINOR}
                  onClick={() => setAmount((value) => Math.max(AMOUNT_MIN_MINOR, value - AMOUNT_STEP_MINOR))}
                  aria-label="Decrease amount"
                >
                  −
                </button>
                <span className="min-w-6 text-center text-[13px] font-semibold">{formatMoney(AMOUNT_STEP_MINOR)}</span>
                <button
                  type="button"
                  className={qtyBtn}
                  disabled={!stepperEnabled}
                  onClick={() => setAmount((value) => value + AMOUNT_STEP_MINOR)}
                  aria-label="Increase amount"
                >
                  +
                </button>
              </div>
            </div>
            <OrderTotals amountMinor={amount} />
            {live.updating ? <p className={muted}>Updating order… Pay is covered until it finishes.</p> : null}
          </section>
        }
        children={
          outcome ? (
            <>
              <ResultPanel outcome={outcome} />
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setOutcome(null);
                  setProcessing(false);
                  setAmount(SAMPLE_AMOUNT_MINOR);
                }}
              >
                New payment
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <MethodSwitch
                value={method}
                options={METHODS}
                onChange={(next) => {
                  setReady(false);
                  setProcessing(false);
                  setMethod(next);
                }}
              />
              <div className={payWrap}>
                {live.preparing && !live.mountOrder ? (
                  <CheckoutPending kind={wallet ? 'button' : 'form'} />
                ) : null}
                {live.error ? <StatusChip tone="error">{live.error}</StatusChip> : null}
                {live.mountOrder && method === 'paymentForm' ? (
                  <>
                    {live.updating ? <div className={payBlocker} aria-hidden="true" /> : null}
                    <UpdateOrderForm
                      ref={live.formRef}
                      order={live.mountOrder}
                      onReady={() => setReady(true)}
                      onProcessing={setProcessing}
                      onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                      onError={(message) => setOutcome({ kind: 'error', message })}
                    />
                  </>
                ) : null}
                {live.mountOrder && method === 'paymentCard' ? (
                  <>
                    {live.updating ? <div className={payBlocker} aria-hidden="true" /> : null}
                    <UpdateOrderCard
                      ref={live.formRef}
                      order={live.mountOrder}
                      onReady={() => setReady(true)}
                      onProcessing={setProcessing}
                      onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                      onError={(message) => setOutcome({ kind: 'error', message })}
                    />
                  </>
                ) : null}
                {live.mountOrder && (method === 'applePay' || method === 'googlePay') ? (
                  <>
                    {live.updating ? <div className={payBlocker} aria-hidden="true" /> : null}
                    <UpdateOrderWallet
                      ref={live.formRef}
                      method={method}
                      order={live.mountOrder}
                      onReady={() => setReady(true)}
                      onComplete={(transaction) => setOutcome({ kind: 'complete', transaction })}
                      onError={(message) => setOutcome({ kind: 'error', message })}
                    />
                  </>
                ) : null}
              </div>
            </div>
          )
        }
      />
    </div>
  );
}
