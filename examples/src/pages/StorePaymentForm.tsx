import {
  PaymentForm as XPaymentForm,
  type OrderUpdate,
  type OrderUpdateResult,
  type PaymentFormInstance,
  type TransactionDetails,
} from '@xmoney/react';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import type { OrderUpdater } from '../hooks/useLiveOrder';
import { appleAppearance, googleAppearance, sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

const NOT_READY: OrderUpdateResult = { success: false, error: 'NOT_READY' };

export const StorePaymentForm = forwardRef<
  OrderUpdater,
  {
    order: DemoOrder;
    onReady?: () => void;
    onComplete?: (transaction: TransactionDetails) => void;
    onError?: (message: string) => void;
  }
>(function StorePaymentForm(props, ref) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
  const formRef = useRef<PaymentFormInstance>(null);
  const orderKey = `${props.order.payload}:${props.order.checksum}`;
  const walletMode = useRef(mode);
  const seenOrder = useRef(orderKey);
  if (seenOrder.current !== orderKey) {
    seenOrder.current = orderKey;
    walletMode.current = mode;
  }
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    updateOrder: (next: OrderUpdate) => formRef.current?.updateOrder(next) ?? Promise.resolve(NOT_READY),
  }));

  return (
    <CheckoutSlot busy={readyKey !== orderKey}>
      <XPaymentForm
        ref={formRef}
        publicKey={publicKey()}
        orderPayload={props.order.payload}
        orderChecksum={props.order.checksum}
        paymentMethods={{
          applePay: { enabled: true, appearance: appleAppearance(walletMode.current) },
          googlePay: { enabled: true, appearance: googleAppearance(walletMode.current) },
        }}
        options={{ appearance }}
        onReady={() => {
          setReadyKey(orderKey);
          props.onReady?.();
        }}
        onPaymentComplete={props.onComplete}
        onError={(error) => props.onError?.(errorText(error))}
      />
    </CheckoutSlot>
  );
});
