# @xmoney/react

React components and hooks for the xMoney Checkout SDK. Each widget renders its own container and calls the matching factory from [`@xmoney/xmoney-js`](https://github.com/xMoney-Payments/xmoney-js).

Do not pass `container`. Live and stage are chosen by the checkout script from `publicKey`.

## Install

```bash
npm install @xmoney/react
```

Peer dependency: React 18 and 19.

Widgets load `https://secure.xmoney.com/sdk/v2/xmoney.js` on their own. Pass a CSP nonce by loading the script before the first widget mounts:

```ts
import { loadXMoney } from '@xmoney/react';

await loadXMoney({ nonce });
```

Every widget takes `publicKey`, `orderPayload`, and `orderChecksum`. Create that order on your server.

`ref.current` is `null` until the widget is ready, and `null` again after `onPaymentComplete` or `destroy()`.

Changing `orderPayload` and `orderChecksum` calls `updateOrder`. On `PaymentForm` and `PaymentCard`, changing `options.locale` calls `updateLocale` and changing `options.appearance` calls `updateAppearance`. Clearing `locale` sets it back to `en-US`.

`ApplePay` and `GooglePay` remount when `options.locale` or `options.appearance` changes. Every widget remounts when `publicKey` or `customerDetails` changes. `PaymentForm` and `PaymentCard` also remount when `card` changes, and `PaymentForm` remounts when `paymentMethods` changes. Changing a callback does not remount.

Locales are `en-US`, `el-GR`, `ro-RO`, `bg-BG`, `hu-HU`, and `pl-PL`.

## `PaymentForm`

Card fields, with Apple Pay and Google Pay in the same iframe when enabled.

```tsx
import { PaymentForm, type PaymentFormInstance } from '@xmoney/react';
import { useRef } from 'react';

export function Checkout({ publicKey, orderPayload, orderChecksum }) {
  const formRef = useRef<PaymentFormInstance>(null);

  return (
    <PaymentForm
      ref={formRef}
      publicKey={publicKey}
      orderPayload={orderPayload}
      orderChecksum={orderChecksum}
      paymentMethods={{
        applePay: { enabled: true, appearance: { type: 'pay', style: 'black' } },
        googlePay: { enabled: true, appearance: { type: 'pay', color: 'black' } },
      }}
      options={{ locale: 'en-US', appearance: { theme: 'light' } }}
      onPaymentComplete={(transaction) => {
        console.log(transaction.id);
      }}
    />
  );
}
```

Call these only while `formRef.current` is set. `validate`, `submit`, `updateOrder`, `updateLocale`, `updateAppearance`, and `destroy` match the checkout script.

```tsx
const validation = await formRef.current?.validate();
if (validation?.isValid) formRef.current?.submit();

await formRef.current?.updateOrder({ orderPayload, orderChecksum });
formRef.current?.updateLocale('ro-RO');
formRef.current?.updateAppearance({ theme: 'dark' });
formRef.current?.destroy();
```

## `PaymentCard`

Card fields without the wallet buttons. The ref methods match `PaymentForm`.

```tsx
import { PaymentCard, type PaymentCardInstance } from '@xmoney/react';
import { useRef, useState } from 'react';

export function CardCheckout({ publicKey, orderPayload, orderChecksum }) {
  const cardRef = useRef<PaymentCardInstance>(null);
  const [ready, setReady] = useState(false);

  return (
    <>
      <PaymentCard
        ref={cardRef}
        publicKey={publicKey}
        orderPayload={orderPayload}
        orderChecksum={orderChecksum}
        card={{ submitButton: { visible: false } }}
        options={{ appearance: { theme: 'dark' } }}
        onReady={() => setReady(true)}
        onPaymentComplete={(transaction) => {
          console.log(transaction.id);
        }}
      />
      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          void cardRef.current?.validate().then((event) => {
            if (event.isValid) cardRef.current?.submit();
          });
        }}
      >
        Pay
      </button>
    </>
  );
}
```

## `ApplePay`

`updateOrder` and `destroy` match `PaymentForm`. Check `usePaymentMethodCapabilities` before mounting. Locale and appearance changes remount the button.

```tsx
import { ApplePay, usePaymentMethodCapabilities } from '@xmoney/react';

export function ApplePayCheckout({ publicKey, orderPayload, orderChecksum }) {
  const { capabilities, loading } = usePaymentMethodCapabilities();
  if (loading || !capabilities?.applePay.supported) return null;

  return (
    <ApplePay
      publicKey={publicKey}
      orderPayload={orderPayload}
      orderChecksum={orderChecksum}
      options={{ appearance: { type: 'pay', style: 'black' } }}
      onPaymentComplete={(transaction) => {
        console.log(transaction.id);
      }}
    />
  );
}
```

## `GooglePay`

`updateOrder` and `destroy` match `PaymentForm`.

```tsx
import { GooglePay, usePaymentMethodCapabilities } from '@xmoney/react';

export function GooglePayCheckout({ publicKey, orderPayload, orderChecksum }) {
  const { capabilities, loading } = usePaymentMethodCapabilities();
  if (loading || !capabilities?.googlePay.supported) return null;

  return (
    <GooglePay
      publicKey={publicKey}
      orderPayload={orderPayload}
      orderChecksum={orderChecksum}
      options={{ appearance: { type: 'pay', color: 'black' } }}
      onPaymentComplete={(transaction) => {
        console.log(transaction.id);
      }}
    />
  );
}
```

## `useSavedCardPayment`

No UI. List the saved cards yourself and call `pay`. The hook returns `null` until it is ready, and `null` again after payment completes. `updateOrder` and `destroy` match `PaymentForm`.

```tsx
import { useSavedCardPayment } from '@xmoney/react';

export function PaySavedCard({ publicKey, orderPayload, orderChecksum, cardId }: {
  publicKey: string;
  orderPayload: string;
  orderChecksum: string;
  cardId: number;
}) {
  const saved = useSavedCardPayment({
    publicKey,
    orderPayload,
    orderChecksum,
    onPaymentComplete: (transaction) => {
      console.log(transaction.id);
    },
  });

  return (
    <button type="button" disabled={saved == null} onClick={() => saved?.pay({ cardId })}>
      Pay
    </button>
  );
}
```

## `usePaymentMethodCapabilities`

Waits up to 3 seconds. Pass `{ timeout }` to change that. A check that exceeds the timeout is unsupported with reason `TIMEOUT`.

```tsx
import { usePaymentMethodCapabilities } from '@xmoney/react';

export function WalletSupport() {
  const { capabilities, loading, error } = usePaymentMethodCapabilities({ timeout: 3000 });
  if (loading) return null;
  if (error) return <p>{error.message}</p>;

  return (
    <p>
      Apple Pay {capabilities?.applePay.supported ? 'yes' : capabilities?.applePay.reason} · Google Pay{' '}
      {capabilities?.googlePay.supported ? 'yes' : capabilities?.googlePay.reason}
    </p>
  );
}
```

## Errors

`onError` receives an `XMoneyError`: a string, or `{ code?, message? }`. This package reports these codes:

| Code | When |
|---|---|
| `SDK_LOAD_FAILED` | `xmoney.js` did not load |
| `WIDGET_INIT_FAILED` | the factory rejected, and the rejection did not already carry a code |
| `ORDER_UPDATE_FAILED` | a prop change called `updateOrder` and it returned `success: false` |

`ref.updateOrder()` returns `{ success, error }` and does not also call `onError`.
