import { GooglePay as XGooglePay, usePaymentMethodCapabilities, type TransactionDetails } from '@xmoney/react';
import { useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { WalletUnavailable } from '../components/MethodSwitch';
import { StatusChip } from '../components/SampleChrome';
import { googleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

export function GooglePay({
  order,
  onComplete,
  onError,
}: {
  order: DemoOrder;
  onComplete: (transaction: TransactionDetails) => void;
  onError: (message: string) => void;
}) {
  const { mode } = useTheme();
  const { capabilities, loading, error } = usePaymentMethodCapabilities();
  const supported = capabilities?.googlePay.supported;
  const mountKey = `${mode}|${order.payload}|${order.checksum}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  if (error) return <StatusChip tone="error">{errorText(error)}</StatusChip>;
  if (supported === false) return <WalletUnavailable method="googlePay" />;

  return (
    <CheckoutSlot kind="button" busy={loading || supported !== true || readyKey !== mountKey}>
      {supported ? (
        <XGooglePay
          publicKey={publicKey()}
          orderPayload={order.payload}
          orderChecksum={order.checksum}
          options={{ appearance: googleAppearance(mode) }}
          onReady={() => setReadyKey(mountKey)}
          onPaymentComplete={onComplete}
          onError={(cause) => onError(errorText(cause))}
        />
      ) : null}
    </CheckoutSlot>
  );
}
