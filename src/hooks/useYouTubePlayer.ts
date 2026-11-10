import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window { YT: typeof YT; onYouTubeIframeAPIReady?: () => void }
}

let apiPromise: Promise<typeof YT> | undefined;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { apiPromise = undefined; reject(new Error('YouTube is unavailable')); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export type PlayerStatus = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'blocked' | 'error';

interface Options { stationId: string; playing: boolean; volume: number }

export function useYouTubePlayer({ stationId, playing, volume }: Options) {
  const hostRef = useRef<HTMLDivElement>(null);
  const player = useRef<YT.Player | null>(null);
  const latest = useRef({ stationId, playing, volume });
  latest.current = { stationId, playing, volume };
  const loadedId = useRef(stationId);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let initialized = false;
    const timeout = setTimeout(() => { if (!initialized && !disposed) setStatus('error'); }, 15000);
    void loadApi().then(api => {
      if (disposed || !hostRef.current) return;
      const target = document.createElement('div');
      hostRef.current.appendChild(target);
      player.current = new api.Player(target, {
        width: '100%', height: '100%', videoId: latest.current.stationId,
        playerVars: { autoplay: 0, controls: 0, playsinline: 1, rel: 0, iv_load_policy: 3, origin: location.origin },
        events: {
          onReady: event => {
            if (disposed) return;
            initialized = true;
            clearTimeout(timeout);
            loadedId.current = latest.current.stationId;
            event.target.setVolume(latest.current.volume * 100);
            setReady(true);
            if (latest.current.playing) event.target.playVideo();
          },
          onStateChange: event => {
            if (disposed || loadedId.current !== latest.current.stationId) return;
            // Ignore late events from the outgoing stream when changing stations.
            const url = event.target.getVideoUrl();
            if (url && !url.includes(latest.current.stationId)) return;
            if (event.data === api.PlayerState.PLAYING) { setError(null); setStatus('playing'); }
            else if (event.data === api.PlayerState.BUFFERING) setStatus('buffering');
            else if (event.data === api.PlayerState.PAUSED) setStatus('paused');
            else if (event.data === api.PlayerState.ENDED && latest.current.playing) {
              setError(100); setStatus('error');
            }
          },
          onError: event => {
            if (!disposed && loadedId.current === latest.current.stationId) {
              const url = event.target.getVideoUrl();
              if (url && !url.includes(latest.current.stationId)) return;
              setError(event.data); setStatus('error');
            }
          },
          onAutoplayBlocked: () => { if (!disposed) setStatus('blocked'); },
        },
      });
    }).catch(() => { if (!disposed) setStatus('error'); });
    return () => { disposed = true; clearTimeout(timeout); player.current?.destroy(); player.current = null; };
  }, []);

  useEffect(() => {
    if (!ready || !player.current) return;
    setError(null);
    loadedId.current = stationId;
    setStatus(latest.current.playing ? 'loading' : 'idle');
    if (latest.current.playing) player.current.loadVideoById(stationId);
    else player.current.cueVideoById(stationId);
  }, [ready, stationId]);

  useEffect(() => {
    if (!ready || !player.current) return;
    if (playing) { setError(null); setStatus('loading'); player.current.playVideo(); }
    else { player.current.pauseVideo(); setStatus('paused'); }
  }, [ready, playing]);

  useEffect(() => { if (ready) player.current?.setVolume(volume * 100); }, [ready, volume]);

  const resume = () => { player.current?.playVideo(); };
  return { hostRef, ready, status, error, resume };
}
