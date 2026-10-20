# Changelog

All notable changes to `@xmoney/react` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2026-10-20

First public release.

### Added

- `PaymentForm`, `PaymentCard`, `ApplePay`, and `GooglePay`. Each renders a container and mounts the matching factory from `@xmoney/xmoney-js`.
- `useSavedCardPayment()` for a saved-card payment with no UI. Call `pay({ cardId })` when the hook returns an instance.
- `usePaymentMethodCapabilities()`. It waits up to 3 seconds by default. Pass `{ timeout }` to change that.
- Re-exports of `loadXMoney`, `MatchStatus`, `TransactionStatus`, and the `@xmoney/xmoney-js` types.
- ESM and CommonJS builds. Peer dependency is React `>=18 <20`.
- A Vite examples app for the payment form, payment card, wallets, saved cards, and a merchant pay button.

### Behavior

- `ref.current` is `null` until the widget is ready, and `null` again after `onPaymentComplete` or `destroy()`.
- Changing `orderPayload` and `orderChecksum` calls `updateOrder`. On `PaymentForm` and `PaymentCard`, `options.locale` calls `updateLocale` and `options.appearance` calls `updateAppearance`. Clearing `locale` sets it back to `en-US`.
- `ApplePay` and `GooglePay` remount when locale or appearance changes. Every widget remounts when `publicKey` or `customerDetails` changes. `PaymentForm` and `PaymentCard` also remount when `card` changes, and `PaymentForm` remounts when `paymentMethods` changes.
- Callback props always read the latest function. Changing them does not remount the iframe.
- `onError` reports `SDK_LOAD_FAILED` when `xmoney.js` does not load, `WIDGET_INIT_FAILED` when the factory rejects without a code, and `ORDER_UPDATE_FAILED` when a prop change calls `updateOrder` and it returns `success: false`.
