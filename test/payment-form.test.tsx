import { createRef, StrictMode } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaymentFormInstance } from '@xmoney/xmoney-js';

import { props, type SdkDouble } from './sdk-double';

vi.mock('@xmoney/xmoney-js', async () => {
  const { createSdkDouble } = await import('./sdk-double');
  const sdk = createSdkDouble();
  globalThis.__XMONEY_SDK__ = sdk;
  return { loadXMoney: sdk.loadXMoney };
});

import { PaymentForm } from '../src/components';

const sdk = globalThis.__XMONEY_SDK__ as SdkDouble;

beforeEach(() => {
  sdk.loadXMoney.mockReset();
  sdk.loadXMoney.mockImplementation(async () => sdk);
  sdk.destroy.mockClear();
  sdk.submit.mockClear();
  sdk.validate.mockClear();
  sdk.updateOrder.mockReset();
  sdk.updateOrder.mockResolvedValue({ success: true });
  sdk.paymentForm.mockClear();
  sdk.paymentForm.mockImplementation(async (config) => {
    config.onReady?.();
    return sdk.formInstance();
  });
});

describe('PaymentForm', () => {
  it('mounts into the container element', async () => {
    render(<PaymentForm {...props} />);

    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));
    expect(sdk.paymentForm.mock.calls[0]?.[0].container).toBeInstanceOf(HTMLDivElement);
  });

  it('calls updateOrder when the order changes and does not remount', async () => {
    const view = render(<PaymentForm {...props} />);

    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));
    expect(sdk.updateOrder).not.toHaveBeenCalled();

    view.rerender(<PaymentForm {...props} orderPayload="payload-two" />);

    await waitFor(() =>
      expect(sdk.updateOrder).toHaveBeenCalledWith({
        orderPayload: 'payload-two',
        orderChecksum: 'checksum',
      })
    );
    expect(sdk.paymentForm).toHaveBeenCalledTimes(1);
  });

  it('sends an order change that arrives while the widget is being created', async () => {
    let resolveForm: (instance: ReturnType<typeof sdk.formInstance>) => void = () => {};
    sdk.paymentForm.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveForm = resolve;
        })
    );

    const view = render(<PaymentForm {...props} />);
    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));
    view.rerender(<PaymentForm {...props} orderPayload="payload-two" />);
    resolveForm(sdk.formInstance());

    await waitFor(() =>
      expect(sdk.updateOrder).toHaveBeenCalledWith({
        orderPayload: 'payload-two',
        orderChecksum: 'checksum',
      })
    );
  });

  it('destroys an instance that resolves after unmount', async () => {
    const lateDestroy = vi.fn();
    let resolveForm: (instance: ReturnType<typeof sdk.formInstance>) => void = () => {};
    sdk.paymentForm.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveForm = resolve;
        })
    );

    const view = render(<PaymentForm {...props} />);
    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));
    view.unmount();

    resolveForm({
      ...sdk.formInstance(),
      destroy: lateDestroy,
    });

    await waitFor(() => expect(lateDestroy).toHaveBeenCalledTimes(1));
  });

  it('keeps the ref null until the widget is ready, then exposes submit and validate', async () => {
    const ref = createRef<PaymentFormInstance | null>();
    render(<PaymentForm {...props} ref={ref} />);
    expect(ref.current).toBeNull();

    await waitFor(() => expect(ref.current).not.toBeNull());
    ref.current?.submit();
    expect(sdk.submit).toHaveBeenCalledTimes(1);
    await ref.current?.validate();
    expect(sdk.validate).toHaveBeenCalledTimes(1);
  });

  it('reports a factory rejection through onError', async () => {
    sdk.paymentForm.mockImplementationOnce(async () => {
      throw new Error('boom');
    });
    const onError = vi.fn();
    render(<PaymentForm {...props} onError={onError} />);

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith({ code: 'WIDGET_INIT_FAILED', message: 'boom' })
    );
  });

  it('reports a script load failure through onError', async () => {
    sdk.loadXMoney.mockRejectedValueOnce(new Error('blocked'));
    const onError = vi.fn();
    render(<PaymentForm {...props} onError={onError} />);

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith({ code: 'SDK_LOAD_FAILED', message: 'blocked' })
    );
  });

  it('does not report an init error the SDK already delivered', async () => {
    sdk.paymentForm.mockImplementationOnce(async (config: { onError?: (error: unknown) => void }) => {
      const error = new Error('Container element not found!') as Error & { code: string };
      error.code = 'MISSING_CONTAINER';
      config.onError?.(error);
      throw error;
    });
    const onError = vi.fn();
    render(<PaymentForm {...props} onError={onError} />);

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'MISSING_CONTAINER' }));
  });

  it('surfaces a failed updateOrder and retries the same change', async () => {
    sdk.updateOrder.mockResolvedValueOnce({ success: false, error: 'bad checksum' });
    const onError = vi.fn();
    const view = render(<PaymentForm {...props} onError={onError} />);
    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));

    view.rerender(<PaymentForm {...props} onError={onError} orderPayload="payload-two" />);

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith({ code: 'ORDER_UPDATE_FAILED', message: 'bad checksum' })
    );

    view.rerender(<PaymentForm {...props} onError={onError} orderPayload="payload-three" />);
    view.rerender(<PaymentForm {...props} onError={onError} orderPayload="payload-two" />);

    await waitFor(() => expect(sdk.updateOrder).toHaveBeenCalledTimes(3));
  });

  it('calls the latest payment callback without remounting', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const view = render(<PaymentForm {...props} onPaymentComplete={first} />);
    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));
    view.rerender(<PaymentForm {...props} onPaymentComplete={second} />);

    act(() => {
      sdk.paymentForm.mock.calls[0]?.[0].onPaymentComplete?.({ id: 4 });
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ id: 4 });
    expect(sdk.paymentForm).toHaveBeenCalledTimes(1);
  });

  it('reads the latest cardholder verification callback', async () => {
    const first = vi.fn(() => false);
    const second = vi.fn(() => true);
    const card = {
      cardHolderVerification: {
        name: { firstName: 'John', lastName: 'Doe' },
        onCardHolderVerification: first,
      },
    };
    const view = render(<PaymentForm {...props} card={card} />);
    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalledTimes(1));
    view.rerender(
      <PaymentForm
        {...props}
        card={{
          cardHolderVerification: {
            name: { firstName: 'John', lastName: 'Doe' },
            onCardHolderVerification: second,
          },
        }}
      />
    );

    const verify =
      sdk.paymentForm.mock.calls[0]?.[0]?.card?.cardHolderVerification?.onCardHolderVerification;
    expect(verify?.({ status: 'MATCHED' })).toBe(true);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('clears the ref after payment completes', async () => {
    const ref = createRef<PaymentFormInstance | null>();
    render(<PaymentForm {...props} ref={ref} />);
    await waitFor(() => expect(ref.current).not.toBeNull());

    act(() => {
      sdk.paymentForm.mock.calls[0]?.[0].onPaymentComplete?.({ id: 9 });
    });

    await waitFor(() => expect(ref.current).toBeNull());
  });

  it('leaves one live widget under StrictMode', async () => {
    render(
      <StrictMode>
        <PaymentForm {...props} />
      </StrictMode>
    );

    await waitFor(() => expect(sdk.paymentForm).toHaveBeenCalled());
    expect(sdk.paymentForm.mock.calls.length - sdk.destroy.mock.calls.length).toBe(1);
  });
});
