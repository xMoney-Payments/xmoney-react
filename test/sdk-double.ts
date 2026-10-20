import { vi } from 'vitest';

export type SdkDouble = ReturnType<typeof createSdkDouble>;

declare global {
  var __XMONEY_SDK__: SdkDouble | undefined;
}

interface WidgetConfig {
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onPaymentComplete?: (transaction: unknown) => void;
  container?: HTMLElement;
  customerDetails?: unknown;
  card?: {
    cardHolderVerification?: {
      onCardHolderVerification?: (result: unknown) => boolean;
    };
  };
}

export function createSdkDouble() {
  const destroy = vi.fn();
  const submit = vi.fn();
  const validate = vi.fn(async () => ({
    isValid: true,
    empty: false,
    fields: {},
    trigger: 'submit' as const,
    errors: {},
  }));
  const updateOrder = vi.fn(async (): Promise<{ success: boolean; error?: string }> => ({ success: true }));
  const updateLocale = vi.fn();
  const updateAppearance = vi.fn();
  const pay = vi.fn();

  const formInstance = () => ({
    destroy,
    submit,
    validate,
    updateOrder,
    updateLocale,
    updateAppearance,
  });

  const paymentForm = vi.fn(async (config: WidgetConfig) => {
    config.onReady?.();
    return formInstance();
  });
  const paymentCard = vi.fn(async (config: WidgetConfig) => {
    config.onReady?.();
    return formInstance();
  });
  const applePay = vi.fn(async (config: WidgetConfig) => {
    config.onReady?.();
    return { destroy, updateOrder, updateLocale };
  });
  const googlePay = vi.fn(async (config: WidgetConfig) => {
    config.onReady?.();
    return { destroy, updateOrder, updateLocale };
  });
  const savedCardPayment = vi.fn(async (_config: WidgetConfig) => ({
    destroy,
    updateOrder,
    updateLocale,
    pay,
  }));
  const getPaymentMethodCapabilities = vi.fn(async () => ({
    applePay: { supported: false, reason: 'APPLE_PAY_NOT_SUPPORTED' },
    googlePay: { supported: true },
  }));

  const api = {
    destroy,
    submit,
    validate,
    updateOrder,
    updateLocale,
    updateAppearance,
    pay,
    paymentForm,
    paymentCard,
    applePay,
    googlePay,
    savedCardPayment,
    getPaymentMethodCapabilities,
    formInstance,
  };

  return { ...api, loadXMoney: vi.fn(async () => api) };
}

export const props = {
  publicKey: 'pk_test_site',
  orderPayload: 'payload-one',
  orderChecksum: 'checksum',
};
