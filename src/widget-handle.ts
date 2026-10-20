import type {
  Appearance,
  BaseInstance,
  Locale,
  OrderUpdate,
  PaymentCardInstance,
} from '@xmoney/xmoney-js';
import { useImperativeHandle, type ForwardedRef, type MutableRefObject } from 'react';

import { safeDestroy } from './use-xmoney-widget';

function readyInstance<T extends BaseInstance>(instanceRef: MutableRefObject<T | null>): T {
  const current = instanceRef.current;
  if (!current) {
    throw new Error('xMoney widget is not ready.');
  }
  return current;
}

function baseHandle<T extends BaseInstance>(instanceRef: MutableRefObject<T | null>): BaseInstance {
  return {
    updateOrder: (order: OrderUpdate) => readyInstance(instanceRef).updateOrder(order),
    destroy: () => {
      const current = instanceRef.current;
      if (current) {
        safeDestroy(current);
      }
    },
  };
}

export function useWidgetHandle<T extends BaseInstance>(
  ref: ForwardedRef<T | null>,
  instanceRef: MutableRefObject<T | null>,
  instance: T | null,
  formHandle: boolean
): void {
  useImperativeHandle<T | null, T | null>(
    ref,
    () => {
      if (!instance) {
        return null;
      }
      const base = baseHandle(instanceRef);
      if (!formHandle) {
        return base as T;
      }
      const form = instanceRef as MutableRefObject<PaymentCardInstance | null>;
      return {
        ...base,
        updateLocale: (locale: Locale) => {
          readyInstance(form).updateLocale(locale);
        },
        updateAppearance: (appearance: Appearance) => {
          readyInstance(form).updateAppearance(appearance);
        },
        submit: () => {
          readyInstance(form).submit();
        },
        validate: () => readyInstance(form).validate(),
      } as unknown as T;
    },
    [formHandle, instance, instanceRef]
  );
}
