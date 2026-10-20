import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { props, type SdkDouble } from './sdk-double';

vi.mock('@xmoney/xmoney-js', async () => {
  const { createSdkDouble } = await import('./sdk-double');
  const sdk = createSdkDouble();
  globalThis.__XMONEY_SDK__ = sdk;
  return { loadXMoney: sdk.loadXMoney };
});

import { ApplePay, GooglePay } from '../src/components';

const sdk = globalThis.__XMONEY_SDK__ as SdkDouble;

beforeEach(() => {
  sdk.destroy.mockClear();
  sdk.applePay.mockClear();
  sdk.googlePay.mockClear();
});

describe('wallets', () => {
  it('remounts Apple Pay when customerDetails changes', async () => {
    const view = render(<ApplePay {...props} />);
    await waitFor(() => expect(sdk.applePay).toHaveBeenCalledTimes(1));

    view.rerender(<ApplePay {...props} customerDetails={{ applePay: true }} />);

    await waitFor(() => expect(sdk.applePay).toHaveBeenCalledTimes(2));
    expect(sdk.destroy).toHaveBeenCalled();
  });

  it('remounts Google Pay when customerDetails changes', async () => {
    const view = render(<GooglePay {...props} />);
    await waitFor(() => expect(sdk.googlePay).toHaveBeenCalledTimes(1));

    view.rerender(<GooglePay {...props} customerDetails={{ googlePay: true }} />);

    await waitFor(() => expect(sdk.googlePay).toHaveBeenCalledTimes(2));
    expect(sdk.destroy).toHaveBeenCalled();
  });
});
