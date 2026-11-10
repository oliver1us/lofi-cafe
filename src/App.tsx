import { useCallback, useEffect, useRef, useState } from 'react';
import { backgrounds, initialStationId, randomOther, stations } from './data/catalog';
import { Background } from './components/Background';
import { About } from './components/About';
import { Pomodoro } from './components/Pomodoro';
import { Icon, IconButton } from './components/Icon';
import { StationPicker } from './components/StationPicker';
import { Typewriter } from './components/Typewriter';
import { Volume } from './components/Volume';
import { useStoredState } from './lib/storage';
import { playSound } from './lib/sounds';
import { copy, language } from './lib/locale';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { usePresence } from './hooks/usePresence';
import { useAmbience } from './hooks/useAmbience';
import { AmbientMixer } from './components/AmbientMixer';

type Panel = 'about' | 'timer' | 'stations' | 'sounds' | null;

export default function App() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [storedStation, setStoredStation] = useStoredState('currentStationId', initialStationId());
  const queryStation = useRef(new URLSearchParams(location.search).get('station'));
  const stationId = stations.some(s => s.id === queryStation.current) ? queryStation.current! : storedStation;
  const station = stations.find(s => s.id === stationId) ?? stations[0];
  const stationIndex = stations.indexOf(station);
  const [volume, setVolume] = useStoredState('playerVolume', 0.7);
  const [gifIndex, setGifIndex] = useStoredState('currentGifIndex', 0);
  const [lowEnergy, setLowEnergy] = useStoredState('lowEnergyMode', false);
  const [showVideo, setShowVideo] = useStoredState('embedShown', false);
  const [disabled, setDisabled] = useStoredState('disableShortcut', false);
  const [aboutSeen, setAboutSeen] = useStoredState('aboutShown', false);
  const [stationClicked, setStationClicked] = useStoredState('stationClicked', false);
  const [panel, setPanel] = useState<Panel>(null);
  const [staticVisible, setStaticVisible] = useState(false);
  const staticTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [frame, setFrame] = useState(1);
  const [fullScreen, setFullScreen] = useState(false);
  const [longBuffering, setLongBuffering] = useState(false);
  const failedStations = useRef(new Set<string>());
  const player = useYouTubePlayer({ stationId: station.id, playing, volume: Math.min(1, Math.max(0, volume)) });
  const listenerCount = usePresence(playing && player.status === 'playing');
  const ambience = useAmbience();
  const touch = matchMedia('(pointer: coarse)').matches;

  const changeGif = useCallback(() => setGifIndex(index => randomOther(backgrounds.length, index)), [setGifIndex]);
  const start = () => { if (!started) { setStarted(true); setPlaying(true); } };
  const selectStation = useCallback((id: string, userInitiated = true) => {
    if (userInitiated) failedStations.current.clear();
    queryStation.current = null;
    setStoredStation(id);
    setPanel(null);
    changeGif();
    setStaticVisible(true);
    playSound('static');
    clearTimeout(staticTimeout.current);
    staticTimeout.current = setTimeout(() => setStaticVisible(false), 300);
  }, [setStoredStation, changeGif]);
  const nextStation = (direction: number) => selectStation(stations[(stationIndex + direction + stations.length) % stations.length].id);
  const shuffleStation = () => selectStation(stations[randomOther(stations.length, stationIndex)].id);
  const tweet = () => {
    const url = new URL(location.href);
    url.search = new URLSearchParams({ station: station.id }).toString();
    window.open(`https://twitter.com/intent/tweet?${new URLSearchParams({ text: `Chilling with 🎧 ${station.name}`, url: url.toString() })}`, '_blank', 'noopener,noreferrer');
  };
  const togglePlayback = () => {
    if (player.status === 'blocked') { player.resume(); setPlaying(true); return; }
    setPlaying(n => !n);
  };

  useEffect(() => {
    const interval = setInterval(() => setFrame(n => n % 4 + 1), 250);
    return () => { clearInterval(interval); clearTimeout(staticTimeout.current); };
  }, []);
  useEffect(() => {
    const onFullscreen = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);
  useEffect(() => {
    if (!started || aboutSeen || touch || innerWidth < 600) return;
    const timeout = setTimeout(() => { setPanel('about'); setAboutSeen(true); }, 1000);
    return () => clearTimeout(timeout);
  }, [started, aboutSeen, setAboutSeen, touch]);
  useEffect(() => {
    setLongBuffering(false);
    if (!playing || !['loading', 'buffering'].includes(player.status)) return;
    const timeout = setTimeout(() => setLongBuffering(true), 3000);
    return () => clearTimeout(timeout);
  }, [player.status, station.id, playing]);
  useEffect(() => {
    if (!playing || !player.error || ![100, 101, 150].includes(player.error)) return;
    failedStations.current.add(station.id);
    const available = stations.filter(s => !failedStations.current.has(s.id));
    if (!available.length) { setPlaying(false); return; }
    const timeout = setTimeout(() => selectStation(available[Math.floor(Math.random() * available.length)].id, false), 4000);
    return () => clearTimeout(timeout);
  }, [player.error, playing, station.id, selectStation]);

  // One handler owns shortcuts; editable fields are deliberately excluded.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.ctrlKey || event.metaKey || event.altKey || target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'Escape') { setPanel(null); return; }
      if (disabled || event.repeat) return;
      if (!started) { event.preventDefault(); setStarted(true); setPlaying(true); return; }
      const key = event.key.toLowerCase();
      if ((event.key === ' ' || event.key === 'Enter') && target.closest('button, a')) return;
      if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) event.preventDefault();
      switch (key) {
        case ' ': togglePlayback(); break;
        case 'arrowright': nextStation(1); break;
        case 'arrowleft': nextStation(-1); break;
        case 'arrowup': setVolume(v => Math.round(Math.min(1, v + 0.1) * 10) / 10); break;
        case 'arrowdown': setVolume(v => Math.round(Math.max(0, v - 0.1) * 10) / 10); break;
        case 'g': changeGif(); break;
        case 'l': setLowEnergy(n => !n); break;
        case 'v': setShowVideo(n => !n); break;
        case 't': tweet(); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  let message = '';
  if (player.error && [100, 101, 150].includes(player.error)) message = failedStations.current.size >= stations.length
    ? 'No stations available. Try again or open on YouTube.' : 'Ops, this station is not working. Skipping it';
  else if (player.status === 'error') message = 'YouTube is unavailable. Try another station or open on YouTube.';
  else if (player.status === 'blocked') message = 'Autoplay blocked. Press play to listen.';
  else if (longBuffering) message = 'Buffering';

  return <main id="container" className={`${lowEnergy ? 'low-energy' : ''} ${!started ? 'pointer' : ''} ${language === 'ja' ? 'ja' : ''}`} onClick={start}>
    <Background index={Number.isInteger(gifIndex) && gifIndex >= 0 && gifIndex < backgrounds.length ? gifIndex : 0} staticVisible={staticVisible} />
    <div className={`yt-wrapper ${started && showVideo ? 'shown' : ''}`} aria-hidden={!showVideo}>
      <div className="yt-inner"><div className="yt-player" ref={player.hostRef} /></div>
    </div>
    {started && !panel && <button className="play-pause-area" onClick={togglePlayback}
      aria-label={playing ? 'Pause music' : 'Play music'} tabIndex={-1}>
      <Icon name={playing ? 'pause' : 'play'} />
    </button>}
    <header id="top-ui">
      <div>{listenerCount !== null && listenerCount >= 3 && <span id="visitors-counter" className="red">
        <Typewriter text={`${copy.listeningNow} ${listenerCount.toLocaleString('en')}`} delay={1000} />
        <span className="blink listener-dot">•</span>
      </span>}</div>
      <div className="vertical">
        {started && <nav id="horizontal" aria-label="Room actions">
          {document.fullscreenEnabled && <IconButton className="hide-small-screen" icon={fullScreen ? 'fullscreen-exit' : 'fullscreen-enter'} label="Fullscreen"
            onClick={() => { void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {}); }} />}
          {!touch && <IconButton icon="facebook" label="Facebook" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`, '_blank', 'noopener,noreferrer')} />}
          <IconButton icon="twitter" label="Tweet" onClick={tweet} />
          <IconButton icon="nature" label="Ambient sounds" aria-expanded={panel === 'sounds'} aria-controls="ambient-mixer"
            onClick={() => setPanel(panel === 'sounds' ? null : 'sounds')} />
          <IconButton icon="timer" label="Pomodoro Timer" aria-expanded={panel === 'timer'} onClick={() => setPanel(panel === 'timer' ? null : 'timer')} />
          <IconButton icon="heart" label="About" aria-expanded={panel === 'about'} onClick={() => setPanel(panel === 'about' ? null : 'about')} />
        </nav>}
        {panel === 'about' && <About disabled={disabled} onDisable={setDisabled} />}
        {panel === 'sounds' && <AmbientMixer audio={ambience} onClose={() => setPanel(null)} />}
        <Pomodoro visible={panel === 'timer'} />
      </div>
    </header>
    {!started && <button className="start-prompt" aria-label={touch ? copy.tapToStart : copy.pressToStart}>
      <Typewriter text={touch ? copy.tapToStart : copy.pressToStart} delay={1500} cursor />
    </button>}
    {started && <footer className="player-ui">
      {message && panel !== 'stations' && <div className="player-message red" role="status">
        {message}{!message.endsWith('.') && <span className="loading-dots" />}
        {player.status === 'error' && <a className="error-link" href={`https://www.youtube.com/watch?v=${station.id}`} target="_blank" rel="noopener noreferrer" aria-label="Open current station on YouTube"><Icon name="open" /></a>}
      </div>}
      <div className="spacer-14" />
      <div id="buttons-ui"><div className="playback-controls">
        <IconButton icon={playing && player.status !== 'blocked' ? 'pause' : 'play'} label={playing && player.status !== 'blocked' ? 'Pause' : 'Play'} onClick={togglePlayback} />
        <IconButton icon="shuffle" label="Shuffle" onClick={shuffleStation} />
        <IconButton icon="previous" label="Previous station" onClick={() => nextStation(-1)} />
        <IconButton icon="forward" label="Next station" onClick={() => nextStation(1)} />
        <Volume volume={volume} onChange={setVolume} />
      </div></div>
      <div className="spacer-12" />
      <button id="stations-button" aria-label={copy.changeStation} aria-haspopup="dialog" aria-expanded={panel === 'stations'}
        onClick={() => { setStationClicked(true); setPanel(panel === 'stations' ? null : 'stations'); }}>
        <Icon name={!playing || volume < 0.1 ? 'beatsMute' : `${player.status === 'playing' ? 'beats' : 'buffering'}${frame}`} />
        <span>{!stationClicked && !touch && <span className="red change-hint">click to change {'>'} </span>}{station.name}</span>
      </button>
      {panel === 'stations' && <StationPicker stationId={station.id} onClose={() => setPanel(null)} onSelect={id => {
        if (id !== station.id) selectStation(id);
        else setPanel(null);
        setPlaying(true);
      }} />}
    </footer>}
  </main>;
}
