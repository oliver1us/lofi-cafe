interface Props { volume: number; onChange: (volume: number) => void }

export function Volume({ volume, onChange }: Props) {
  return <div className="volume" title={`Volume ${Math.round(volume * 100)}%`}>
    <div className="volume-blocks" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => <div key={i}
        className={volume > 0.02 ? 'green-box' : 'red-box'}
        style={{ opacity: volume > (i === 0 ? 0.02 : i / 10) ? 1 : 0.5 }} />)}
    </div>
    <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={volume}
      onChange={e => onChange(Number(e.target.value))} />
  </div>;
}
