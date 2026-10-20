import type { CSSProperties, ReactNode } from 'react';
import { shellCanvas } from '../lib/appearance';

export function WidgetShell({
  children,
  tone = 'page',
  surfaceColor,
  canvasColor,
  flush = false,
}: {
  children: ReactNode;
  tone?: 'page' | 'light' | 'dark';
  surfaceColor?: string;
  canvasColor?: string;
  /** Drop side padding so the iframe fills the preview card. */
  flush?: boolean;
}) {
  const canvas =
    canvasColor ?? (tone === 'dark' ? '#09090b' : tone === 'light' ? '#f4f3fb' : undefined);
  const surface =
    tone === 'page' ? 'bg-white text-[#16141a] dark:bg-[#18181b] dark:text-[#fafafa]' : '';
  const surfaceStyle: CSSProperties | undefined = surfaceColor
    ? { backgroundColor: surfaceColor, color: tone === 'dark' ? '#fafafa' : '#16141a' }
    : tone === 'dark'
      ? { backgroundColor: shellCanvas.dark, color: '#fafafa' }
      : tone === 'light'
        ? { backgroundColor: shellCanvas.light, color: '#16141a' }
        : undefined;

  return (
    <div
      className="relative w-full"
      style={canvas ? ({ '--canvas': canvas } as CSSProperties) : undefined}
    >
      <div className="widget-border">
        <div className="widget-glow" aria-hidden="true" />
        <div
          className={`relative h-auto rounded-3xl pt-6 pb-5 ${flush ? 'px-0' : 'px-6'} ${surface}`}
          style={surfaceStyle}
        >
          <div className="widget-bloom" aria-hidden="true" />
          <div className="relative z-[1]">{children}</div>
        </div>
      </div>
    </div>
  );
}
