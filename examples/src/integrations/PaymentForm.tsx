import { PaymentForm as XPaymentForm, type TransactionDetails } from '@xmoney/react';
import { useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

export function PaymentForm({
  order,
  onComplete,
  onError,
}: {
  order: DemoOrder;
  onComplete: (transaction: TransactionDetails) => void;
  onError: (message: string) => void;
}) {
  const { mode } = useTheme();
  const [ready, setReady] = useState(false);

  return (
    <CheckoutSlot busy={!ready}>
      <XPaymentForm
        publicKey={publicKey()}
        orderPayload={order.payload}
        orderChecksum={order.checksum}
        options={{ appearance: sampleAppearance(mode) }}
        onReady={() => setReady(true)}
        onPaymentComplete={onComplete}
        onError={(error) => onError(errorText(error))}
      />
    </CheckoutSlot>
  );
}
