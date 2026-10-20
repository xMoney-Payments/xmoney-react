import type {
  CardConfig,
  CardHolderVerificationResult,
  PaymentChangeEvent,
  TransactionDetails,
  ValidationEvent,
  XMoneyError,
} from '@xmoney/xmoney-js';
import type { MutableRefObject } from 'react';

export interface HostCallbacks {
  onReady?: () => void;
  onError?: (error: XMoneyError) => void;
  onValidation?: (event: ValidationEvent) => void;
  onPaymentChange?: (event: PaymentChangeEvent) => void;
  onPaymentComplete?: (transaction: TransactionDetails) => void;
  onPaymentProcessing?: (isProcessing: boolean) => void;
  card?: CardConfig;
}

/**
 * SDK callbacks are registered once, at init. Read the latest props from a ref
 * so a parent re-render does not remount the iframe.
 */
export function bindHostCallbacks<T extends HostCallbacks>(
  propsRef: MutableRefObject<T>,
  onDestroyed?: () => void
): T {
  const current = propsRef.current;
  const card = current.card
    ? {
        ...current.card,
        cardHolderVerification: current.card.cardHolderVerification
          ? {
              ...current.card.cardHolderVerification,
              onCardHolderVerification: (result: CardHolderVerificationResult) =>
                propsRef.current.card?.cardHolderVerification?.onCardHolderVerification?.(result) ??
                false,
            }
          : current.card.cardHolderVerification,
      }
    : current.card;

  return {
    ...current,
    card,
    onReady: () => {
      propsRef.current.onReady?.();
    },
    onError: (error) => {
      propsRef.current.onError?.(error);
    },
    onValidation: (event) => {
      propsRef.current.onValidation?.(event);
    },
    onPaymentChange: (event) => {
      propsRef.current.onPaymentChange?.(event);
    },
    onPaymentComplete: (transaction) => {
      propsRef.current.onPaymentComplete?.(transaction);
      onDestroyed?.();
    },
    onPaymentProcessing: (isProcessing) => {
      propsRef.current.onPaymentProcessing?.(isProcessing);
    },
  };
}
