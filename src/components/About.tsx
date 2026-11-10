import { copy } from '../lib/locale';

interface Props { disabled: boolean; onDisable: (disabled: boolean) => void }

export function About({ disabled, onDisable }: Props) {
  const shortcuts = [
    [copy.arrows, copy.changeStation, 4], [copy.spacebar, copy.playPause, 16],
    ['T', copy.tweetThisStation, 4], ['G', copy.changeGif, 4], ['V', copy.showVideo, 12],
    ['L', copy.lowPowerMode, 4], ['ESC', copy.closeThis, 12],
  ] as const;
  return <section className="about-container panel" aria-label="About and keyboard shortcuts">
    <div className="team">
      {['linuz90', 'maridivi89'].map((username, i) => <a key={username} href={`https://twitter.com/${username}`}
        target="_blank" rel="noopener noreferrer" className="team-member">
        <img className="green-box-small" src={`/assets/profiles/${username}.png`} alt={i === 0 ? 'Fabrizio' : 'Marianna'} />
        <span>@{username}</span>
      </a>)}
    </div>
    {shortcuts.map(([key, description, bottom]) => <span key={key} style={{ marginBottom: bottom }}>
      <span className="red">{key}</span> {description}
    </span>)}
    <label className="shortcuts-label">Disable keyboard shortcuts
      <input type="checkbox" checked={disabled} onChange={e => onDisable(e.target.checked)} />
    </label>
    <a href="mailto:hey@lofi.cafe">{copy.sayHi}</a>
  </section>;
}
