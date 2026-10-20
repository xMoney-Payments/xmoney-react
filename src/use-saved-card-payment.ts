import type { SavedCardPaymentConfig, SavedCardPaymentInstance } from '@xmoney/xmoney-js';
import { useEffect, useRef } from 'react';

import { bindHostCallbacks } from './bind-callbacks';
import { useXMoneyWidget, widgetMountKey } from './use-xmoney-widget';

/**
 * Saved-card payment has no UI. The SDK creates its own hidden container.
 * The instance becomes null after `onPaymentComplete`, because the SDK
 * destroys the widget.
 */
export function useSavedCardPayment(props: SavedCardPaymentConfig): SavedCardPaymentInstance | null {
  const propsRef = useRef(props);
  const onDestroyed = useRef<() => void>(() => {});
  useEffect(() => {
    propsRef.current = props;
  });
  const { instance, markDestroyed } = useXMoneyWidget<SavedCardPaymentInstance>({
    mountKey: widgetMountKey({
      publicKey: props.publicKey,
    }),
    containerRequired: false,
    supportsAppearance: false,
    supportsLocaleUpdate: false,
    orderPayload: props.orderPayload,
    orderChecksum: props.orderChecksum,
    onError: () => propsRef.current.onError,
    create: (xmoney) => xmoney.savedCardPayment(bindHostCallbacks(propsRef, () => onDestroyed.current())),
  });
  useEffect(() => {
    onDestroyed.current = markDestroyed;
  });
  return instance;
}
