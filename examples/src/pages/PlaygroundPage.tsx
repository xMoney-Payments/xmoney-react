import type { CardInputGrouping, FormButtonType, Locale, ValidationMode } from '@xmoney/react';
import { useMemo, useState } from 'react';
import { CheckoutPending } from '../components/CheckoutSkeleton';
import { ResultPanel, StatusChip, type PaymentOutcome } from '../components/SampleChrome';
import { TestCardsButton } from '../components/TestCardsDialog';
import { WidgetShell } from '../components/WidgetShell';
import { FieldSelect } from '../components/FieldSelect';
import { MethodSwitch, type CheckoutMethod } from '../components/MethodSwitch';
import { useSampleOrder } from '../hooks/useSampleOrder';
import {
  PLAYGROUND_THEMES,
  playgroundAppearance,
  playgroundTheme,
  type PlaygroundThemeId,
} from '../lib/appearance';
import { SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION } from '../lib/config';
import { PlaygroundCard } from '../playground/PlaygroundCard';
import { PlaygroundForm } from '../playground/PlaygroundForm';
import { PlaygroundWallet } from '../playground/PlaygroundWallet';
import { btnSecondary, controls, h1, lead, page } from '../ui';

const LOCALES: Locale[] = ['en-US', 'el-GR', 'ro-RO', 'bg-BG', 'hu-HU', 'pl-PL'];
const BUTTON_TYPES: FormButtonType[] = [
  'pay',
  'buy',
  'checkout',
  'book',
  'donate',
  'deposit',
  'order',
  'subscribe',
  'topUp',
];

