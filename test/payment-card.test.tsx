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

  it('passes customerDetails fields and defaultValues to the factory', async () => {
    const customerDetails = {
      card: true,
      fields: { fullName: true, email: true, address: true },
      defaultValues: { fullName: 'Ana Pop', country: 'RO' },
    };

    render(<PaymentCard {...props} customerDetails={customerDetails} />);

    await waitFor(() => expect(sdk.paymentCard).toHaveBeenCalledTimes(1));
    expect(sdk.paymentCard.mock.calls[0]?.[0].customerDetails).toEqual(customerDetails);
  });

  it('remounts when customerDetails defaultValues changes', async () => {
    const view = render(
      <PaymentCard {...props} customerDetails={{ card: true, defaultValues: { fullName: 'Ana Pop' } }} />
    );
    await waitFor(() => expect(sdk.paymentCard).toHaveBeenCalledTimes(1));

    view.rerender(
      <PaymentCard {...props} customerDetails={{ card: true, defaultValues: { fullName: 'Ion Pop' } }} />
    );

    await waitFor(() => expect(sdk.paymentCard).toHaveBeenCalledTimes(2));
    expect(sdk.destroy).toHaveBeenCalled();
  });

  it('does not remount when customerDetails is rebuilt with the same values', async () => {
    const view = render(<PaymentCard {...props} customerDetails={{ card: true, fields: { email: true } }} />);
    await waitFor(() => expect(sdk.paymentCard).toHaveBeenCalledTimes(1));

    view.rerender(<PaymentCard {...props} customerDetails={{ card: true, fields: { email: true } }} />);

    await Promise.resolve();
    expect(sdk.paymentCard).toHaveBeenCalledTimes(1);
    expect(sdk.destroy).not.toHaveBeenCalled();
  });
});
