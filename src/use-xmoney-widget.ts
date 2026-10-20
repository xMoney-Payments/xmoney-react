import {
  loadXMoney,
  type Appearance,
  type BaseInstance,
  type Locale,
  type XMoney,
  type XMoneyError,
} from '@xmoney/xmoney-js';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';

const destroyedInstances = new WeakSet<BaseInstance>();
const DEFAULT_LOCALE: Locale = 'en-US';

export function safeDestroy(instance: BaseInstance): void {
  if (destroyedInstances.has(instance)) {
    return;
  }
  destroyedInstances.add(instance);
  try {
    instance.destroy();
  } catch {
    // The SDK destroys itself after onPaymentComplete.
  }
}

export function widgetMountKey(value: unknown): string {
  return JSON.stringify(value);
}

interface AppliedConfig {
  orderPayload: string;
  orderChecksum: string;
  locale?: Locale;
  appearance: string;
}

interface UseXMoneyWidgetOptions<TInstance extends BaseInstance> {
  mountKey: string;
  containerRequired: boolean;
  supportsAppearance: boolean;
  supportsLocaleUpdate: boolean;
  orderPayload: string;
  orderChecksum: string;
  locale?: Locale;
  appearance?: Appearance;
  onError: () => ((error: XMoneyError) => void) | undefined;
  create: (xmoney: XMoney, container: HTMLElement | undefined) => Promise<TInstance>;
}

export interface XMoneyWidgetBinding<TInstance extends BaseInstance> {
  setContainer: (node: HTMLDivElement | null) => void;
  instanceRef: MutableRefObject<TInstance | null>;
  instance: TInstance | null;
  markDestroyed: () => void;
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'xMoney widget failed.';
}

function errorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

export function useXMoneyWidget<TInstance extends BaseInstance>({
  mountKey,
  containerRequired,
  supportsAppearance,
  supportsLocaleUpdate,
  orderPayload,
  orderChecksum,
  locale,
  appearance,
  onError,
  create,
}: UseXMoneyWidgetOptions<TInstance>): XMoneyWidgetBinding<TInstance> {
  const [container, setContainerState] = useState<HTMLDivElement | null>(null);
  const [instance, setInstance] = useState<TInstance | null>(null);
  const instanceRef = useRef<TInstance | null>(null);
  const createRef = useRef(create);
  const onErrorRef = useRef(onError);
  const appliedRef = useRef<AppliedConfig>({
    orderPayload: '',
    orderChecksum: '',
    locale: undefined,
    appearance: 'null',
  });
  const orderRef = useRef({ orderPayload, orderChecksum });
  const localeRef = useRef(locale);
  const appearanceRef = useRef(appearance);

  useEffect(() => {
    createRef.current = create;
    onErrorRef.current = onError;
    orderRef.current = { orderPayload, orderChecksum };
    localeRef.current = locale;
    appearanceRef.current = appearance;
  });

  const reportError = useCallback((error: XMoneyError) => {
    const handler = onErrorRef.current();
    if (handler) {
      handler(error);
      return;
    }
    console.error(error);
  }, []);

  const markDestroyed = useCallback(() => {
    instanceRef.current = null;
    setInstance(null);
  }, []);

  const setContainer = useCallback((node: HTMLDivElement | null) => {
    setContainerState(node);
  }, []);

  useEffect(() => {
    if (containerRequired && !container) {
      return;
    }

    let destroyed = false;
    let created: TInstance | null = null;

    void (async () => {
      let xmoney: XMoney;
      try {
        xmoney = await loadXMoney();
      } catch (error) {
        if (!destroyed) {
          reportError(
            errorCode(error)
              ? (error as XMoneyError)
              : { code: 'SDK_LOAD_FAILED', message: errorText(error) }
          );
        }
        return;
      }
      if (destroyed) {
        return;
      }

      const snapshot: AppliedConfig = {
        orderPayload: orderRef.current.orderPayload,
        orderChecksum: orderRef.current.orderChecksum,
        locale: localeRef.current,
        appearance: JSON.stringify(appearanceRef.current ?? null),
      };

      try {
        created = await createRef.current(xmoney, container ?? undefined);
      } catch (error) {
        if (!destroyed && !errorCode(error)) {
          reportError({ code: 'WIDGET_INIT_FAILED', message: errorText(error) });
        }
        return;
      }
      if (destroyed) {
        safeDestroy(created);
        return;
      }
      instanceRef.current = created;
      appliedRef.current = snapshot;
      setInstance(created);
    })();

    return () => {
      destroyed = true;
      if (created) {
        safeDestroy(created);
      }
      if (instanceRef.current === created) {
        instanceRef.current = null;
      }
      setInstance(null);
    };
  }, [mountKey, container, containerRequired, reportError]);

  useEffect(() => {
    const current = instanceRef.current;
    if (!current) {
      return;
    }
    if (
      appliedRef.current.orderPayload === orderPayload &&
      appliedRef.current.orderChecksum === orderChecksum
    ) {
      return;
    }
    const previous = {
      orderPayload: appliedRef.current.orderPayload,
      orderChecksum: appliedRef.current.orderChecksum,
    };
    appliedRef.current.orderPayload = orderPayload;
    appliedRef.current.orderChecksum = orderChecksum;
    void current.updateOrder({ orderPayload, orderChecksum }).then((result) => {
      if (result.success) {
        return;
      }
      if (
        appliedRef.current.orderPayload === orderPayload &&
        appliedRef.current.orderChecksum === orderChecksum
      ) {
        appliedRef.current.orderPayload = previous.orderPayload;
        appliedRef.current.orderChecksum = previous.orderChecksum;
      }
      reportError({
        code: 'ORDER_UPDATE_FAILED',
        message: result.error ?? 'Order update failed.',
      });
    });
  }, [instance, orderPayload, orderChecksum, reportError]);

  useEffect(() => {
    const current = instanceRef.current;
    if (!supportsLocaleUpdate || !current) {
      return;
    }
    const next = locale ?? DEFAULT_LOCALE;
    if (appliedRef.current.locale === next || (appliedRef.current.locale === undefined && locale === undefined)) {
      return;
    }
    appliedRef.current.locale = next;
    const withLocale = current as TInstance & { updateLocale?: (next: Locale) => void };
    withLocale.updateLocale?.(next);
  }, [instance, locale, supportsLocaleUpdate]);

  useEffect(() => {
    const current = instanceRef.current;
    if (!supportsAppearance || !current || appearance === undefined) {
      return;
    }
    const serialized = JSON.stringify(appearance);
    if (appliedRef.current.appearance === serialized) {
      return;
    }
    appliedRef.current.appearance = serialized;
    const withAppearance = current as TInstance & {
      updateAppearance?: (next: Appearance) => void;
    };
    withAppearance.updateAppearance?.(appearance);
  }, [instance, appearance, supportsAppearance]);

  return { setContainer, instanceRef, instance, markDestroyed };
}
