import { useEffect, useRef } from 'react';
import { ambientSounds } from '../lib/ambience';
import type { useAmbience } from '../hooks/useAmbience';

export function AmbientMixer({ audio, onClose }: { audio: ReturnType<typeof useAmbience>; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const active = ambientSounds.filter(sound => audio.mix[sound.id].enabled).length;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, []);

  return <section id="ambient-mixer" className="panel ambient-mixer" ref={ref} aria-label="Ambient sounds"
    onKeyDown={event => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    }}>
    <div className="ambient-heading"><span>MAKE YOURSELF AT HOME</span><button onClick={onClose} aria-label="Close ambient sounds">×</button></div>
    <h2>Sounds of somewhere</h2>
    <p>Layer a little nature over your music.</p>
    <div className="ambient-channels">
      {ambientSounds.map(sound => {
        const channel = audio.mix[sound.id];
        return <div className={`ambient-channel ${channel.enabled ? 'enabled' : ''}`} key={sound.id}>
          <button className="ambient-toggle" aria-pressed={channel.enabled} aria-label={sound.name} onClick={() => audio.toggle(sound.id)}>
            <span className="ambient-mark" aria-hidden="true">{sound.mark}</span>
            <span>{sound.name}<small>{sound.detail}</small></span>
            <span className="ambient-indicator" aria-hidden="true">{channel.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <div className="ambient-level"><input type="range" min="0" max="1" step="0.01" value={channel.volume}
            aria-label={`${sound.name} volume`} onChange={event => audio.volume(sound.id, Number(event.target.value))} />
            <span aria-hidden="true">{Math.round(channel.volume * 100)}%</span></div>
        </div>;
      })}
    </div>
    <div className="ambient-footer">
      <span role="status">{!audio.ready && active ? 'Saved mix · press Resume' : audio.muted ? 'Sounds muted' : `${active} sound${active === 1 ? '' : 's'} selected`}</span>
      {audio.muted || !audio.ready
        ? <button onClick={() => void audio.resume()} disabled={!active}>Resume sounds</button>
        : <button onClick={audio.mute}>Mute all sounds</button>}
    </div>
    {audio.error && <p className="red" role="alert">{audio.error}</p>}
    <p className="ambient-note">Synthesized soundscapes · independent of music<br />Your mix is saved. Audio stays off after a reload.</p>
  </section>;
}
