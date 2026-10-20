import { useEffect, useState } from 'react';

const WIDE_QUERY = '(min-width: 1181px)';

export function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return wide;
}
