import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { props, type SdkDouble } from './sdk-double';

vi.mock('@xmoney/xmoney-js', async () => {
  const { createSdkDouble } = await import('./sdk-double');
  const sdk = createSdkDouble();
  globalThis.__XMONEY_SDK__ = sdk;
  return { loadXMoney: sdk.loadXMoney };
});

import { PaymentCard } from '../src/components';

const sdk = globalThis.__XMONEY_SDK__ as SdkDouble;

beforeEach(() => {
  sdk.destroy.mockClear();
  sdk.paymentCard.mockClear();
});

describe('PaymentCard', () => {
  it('remounts when customerDetails changes', async () => {
    const view = render(<PaymentCard {...props} />);
    await waitFor(() => expect(sdk.paymentCard).toHaveBeenCalledTimes(1));

    view.rerender(<PaymentCard {...props} customerDetails={{ card: true }} />);

    await waitFor(() => expect(sdk.paymentCard).toHaveBeenCalledTimes(2));
    expect(sdk.destroy).toHaveBeenCalled();
    expect(sdk.paymentCard.mock.calls[1]?.[0].customerDetails).toEqual({ card: true });
  });
});
