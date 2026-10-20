# xMoney desktop examples

In-repo demo for `@xmoney/react`. One Vite app, a sidebar, copy-paste samples, three merchant stores, and an internal playground. Layout is desktop: a fixed sidebar and two-column checkout (summary beside the payment form).

`PaymentForm` is the drop-in. `PaymentCard` is the card fields plus your Pay button. Pay with card is `useSavedCardPayment`: this page draws the card list and calls `pay({ cardId })`. Wallets are `ApplePay` and `GooglePay`, shown after `usePaymentMethodCapabilities()`.

## Run

From this folder:

```bash
cp .env.example .env
# Fill VITE_PUBLIC_KEY, API_KEY, VITE_API_BASE, VITE_CURRENCY

npm install
npm run dev
```

Or from the repository root, after `examples/` dependencies are installed: `npm run example`.

## Launcher

| Section | Screen | What it is |
|---|---|---|
| Integrations | Payment form | Drop-in `PaymentForm` — [`PaymentForm.tsx`](src/integrations/PaymentForm.tsx) |
| Integrations | Payment Card | `PaymentCard` plus your Pay button — [`PaymentCard.tsx`](src/integrations/PaymentCard.tsx) |
| Integrations | Pay with card | `useSavedCardPayment` and your card list — [`SavedCardPayment.tsx`](src/integrations/SavedCardPayment.tsx) |
| Integrations | Wallets | Standalone `ApplePay` and `GooglePay` — [`ApplePay.tsx`](src/integrations/ApplePay.tsx), [`GooglePay.tsx`](src/integrations/GooglePay.tsx) |
| Example app | Lumen | Lifestyle catalog, cart, checkout dialog |
| Example app | Hearth | Café menu. A row adds the item. Checkout opens the dialog |
| Example app | Pulse | Memberships. A row adds the plan. Checkout opens the dialog |
| Advanced | Merchant Pay button | Form with the SDK button hidden. Your button calls `submit()` |
| Advanced | Update order | `updateOrder()` on a mounted form |
| Advanced | Card holder verification | Pre-pay name check. Pays only when the name matches John Doe |
| Internal | Playground | Method switch, locale, theme, card options, wallets on the form, and customer collection for card, Apple Pay, and Google Pay |

Light/Dark is saved in `localStorage`. Store pages keep their accent on store buttons and follow the same light/dark theme. The shell theme calls `updateAppearance` on a mounted payment form or card, so that iframe stays up. Apple Pay and Google Pay take their button style when they mount. Locale also updates in place. Changing the method, card options, wallets, or customer collection mounts a new checkout on the same order.

Integrations and Advanced include **Test cards**. Each tile copies the number, expiry, CVV, or 3DS code (`00000`) on its own.

## Backend warning

[`src/lib/demo-backend.ts`](src/lib/demo-backend.ts) posts to `/api/orders`. The Vite dev server proxies that to the live demo at `VITE_API_BASE` (`https://demo.xmoney.com`) and sends `API_KEY`, so this app can create orders without a merchant backend.

**Do not copy that into production.** The page should hold only `publicKey`. Your server creates the order and returns `payload` and `checksum`.

## Copy-paste notes

Copy a file from [`src/integrations/`](src/integrations/). Each one renders a component from `@xmoney/react`. Playground, advanced screens, and the store checkouts mount those components in their own files, so theme knobs, `updateOrder`, and cardholder verification stay out of the integration samples.

- After `onPaymentComplete` or a payment `onError`, the order checksum is consumed. The samples hide the form and offer **New payment**, which creates a new order and remounts.
- To change the amount on a mounted form, create a new order on your server, then call `updateOrder`. Update order does this. The form stays mounted.
- While that request is in flight, a cover sits over the form so Pay cannot hit the previous order.
- Keep the payment container in the layout while it loads. Do not give it zero height. `onReady` fires once the form has drawn.
