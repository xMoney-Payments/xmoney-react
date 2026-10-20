import type {
  Appearance,
  ApplePayConfig,
  ApplePayInstance,
  GooglePayConfig,
  GooglePayInstance,
  Locale,
  PaymentCardConfig,
  PaymentCardInstance,
  PaymentFormConfig,
  PaymentFormInstance,
  XMoney,
} from '@xmoney/xmoney-js';
import {
  forwardRef,
  useRef,
  type ForwardRefExoticComponent,
  type MutableRefObject,
  type ReactElement,
  type RefAttributes,
} from 'react';

import { bindHostCallbacks, type HostCallbacks } from './bind-callbacks';
import { useXMoneyWidget, widgetMountKey } from './use-xmoney-widget';
import { useWidgetHandle } from './widget-handle';

export type PaymentFormProps = Omit<PaymentFormConfig, 'container'>;
export type PaymentCardProps = Omit<PaymentCardConfig, 'container'>;
export type ApplePayProps = Omit<ApplePayConfig, 'container'>;
export type GooglePayProps = Omit<GooglePayConfig, 'container'>;

interface WidgetProps {
  publicKey: string;
  orderPayload: string;
  orderChecksum: string;
  customerDetails?: unknown;
  card?: unknown;
  paymentMethods?: unknown;
  options?: {
    locale?: Locale;
    appearance?: unknown;
  };
  onError?: PaymentFormConfig['onError'];
}

type WidgetComponent<TInstance, TProps> = ForwardRefExoticComponent<TProps & RefAttributes<TInstance | null>>;

function createWidget<TInstance extends PaymentCardInstance | ApplePayInstance, TProps extends WidgetProps>(options: {
  displayName: string;
  supportsAppearance: boolean;
  supportsLocaleUpdate: boolean;
  formHandle: boolean;
  keyOf: (props: TProps) => unknown;
  create: (xmoney: XMoney, config: TProps & { container: HTMLElement }) => Promise<TInstance>;
}): WidgetComponent<TInstance, TProps> {
  const Widget = forwardRef<TInstance | null, TProps>(function Widget(props, ref): ReactElement {
    const propsRef = useRef(props as TProps);
    propsRef.current = props as TProps;
    const onDestroyed = useRef<() => void>(() => {});
    const binding = useXMoneyWidget<TInstance>({
      mountKey: widgetMountKey(options.keyOf(props as TProps)),
      containerRequired: true,
      supportsAppearance: options.supportsAppearance,
      supportsLocaleUpdate: options.supportsLocaleUpdate,
      orderPayload: props.orderPayload,
      orderChecksum: props.orderChecksum,
      locale: props.options?.locale,
      appearance: options.supportsAppearance ? (props.options?.appearance as Appearance | undefined) : undefined,
      onError: () => propsRef.current.onError,
      create: (xmoney, container) =>
        options.create(xmoney, {
          ...bindHostCallbacks(propsRef as unknown as MutableRefObject<HostCallbacks>, () =>
            onDestroyed.current()
          ),
          container: container as HTMLElement,
        } as TProps & { container: HTMLElement }),
    });
    onDestroyed.current = binding.markDestroyed;
    useWidgetHandle(ref, binding.instanceRef, binding.instance, options.formHandle);
    return <div ref={binding.setContainer} />;
  });
  Widget.displayName = options.displayName;
  return Widget as WidgetComponent<TInstance, TProps>;
}

function sharedKey(props: WidgetProps) {
  return {
    publicKey: props.publicKey,
    customerDetails: props.customerDetails,
  };
}

export const PaymentForm = createWidget<PaymentFormInstance, PaymentFormProps>({
  displayName: 'PaymentForm',
  supportsAppearance: true,
  supportsLocaleUpdate: true,
  formHandle: true,
  keyOf: (props) => ({
    ...sharedKey(props),
    card: props.card,
    paymentMethods: props.paymentMethods,
  }),
  create: (xmoney, config) => xmoney.paymentForm(config),
});

export const PaymentCard = createWidget<PaymentCardInstance, PaymentCardProps>({
  displayName: 'PaymentCard',
  supportsAppearance: true,
  supportsLocaleUpdate: true,
  formHandle: true,
  keyOf: (props) => ({
    ...sharedKey(props),
    card: props.card,
  }),
  create: (xmoney, config) => xmoney.paymentCard(config),
});

export const ApplePay = createWidget<ApplePayInstance, ApplePayProps>({
  displayName: 'ApplePay',
  supportsAppearance: false,
  supportsLocaleUpdate: false,
  formHandle: false,
  keyOf: (props) => ({
    ...sharedKey(props),
    locale: props.options?.locale,
    appearance: props.options?.appearance,
  }),
  create: (xmoney, config) => xmoney.applePay(config),
});

export const GooglePay = createWidget<GooglePayInstance, GooglePayProps>({
  displayName: 'GooglePay',
  supportsAppearance: false,
  supportsLocaleUpdate: false,
  formHandle: false,
  keyOf: (props) => ({
    ...sharedKey(props),
    locale: props.options?.locale,
    appearance: props.options?.appearance,
  }),
  create: (xmoney, config) => xmoney.googlePay(config),
});
