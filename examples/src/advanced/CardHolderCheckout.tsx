import {
  MatchStatus,
  PaymentCard as XPaymentCard,
  PaymentForm as XPaymentForm,
  type CardHolderVerificationResult,
  type TransactionDetails,
} from '@xmoney/react';
import { useMemo, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { sampleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

interface CardHolderProps {
  order: DemoOrder;
  firstName: string;
  lastName: string;
  onResult?: (result: CardHolderVerificationResult) => void;
  onComplete?: (transaction: TransactionDetails) => void;
  onError?: (message: string) => void;
}

export function CardHolderForm({ order, firstName, lastName, onResult, onComplete, onError }: CardHolderProps) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
  const mountKey = `${firstName}|${lastName}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  return (
    <CheckoutSlot busy={readyKey !== mountKey}>
      <XPaymentForm
        publicKey={publicKey()}
        orderPayload={order.payload}
        orderChecksum={order.checksum}
        card={{
          cardHolderVerification: {
            name: { firstName, lastName },
            onCardHolderVerification: (result) => {
              onResult?.(result);
              return result.status === MatchStatus.Matched;
            },
          },
        }}
        options={{ appearance }}
        onReady={() => setReadyKey(mountKey)}
        onPaymentComplete={onComplete}
        onError={(error) => onError?.(errorText(error))}
      />
    </CheckoutSlot>
  );
}

export function CardHolderCard({ order, firstName, lastName, onResult, onComplete, onError }: CardHolderProps) {
  const { mode } = useTheme();
  const appearance = useMemo(() => sampleAppearance(mode), [mode]);
  const mountKey = `${firstName}|${lastName}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  return (
    <CheckoutSlot busy={readyKey !== mountKey}>
      <XPaymentCard
        publicKey={publicKey()}
        orderPayload={order.payload}
        orderChecksum={order.checksum}
        card={{
          submitButton: { visible: false },
          cardHolderVerification: {
            name: { firstName, lastName },
            onCardHolderVerification: (result) => {
              onResult?.(result);
              return result.status === MatchStatus.Matched;
            },
          },
        }}
        options={{ appearance }}
        onReady={() => setReadyKey(mountKey)}
        onPaymentComplete={onComplete}
        onError={(error) => onError?.(errorText(error))}
      />
    </CheckoutSlot>
  );
}
