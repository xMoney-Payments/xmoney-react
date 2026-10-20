import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Shell } from './components/Shell';
import { useWide } from './hooks/useWide';
import { CardHolderPage } from './pages/CardHolderPage';
import { CheckoutSample } from './pages/CheckoutSample';
import { EmbeddedCheckout } from './pages/EmbeddedCheckout';
import { LumenPage } from './pages/LumenPage';
import { MerchantPayPage } from './pages/MerchantPayPage';
import { PayWithCardPage } from './pages/PayWithCardPage';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { StorePage } from './pages/StorePage';
import { UpdateOrderPage } from './pages/UpdateOrderPage';
import { WalletsPage } from './pages/WalletsPage';
import { hearth, pulse } from './lib/catalog';

function Home() {
  const wide = useWide();
  const location = useLocation();
  const fromMenu = Boolean((location.state as { fromMenu?: boolean } | null)?.fromMenu);
  if (!wide && !fromMenu) return <Navigate to="/menu" replace />;
  return <CheckoutSample />;
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<div />} />
        <Route path="embedded" element={<EmbeddedCheckout />} />
        <Route path="pay-with-card" element={<PayWithCardPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="lumen" element={<LumenPage />} />
        <Route path="hearth" element={<StorePage brand={hearth} layout="menu" />} />
        <Route path="pulse" element={<StorePage brand={pulse} layout="plans" />} />
        <Route path="merchant-pay" element={<MerchantPayPage />} />
        <Route path="update-order" element={<UpdateOrderPage />} />
        <Route path="cardholder" element={<CardHolderPage />} />
        <Route path="playground" element={<PlaygroundPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
