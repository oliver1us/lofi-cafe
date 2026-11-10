import { useEffect, useRef, useState } from 'react';
import { AmbientEngine, normalizeMix, type AmbientId } from '../lib/ambience';
import { useStoredState } from '../lib/storage';

export function useAmbience() {
  const [stored, setStored] = useStoredState<unknown>('ambientMix', {});
  const mix = normalizeMix(stored);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const engine = useRef<AmbientEngine | null>(null);
  const pending = useRef(0);

  useEffect(() => () => {
    pending.current++;
    engine.current?.dispose();
    engine.current = null;
  }, []);

  useEffect(() => {
    if (ready) engine.current?.update(normalizeMix(stored), muted);
  }, [stored, muted, ready]);

  async function activate() {
    const request = ++pending.current;
    try {
      engine.current ??= new AmbientEngine();
      await engine.current.resume();
      if (request !== pending.current) return;
      setReady(true);
      setError('');
      setMuted(false);
    } catch {
      if (request === pending.current) setError('Ambient audio could not start. Try Resume sounds or check your browser’s audio permissions.');
    }
  }

  function toggle(id: AmbientId) {
    const next = !mix[id].enabled;
    setStored((previous: unknown) => {
      const current = normalizeMix(previous);
      return { ...current, [id]: { ...current[id], enabled: !current[id].enabled } };
    });
    if (next) void activate();
  }

  function volume(id: AmbientId, value: number) {
    setStored((previous: unknown) => {
      const current = normalizeMix(previous);
      return { ...current, [id]: { ...current[id], volume: Math.max(0, Math.min(1, value)) } };
    });
    if (ready && !muted && mix[id].enabled && value > 0) void activate();
  }

  return { mix, muted, ready, error, toggle, volume, resume: activate,
    mute: () => { pending.current++; setMuted(true); } };
}
