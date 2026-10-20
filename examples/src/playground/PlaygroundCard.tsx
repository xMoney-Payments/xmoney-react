import {
  MatchStatus,
  PaymentCard as XPaymentCard,
  type Appearance,
  type CardHolderVerificationResult,
  type CardInputGrouping,
  type FormButtonType,
  type Locale,
  type OrderUpdateResult,
  type PaymentCardInstance,
  type TransactionDetails,
  type ValidationMode,
} from '@xmoney/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import type { PlaygroundHandle } from './PlaygroundForm';

export interface PlaygroundCardProps {
  order: DemoOrder;
  appearance: Appearance;
  locale?: Locale;
  submitVisible?: boolean;
  submitType?: FormButtonType;
  grouping?: CardInputGrouping;
  validationMode?: ValidationMode;
  savedCards?: boolean;
  savedCardOptIn?: boolean;
  verify?: {
    firstName: string;
    lastName: string;
    onResult?: (result: CardHolderVerificationResult) => void;
  };
  onReady?: () => void;
  onProcessing?: (processing: boolean) => void;
  onComplete?: (transaction: TransactionDetails) => void;
  onError?: (message: string) => void;
}

const NOT_READY: OrderUpdateResult = { success: false, error: 'NOT_READY' };

export const PlaygroundCard = forwardRef<PlaygroundHandle, PlaygroundCardProps>(function PlaygroundCard(props, ref) {
  const {
    order,
    appearance,
    locale = 'en-US',
    submitVisible = false,
    submitType = 'pay',
    grouping = 'spaced',
    validationMode = 'onChange',
    savedCards = true,
    savedCardOptIn = true,
    verify,
    onReady,
    onProcessing,
    onComplete,
    onError,
  } = props;
  const cardRef = useRef<PaymentCardInstance>(null);
  const verifyKey = verify ? `${verify.firstName}|${verify.lastName}` : '';
  const remountKey = [
    submitVisible,
    submitType,
    grouping,
    validationMode,
    savedCards,
    savedCardOptIn,
    verifyKey,
  ].join('|');
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    submit: () => cardRef.current?.submit(),
    updateAppearance: (next) => cardRef.current?.updateAppearance(next),
    updateLocale: (next) => cardRef.current?.updateLocale(next),
    updateOrder: (next) => cardRef.current?.updateOrder(next) ?? Promise.resolve(NOT_READY),
  }));

  return (
    <CheckoutSlot busy={readyKey !== remountKey}>
      <XPaymentCard
        ref={cardRef}
        publicKey={publicKey()}
        orderPayload={order.payload}
        orderChecksum={order.checksum}
        card={{
          validationMode,
          savedCards: { enabled: savedCards, optInVisible: savedCardOptIn },
          submitButton: { visible: submitVisible, type: submitType },
          inputs: { grouping },
          ...(verify
            ? {
                cardHolderVerification: {
                  name: { firstName: verify.firstName, lastName: verify.lastName },
                  onCardHolderVerification: (result) => {
                    verify.onResult?.(result);
                    return result.status === MatchStatus.Matched;
                  },
                },
              }
            : {}),
        }}
        options={{ locale, appearance }}
        onReady={() => {
          setReadyKey(remountKey);
          onReady?.();
        }}
        onPaymentProcessing={onProcessing}
        onPaymentComplete={onComplete}
        onError={(error) => onError?.(errorText(error))}
      />
    </CheckoutSlot>
  );
});
