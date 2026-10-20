import {
  ApplePay as XApplePay,
  GooglePay as XGooglePay,
  PaymentCard as XPaymentCard,
  PaymentForm as XPaymentForm,
  usePaymentMethodCapabilities,
  type ApplePayInstance,
  type GooglePayInstance,
  type OrderUpdate,
  type OrderUpdateResult,
  type PaymentCardInstance,
  type PaymentFormInstance,
  type TransactionDetails,
} from '@xmoney/react';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { WalletUnavailable } from '../components/MethodSwitch';
import { StatusChip } from '../components/SampleChrome';
import type { OrderUpdater } from '../hooks/useLiveOrder';
import { appleAppearance, googleAppearance, sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

interface CheckoutProps {
  order: DemoOrder;
  onReady?: () => void;
  onProcessing?: (processing: boolean) => void;
  onComplete?: (transaction: TransactionDetails) => void;
  onError?: (message: string) => void;
}

const NOT_READY: OrderUpdateResult = { success: false, error: 'NOT_READY' };

export const UpdateOrderForm = forwardRef<OrderUpdater, CheckoutProps>(function UpdateOrderForm(props, ref) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
  const formRef = useRef<PaymentFormInstance>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    updateOrder: (next: OrderUpdate) => formRef.current?.updateOrder(next) ?? Promise.resolve(NOT_READY),
  }));

  return (
    <CheckoutSlot busy={!ready}>
      <XPaymentForm
        ref={formRef}
        publicKey={publicKey()}
        orderPayload={props.order.payload}
        orderChecksum={props.order.checksum}
        options={{ appearance }}
        onReady={() => {
          setReady(true);
          props.onReady?.();
        }}
        onPaymentProcessing={props.onProcessing}
        onPaymentComplete={props.onComplete}
        onError={(error) => props.onError?.(errorText(error))}
      />
    </CheckoutSlot>
  );
});

export const UpdateOrderCard = forwardRef<OrderUpdater, CheckoutProps>(function UpdateOrderCard(props, ref) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
  const cardRef = useRef<PaymentCardInstance>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    updateOrder: (next: OrderUpdate) => cardRef.current?.updateOrder(next) ?? Promise.resolve(NOT_READY),
  }));

  return (
    <CheckoutSlot busy={!ready}>
      <XPaymentCard
        ref={cardRef}
        publicKey={publicKey()}
        orderPayload={props.order.payload}
        orderChecksum={props.order.checksum}
        card={{ submitButton: { visible: false } }}
        options={{ appearance }}
        onReady={() => {
          setReady(true);
          props.onReady?.();
        }}
        onPaymentProcessing={props.onProcessing}
        onPaymentComplete={props.onComplete}
        onError={(error) => props.onError?.(errorText(error))}
      />
    </CheckoutSlot>
  );
});

export const UpdateOrderWallet = forwardRef<
  OrderUpdater,
  CheckoutProps & { method: 'applePay' | 'googlePay' }
>(function UpdateOrderWallet({ method, order, onReady, onComplete, onError }, ref) {
  const { mode } = useTheme();
  const { capabilities, loading, error } = usePaymentMethodCapabilities();
  const supported = method === 'applePay' ? capabilities?.applePay.supported : capabilities?.googlePay.supported;
  const appleRef = useRef<ApplePayInstance>(null);
  const googleRef = useRef<GooglePayInstance>(null);
  const mountKey = `${method}|${mode}|${order.payload}|${order.checksum}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    updateOrder: (next: OrderUpdate) => {
      const wallet = method === 'applePay' ? appleRef.current : googleRef.current;
      return wallet?.updateOrder(next) ?? Promise.resolve(NOT_READY);
    },
  }));

  if (error) return <StatusChip tone="error">{errorText(error)}</StatusChip>;
  if (supported === false) return <WalletUnavailable method={method} />;

  const shared = {
    publicKey: publicKey(),
    orderPayload: order.payload,
    orderChecksum: order.checksum,
    onReady: () => {
      setReadyKey(mountKey);
      onReady?.();
    },
    onPaymentComplete: onComplete,
    onError: (cause: unknown) => onError?.(errorText(cause)),
  };

  return (
    <CheckoutSlot kind="button" busy={loading || supported !== true || readyKey !== mountKey}>
      {supported && method === 'applePay' ? (
        <XApplePay ref={appleRef} {...shared} options={{ appearance: appleAppearance(mode) }} />
      ) : null}
      {supported && method === 'googlePay' ? (
        <XGooglePay ref={googleRef} {...shared} options={{ appearance: googleAppearance(mode) }} />
      ) : null}
    </CheckoutSlot>
  );
});
