import {
  PaymentCard as XPaymentCard,
  PaymentForm as XPaymentForm,
  type PaymentCardInstance,
  type PaymentFormInstance,
  type TransactionDetails,
} from '@xmoney/react';
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

export interface MerchantPayHandle {
  submit: () => void;
}

interface MerchantPayProps {
  order: DemoOrder;
  onReady?: () => void;
  onProcessing?: (processing: boolean) => void;
  onComplete?: (transaction: TransactionDetails) => void;
  onError?: (message: string) => void;
}

export const MerchantPayForm = forwardRef<MerchantPayHandle, MerchantPayProps>(function MerchantPayForm(
  props,
  ref,
) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
  const formRef = useRef<PaymentFormInstance>(null);
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.submit(),
  }));

  return (
    <CheckoutSlot busy={!ready}>
      <XPaymentForm
        ref={formRef}
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

export const MerchantPayCard = forwardRef<MerchantPayHandle, MerchantPayProps>(function MerchantPayCard(
  props,
  ref,
) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
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
