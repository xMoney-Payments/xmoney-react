import { ApplePay as XApplePay, usePaymentMethodCapabilities, type TransactionDetails } from '@xmoney/react';
import { useState } from 'react';
import { CheckoutSlot } from '../components/CheckoutSkeleton';
import { WalletUnavailable } from '../components/MethodSwitch';
import { StatusChip } from '../components/SampleChrome';
import { appleAppearance } from '../lib/appearance';
import { publicKey } from '../lib/config';
import type { DemoOrder } from '../lib/demo-backend';
import { errorText } from '../lib/errors';
import { useTheme } from '../theme';

export function ApplePay({
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
  const supported = capabilities?.applePay.supported;
  const mountKey = `${mode}|${order.payload}|${order.checksum}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);

  if (error) return <StatusChip tone="error">{errorText(error)}</StatusChip>;
  if (supported === false) return <WalletUnavailable method="applePay" />;

  return (
    <CheckoutSlot kind="button" busy={loading || supported !== true || readyKey !== mountKey}>
      {supported ? (
        <XApplePay
          publicKey={publicKey()}
          orderPayload={order.payload}
          orderChecksum={order.checksum}
          options={{ appearance: appleAppearance(mode) }}
          onReady={() => setReadyKey(mountKey)}
          onPaymentComplete={onComplete}
          onError={(cause) => onError(errorText(cause))}
        />
      ) : null}
    </CheckoutSlot>
  );
}
