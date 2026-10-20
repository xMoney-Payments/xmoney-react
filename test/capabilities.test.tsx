import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SdkDouble } from './sdk-double';

vi.mock('@xmoney/xmoney-js', async () => {
  const { createSdkDouble } = await import('./sdk-double');
  const sdk = createSdkDouble();
  globalThis.__XMONEY_SDK__ = sdk;
  return { loadXMoney: sdk.loadXMoney };
});

import { usePaymentMethodCapabilities } from '../src/use-payment-method-capabilities';

const sdk = globalThis.__XMONEY_SDK__ as SdkDouble;

beforeEach(() => {
  sdk.getPaymentMethodCapabilities.mockClear();
});

describe('usePaymentMethodCapabilities', () => {
  it('passes a default timeout and then a caller timeout', async () => {
    const hook = renderHook(() => usePaymentMethodCapabilities());
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(sdk.getPaymentMethodCapabilities).toHaveBeenCalledWith({ timeout: 3000 });
    expect(hook.result.current.capabilities?.googlePay.supported).toBe(true);

    const custom = renderHook(() => usePaymentMethodCapabilities({ timeout: 50 }));
    await waitFor(() => expect(custom.result.current.loading).toBe(false));
    expect(sdk.getPaymentMethodCapabilities).toHaveBeenCalledWith({ timeout: 50 });
  });
});