export function PlaygroundPage() {
  const [method, setMethod] = useState<CheckoutMethod>('paymentForm');
  const [locale, setLocale] = useState<Locale>('en-US');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [accent, setAccent] = useState<PlaygroundThemeId>('lavender');
  const [grouping, setGrouping] = useState<CardInputGrouping>('spaced');
  const [validationMode, setValidationMode] = useState<ValidationMode>('onChange');
  const [submitVisible, setSubmitVisible] = useState(true);
  const [submitType, setSubmitType] = useState<FormButtonType>('pay');
  const [savedCards, setSavedCards] = useState(true);
  const [savedCardOptIn, setSavedCardOptIn] = useState(true);
  const [applePay, setApplePay] = useState(true);
  const [googlePay, setGooglePay] = useState(true);
  const [collectOnCard, setCollectOnCard] = useState(false);
  const [collectOnApplePay, setCollectOnApplePay] = useState(false);
  const [collectOnGooglePay, setCollectOnGooglePay] = useState(false);
  const [outcome, setOutcome] = useState<PaymentOutcome | null>(null);
  const sample = useSampleOrder(SAMPLE_AMOUNT_MINOR, SAMPLE_DESCRIPTION);
  const theme = playgroundTheme(accent);
  const dark = mode === 'dark';
  const appearance = useMemo(() => playgroundAppearance(theme, mode), [theme, mode]);
  const cardSurface = method === 'paymentForm' || method === 'paymentCard';
  const ink = dark ? '#FAFAFA' : '#16141A';
  const pageColor = dark ? theme.pageDark : theme.pageLight;
  const cardColor = dark ? theme.cardDark : '#FFFFFF';
  const surfaceColor = dark ? theme.surfaceDark : theme.surface;
  const fieldBorder = dark ? 'rgba(255,255,255,0.16)' : `${theme.swatch}4d`;

  function finish(transaction: import('@xmoney/react').TransactionDetails) {
    setOutcome({ kind: 'complete', transaction });
  }

  return (
    <div className={`${page} rounded-[28px] px-6 py-6`} style={{ background: pageColor, color: ink }}>
      <header className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className={h1}>Playground</h1>
          <p className={`${lead} !text-current opacity-70`}>
            Locale and theme call updateLocale and updateAppearance on the payment form and payment
            card. The method, card options, and customer collection mount the checkout again.
          </p>
        </div>
        <TestCardsButton />
      </header>
      <div className="grid items-start gap-6 wide:grid-cols-[320px_minmax(0,1fr)]">
        <form
          className={`${controls} [&_label:not(:has(input[type=checkbox]))]:!text-current [&_legend]:!text-current`}
          style={{ background: cardColor, color: ink, borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(22,20,26,0.08)' }}
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset>
            <legend>Theme</legend>
            <div className="flex items-center justify-between gap-3">
              <div
                className="inline-flex shrink-0 rounded-full border p-0.5"
                style={{ borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(22,20,26,0.08)' }}
                role="group"
                aria-label="Theme"
              >
                <button
                  type="button"
                  aria-pressed={mode === 'light'}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    mode === 'light' ? 'bg-[#16141a] text-white' : 'bg-transparent'
                  }`}
                  onClick={() => setMode('light')}
                >
                  <SunIcon />
                  Light
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'dark'}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                    mode === 'dark' ? 'bg-white text-[#16141a]' : 'bg-transparent'
                  }`}
                  onClick={() => setMode('dark')}
                >
                  <MoonIcon />
                  Dark
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-2" role="radiogroup" aria-label="Custom theme">
                {PLAYGROUND_THEMES.map((item) => {
                  const selected = item.id === accent;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${item.label} theme`}
                      title={item.label}
                      className="relative h-7 w-7 overflow-hidden rounded-full ring-offset-2 focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        background: item.tint,
                        boxShadow: selected ? `0 0 0 2px ${ink}` : undefined,
                      }}
                      onClick={() => setAccent(item.id)}
                    >
                      <span
                        className="absolute right-0 bottom-0 h-4 w-4 rounded-tl-full"
                        style={{ background: item.swatch }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <FieldSelect
              label="Locale"
              value={locale}
              options={LOCALES.map((value) => ({ value, label: value }))}
              onChange={(value) => setLocale(value as Locale)}
              borderColor={fieldBorder}
              background={cardColor}
              color={ink}
            />
          </fieldset>
          {cardSurface ? (
            <>
              <fieldset>
                <legend>Card</legend>
                <FieldSelect
                  label="Input grouping"
                  value={grouping}
                  options={[
                    { value: 'spaced', label: 'Spaced' },
                    { value: 'condensed', label: 'Condensed' },
                  ]}
                  onChange={(value) => setGrouping(value as CardInputGrouping)}
                  borderColor={fieldBorder}
                  background={cardColor}
                  color={ink}
                />
                <FieldSelect
                  label="Validation"
                  value={validationMode}
                  options={['onChange', 'onBlur', 'onTouched', 'onSubmit'].map((value) => ({
                    value,
                    label: value,
                  }))}
                  onChange={(value) => setValidationMode(value as ValidationMode)}
                  borderColor={fieldBorder}
                  background={cardColor}
                  color={ink}
                />
                <label className="check">
                  <input
                    type="checkbox"
                    checked={savedCards}
                    onChange={(event) => setSavedCards(event.target.checked)}
                  />
                  Saved cards
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={savedCardOptIn}
                    onChange={(event) => setSavedCardOptIn(event.target.checked)}
                  />
                  Save-card opt-in
                </label>
              </fieldset>
              <fieldset>
                <legend>Pay button</legend>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={submitVisible}
                    onChange={(event) => setSubmitVisible(event.target.checked)}
                  />
                  SDK Pay button
                </label>
                <FieldSelect
                  label="Button type"
                  value={submitType}
                  options={BUTTON_TYPES.map((value) => ({ value, label: value }))}
                  onChange={(value) => setSubmitType(value as FormButtonType)}
                  borderColor={fieldBorder}
                  background={cardColor}
                  color={ink}
                />
              </fieldset>
            </>
          ) : null}
          {method === 'paymentForm' ? (
            <>
              <fieldset>
                <legend>Wallets</legend>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={applePay}
                    onChange={(event) => setApplePay(event.target.checked)}
                  />
                  Apple Pay
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={googlePay}
                    onChange={(event) => setGooglePay(event.target.checked)}
                  />
                  Google Pay
                </label>
              </fieldset>
              <fieldset>
                <legend>Customer details</legend>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={collectOnCard}
                    onChange={(event) => setCollectOnCard(event.target.checked)}
                  />
                  Collect on card
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={collectOnApplePay}
                    onChange={(event) => setCollectOnApplePay(event.target.checked)}
                  />
                  Collect on Apple Pay
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={collectOnGooglePay}
                    onChange={(event) => setCollectOnGooglePay(event.target.checked)}
                  />
                  Collect on Google Pay
                </label>
              </fieldset>
            </>
          ) : null}
        </form>
        <div className="flex w-full flex-col gap-4 rounded-[28px] p-4" style={{ background: surfaceColor }}>
          <MethodSwitch
            value={method}
            options={['paymentForm', 'paymentCard', 'applePay', 'googlePay']}
            onChange={(next) => {
              setOutcome(null);
              setMethod(next);
            }}
          />
          <WidgetShell
            tone={mode}
            canvasColor={pageColor}
            surfaceColor={cardColor}
          >
            {sample.loading && !sample.order ? (
              <CheckoutPending kind={method === 'applePay' || method === 'googlePay' ? 'button' : 'form'} />
            ) : null}
            {sample.error && !sample.order ? <StatusChip tone="error">{sample.error}</StatusChip> : null}
            {outcome ? (
              <>
                <ResultPanel outcome={outcome} />
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    setOutcome(null);
                    sample.reload();
                  }}
                >
                  New payment
                </button>
              </>
            ) : null}
            {sample.order && !outcome && method === 'paymentCard' ? (
              <PlaygroundCard
                order={sample.order}
                appearance={appearance}
                locale={locale}
                submitVisible={submitVisible}
                submitType={submitType}
                grouping={grouping}
                validationMode={validationMode}
                savedCards={savedCards}
                savedCardOptIn={savedCardOptIn}
                onComplete={finish}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {sample.order && !outcome && method === 'paymentForm' ? (
              <PlaygroundForm
                order={sample.order}
                appearance={appearance}
                mode={mode}
                locale={locale}
                applePay={applePay}
                googlePay={googlePay}
                submitVisible={submitVisible}
                submitType={submitType}
                grouping={grouping}
                validationMode={validationMode}
                savedCards={savedCards}
                savedCardOptIn={savedCardOptIn}
                collectOnCard={collectOnCard}
                collectOnApplePay={collectOnApplePay}
                collectOnGooglePay={collectOnGooglePay}
                onComplete={finish}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
            {sample.order && !outcome && (method === 'applePay' || method === 'googlePay') ? (
              <PlaygroundWallet
                method={method}
                order={sample.order}
                onComplete={finish}
                onError={(message) => setOutcome({ kind: 'error', message })}
              />
            ) : null}
          </WidgetShell>
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M18.4 5.6l-1.1 1.1M6.7 17.3l-1.1 1.1"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M16.5 13.5A6.5 6.5 0 0 1 10 4.2 7 7 0 1 0 19.8 14a6.5 6.5 0 0 1-3.3-.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
