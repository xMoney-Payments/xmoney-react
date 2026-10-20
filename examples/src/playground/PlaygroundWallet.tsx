import {
  ApplePay as XApplePay,
  GooglePay as XGooglePay,
  usePaymentMethodCapabilities,
  type ApplePayInstance,
  type GooglePayInstance,
  type OrderUpdateResult,
  type TransactionDetails,
} from '@xmoney/react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { WalletUnavailable } from '../components/MethodSwitch';
import { StatusChip } from '../components/SampleChrome';
import { appleAppearance, googleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';
import type { PlaygroundHandle } from './PlaygroundForm';

const NOT_READY: OrderUpdateResult = { success: false, error: 'NOT_READY' };

export const PlaygroundWallet = forwardRef<
  PlaygroundHandle,
  {
    method: 'applePay' | 'googlePay';
    order: DemoOrder;
    onReady?: () => void;
    onComplete: (transaction: TransactionDetails) => void;
    onError: (message: string) => void;
  }
>(function PlaygroundWallet({ method, order, onReady, onComplete, onError }, ref) {
  const { mode } = useTheme();
  const { capabilities, loading, error } = usePaymentMethodCapabilities();
  const supported = method === 'applePay' ? capabilities?.applePay.supported : capabilities?.googlePay.supported;
  const appleRef = useRef<ApplePayInstance>(null);
  const googleRef = useRef<GooglePayInstance>(null);
  const mountKey = `${method}|${mode}|${order.payload}|${order.checksum}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    submit: () => undefined,
    updateAppearance: () => undefined,
    updateLocale: () => undefined,
    updateOrder: (next) => {
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
    onError: (cause: unknown) => onError(errorText(cause)),
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
