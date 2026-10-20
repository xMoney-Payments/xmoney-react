import { PaymentCard as XPaymentCard, type PaymentCardInstance, type TransactionDetails } from '@xmoney/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

export interface PaymentCardHandle {
  submit: () => void;
}

export const PaymentCard = forwardRef<
  PaymentCardHandle,
  {
    order: DemoOrder;
    onReady?: () => void;
    onProcessing?: (processing: boolean) => void;
    onComplete: (transaction: TransactionDetails) => void;
    onError: (message: string) => void;
  }
>(function PaymentCard({ order, onReady, onProcessing, onComplete, onError }, ref) {
  const { mode } = useTheme();
  const cardRef = useRef<PaymentCardInstance>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: () => cardRef.current?.submit(),
  }));

  return (
    <CheckoutSlot busy={!ready}>
      <XPaymentCard
        ref={cardRef}
        publicKey={publicKey()}
        orderPayload={order.payload}
        orderChecksum={order.checksum}
        card={{ submitButton: { visible: false } }}
        options={{ appearance: sampleAppearance(mode) }}
        onReady={() => {
          setReady(true);
          onReady?.();
        }}
        onPaymentProcessing={onProcessing}
        onPaymentComplete={onComplete}
        onError={(error) => onError(errorText(error))}
      />
    </CheckoutSlot>
  );
});
