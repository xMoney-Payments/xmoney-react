import {
  MatchStatus,
  PaymentForm as XPaymentForm,
  type Appearance,
  type CardHolderVerificationResult,
  type CardInputGrouping,
  type FormButtonType,
  type Locale,
  type OrderUpdateResult,
  type PaymentFormInstance,
  type TransactionDetails,
  type ValidationMode,
} from '@xmoney/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { appleAppearance, googleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';

export interface PlaygroundHandle {
  submit: () => void;
  updateOrder: (order: { orderPayload: string; orderChecksum: string }) => Promise<{
    success: boolean;
    error?: string;
  }>;
  updateAppearance: (appearance: Appearance) => void;
  updateLocale: (locale: Locale) => void;
}

export interface PlaygroundFormProps {
  order: DemoOrder;
  appearance: Appearance;
  mode: 'light' | 'dark';
  locale?: Locale;
  wallets?: boolean;
  applePay?: boolean;
  googlePay?: boolean;
  submitVisible?: boolean;
  submitType?: FormButtonType;
  grouping?: CardInputGrouping;
  validationMode?: ValidationMode;
  savedCards?: boolean;
  savedCardOptIn?: boolean;
  collectOnCard?: boolean;
  collectOnApplePay?: boolean;
  collectOnGooglePay?: boolean;
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

export const PlaygroundForm = forwardRef<PlaygroundHandle, PlaygroundFormProps>(function PlaygroundForm(props, ref) {
  const {
    order,
    appearance,
    mode,
    locale = 'en-US',
    wallets = true,
    applePay,
    googlePay,
    submitVisible = true,
    submitType = 'pay',
    grouping = 'spaced',
    validationMode = 'onChange',
    savedCards = true,
    savedCardOptIn = true,
    collectOnCard = false,
    collectOnApplePay = false,
    collectOnGooglePay = false,
    verify,
    onReady,
    onProcessing,
    onComplete,
    onError,
  } = props;
  const appleEnabled = applePay ?? wallets;
  const googleEnabled = googlePay ?? wallets;
  const formRef = useRef<PaymentFormInstance>(null);
  const verifyKey = verify ? `${verify.firstName}|${verify.lastName}` : '';
  const remountKey = [
    appleEnabled,
    googleEnabled,
    submitVisible,
    submitType,
    grouping,
    validationMode,
    savedCards,
    savedCardOptIn,
    collectOnCard,
    collectOnApplePay,
    collectOnGooglePay,
    verifyKey,
  ].join('|');
  const walletMode = useRef(mode);
  const seenKey = useRef(remountKey);
  if (seenKey.current !== remountKey) {
    seenKey.current = remountKey;
    walletMode.current = mode;
  }
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.submit(),
    updateAppearance: (next) => formRef.current?.updateAppearance(next),
    updateLocale: (next) => formRef.current?.updateLocale(next),
    updateOrder: (next) => formRef.current?.updateOrder(next) ?? Promise.resolve(NOT_READY),
  }));

  return (
    <CheckoutSlot busy={readyKey !== remountKey}>
      <XPaymentForm
        ref={formRef}
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
        {...(collectOnCard || collectOnApplePay || collectOnGooglePay
          ? {
              customerDetails: {
                ...(collectOnCard ? { card: true as const } : {}),
                ...(collectOnApplePay ? { applePay: true as const } : {}),
                ...(collectOnGooglePay ? { googlePay: true as const } : {}),
              },
            }
          : {})}
        paymentMethods={{
          applePay: { enabled: appleEnabled, appearance: appleAppearance(walletMode.current) },
          googlePay: { enabled: googleEnabled, appearance: googleAppearance(walletMode.current) },
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
