import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useWide } from '../hooks/useWide';
import { hearth, lumen, pulse } from '../lib/catalog';
import { useTheme } from '../theme';

interface NavItem {
  to: string;
  title: string;
  image?: string;
  end?: boolean;
  fromMenu?: boolean;
}

const sections: { label: string; muted?: boolean; items: NavItem[] }[] = [
  {
    label: 'Integrations',
    items: [
      {
        to: '/',
        end: true,
        title: 'Payment form',
        fromMenu: true,
      },
      {
        to: '/embedded',
        title: 'Payment Card',
      },
      {
        to: '/pay-with-card',
        title: 'Pay with card',
      },
      {
        to: '/wallets',
        title: 'Wallets',
      },
    ],
  },
  {
    label: 'Example app',
    items: [
      {
        to: '/lumen',
        title: 'Lumen shop',
        image: `/products/${lumen.products[0].image}`,
      },
      {
        to: '/hearth',
        title: 'Hearth Café',
        image: `/products/${hearth.products[0].image}`,
      },
      {
        to: '/pulse',
        title: 'Pulse Studio',
        image: `/products/${pulse.products[0].image}`,
      },
    ],
  },
  {
    label: 'Advanced',
    items: [
      {
        to: '/merchant-pay',
        title: 'Merchant Pay button',
      },
      {
        to: '/update-order',
        title: 'Update order',
      },
      {
        to: '/cardholder',
        title: 'Card holder verification',
      },
    ],
  },
  {
    label: 'Internal',
    muted: true,
    items: [
      {
        to: '/playground',
        title: 'Playground',
      },
    ],
  },
];

export function Shell() {
  const wide = useWide();
  const location = useLocation();
  const onMenu = location.pathname === '/menu';

  if (wide && onMenu) return <Navigate to="/" replace />;

  if (!wide && onMenu) {
    return (
      <div className="min-h-screen overflow-auto bg-[#f4f3fb] px-4 pt-[22px] pb-8 font-sans font-medium tracking-[-0.01em] text-[#16141a] antialiased dark:bg-[#09090b] dark:text-[#fafafa]">
        <MenuPanel />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#f4f3fb] font-sans font-medium tracking-[-0.01em] text-[#16141a] antialiased wide:grid-cols-[280px_minmax(0,1fr)] dark:bg-[#09090b] dark:text-[#fafafa]">
      <aside className="sticky top-0 hidden h-screen overflow-auto border-r border-black/[0.08] bg-white px-4 pt-[22px] pb-8 wide:block dark:border-white/12 dark:bg-[#18181b]">
        <MenuPanel />
      </aside>
      <main className="min-w-0 px-10 pt-8 pb-16">
        {wide ? null : (
          <Link
            to="/menu"
            className="mb-6 inline-flex text-sm font-semibold text-inherit no-underline"
          >
            ← Menu
          </Link>
        )}
        <Outlet />
      </main>
    </div>
  );
}

function MenuPanel() {
  const { mode, toggle } = useTheme();

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-1.5">
        <XMoneyLogo />
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-full border border-black/[0.08] bg-transparent dark:border-white/12"
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggle}
        >
          {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <p className="mx-1.5 mt-3 mb-2 text-[13px] text-black/55 dark:text-zinc-400">
        Copy-paste samples, merchant stores, and an internal playground.
      </p>
      {sections.map((section) => (
        <div key={section.label} className={section.muted ? 'mt-[18px] opacity-70' : 'mt-[18px]'}>
          <p className="mx-2 mb-1.5 text-xs font-bold tracking-[0.1em] text-black/55 uppercase dark:text-zinc-400">
            {section.label}
          </p>
          <ul className="m-0 list-none p-0">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  state={item.fromMenu ? { fromMenu: true } : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-semibold text-inherit no-underline ${
                      isActive ? 'bg-[#7c4dff]/10' : ''
                    }`
                  }
                >
                  {item.image ? (
                    <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded-[10px] object-cover" />
                  ) : null}
                  {item.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function XMoneyLogo() {
  return (
    <svg
      viewBox="0 0 200 54"
      className="h-[17px] w-auto text-[#9691a3] dark:text-white"
      fill="currentColor"
      role="img"
      aria-label="xMoney"
    >
      <path d="M180.628 50.6737H175.347L180.292 39.8495L167.573 12.7811H173.42L183.015 33.8531L192.611 12.7811H197.946L180.622 50.6706L180.628 50.6737Z" />
      <path d="M53.2934 33.0605L63.5609 8.5708H71.2188V40.5027H66.1706V13.4592L54.8249 40.6742H51.1942L39.9627 13.6276V40.5027H35.0857V8.5708H43.0829L53.2934 33.0605V33.0605Z" />
      <path d="M104.21 26.7277C104.21 34.9435 97.9522 41.2006 89.809 41.2006C81.6657 41.2006 75.4081 34.9435 75.4081 26.7277C75.4081 18.512 81.61 12.2549 89.809 12.2549C98.0079 12.2549 104.21 18.512 104.21 26.7277ZM99.0049 26.7277C99.0049 21.1954 95.2956 16.95 89.8121 16.95C84.3285 16.95 80.6192 21.3078 80.6192 26.7277C80.6192 32.1476 84.3285 36.5054 89.8121 36.5054C95.2956 36.5054 99.0049 32.2601 99.0049 26.7277Z" />
      <path d="M113.993 40.148H108.923V12.8632H113.993V17.8903C115.052 15.6825 118.226 12.2549 123.352 12.2549C130.316 12.2549 135.106 17.3932 135.106 24.4614V40.148H129.98V25.4001C129.98 20.2618 126.859 16.8929 122.125 16.8929C117.391 16.8929 113.99 20.4286 113.99 25.4001V40.148H113.993Z" />
      <path d="M166.523 27.34H144.274C144.543 32.4819 148.117 36.5054 153.368 36.5054C158.618 36.5054 160.891 33.544 161.327 32.6506H166.199C165.767 35.0528 162.356 41.2006 153.371 41.2006C145.088 41.2006 139.296 34.831 139.296 26.7277C139.296 18.6244 145.088 12.2549 152.884 12.2549C160.679 12.2549 166.526 18.2902 166.526 27.3431L166.523 27.34ZM144.598 23.0947H161.055C159.811 18.9025 156.942 16.6127 152.881 16.6127C148.55 16.6127 145.627 19.0711 144.598 23.0947V23.0947Z" />
      <path d="M14.9688 16.6331L27.029 10.1326L25.0015 6.20094L13.9581 10.7073C13.6737 10.8235 13.3585 10.8235 13.0741 10.7073L2.02759 6.20408L3.05176e-05 10.1326L12.0603 16.6331L3.05176e-05 23.1335L2.02759 27.0652L13.071 22.5588C13.3554 22.4426 13.6706 22.4426 13.955 22.5588L24.9984 27.0652L27.026 23.1335L14.9657 16.6331H14.9688Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
      <path
        d="M16.5 13.5A6.5 6.5 0 0 1 10 4.2 7 7 0 1 0 19.8 14a6.5 6.5 0 0 1-3.3-.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
