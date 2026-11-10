import { useEffect, useState } from 'react';

export function Typewriter({ text, delay = 0, cursor = false }: { text: string; delay?: number; cursor?: boolean }) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    setLength(0);
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      interval = setInterval(() => setLength(n => {
        if (n >= text.length) clearInterval(interval);
        return Math.min(n + 1, text.length);
      }), 40);
    }, delay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, delay]);
  return <><span>{text.slice(0, length)}</span>{cursor &&
    <span aria-hidden="true" className={`cursor ${length === text.length ? 'blink' : ''}`}>█</span>}</>;
}
