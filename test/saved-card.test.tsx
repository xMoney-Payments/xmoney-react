import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { props, type SdkDouble } from './sdk-double';

vi.mock('@xmoney/xmoney-js', async () => {
  const { createSdkDouble } = await import('./sdk-double');
  const sdk = createSdkDouble();
  globalThis.__XMONEY_SDK__ = sdk;
  return { loadXMoney: sdk.loadXMoney };
});

import { useSavedCardPayment } from '../src/use-saved-card-payment';

const sdk = globalThis.__XMONEY_SDK__ as SdkDouble;

beforeEach(() => {
  sdk.pay.mockClear();
  sdk.savedCardPayment.mockClear();
});

describe('useSavedCardPayment', () => {
  it('exposes pay', async () => {
    const hook = renderHook(() => useSavedCardPayment(props));

    await waitFor(() => expect(hook.result.current).not.toBeNull());
    hook.result.current?.pay({ cardId: 7 });
    expect(sdk.pay).toHaveBeenCalledWith({ cardId: 7 });
  });

  it('returns null after payment completes', async () => {
    const hook = renderHook(() => useSavedCardPayment(props));
    await waitFor(() => expect(hook.result.current).not.toBeNull());

    act(() => {
      sdk.savedCardPayment.mock.calls[0]?.[0]?.onPaymentComplete?.({ id: 3 });
    });

    await waitFor(() => expect(hook.result.current).toBeNull());
  });
});
