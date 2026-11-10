const sounds = new Map<string, HTMLAudioElement>();

export function playSound(name: 'static' | 'endWork' | 'endPause') {
  let audio = sounds.get(name);
  if (!audio) {
    audio = new Audio(`/assets/sounds/${name}.mp3`);
    audio.volume = name === 'static' ? 0.3 : 0.7;
    sounds.set(name, audio);
  }
  audio.currentTime = 0;
  void audio.play().catch(() => { /* Browser autoplay restrictions must not block the UI. */ });
}
