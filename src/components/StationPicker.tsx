import { useEffect, useRef } from 'react';
import { gifUrl, stations } from '../data/catalog';
import { Icon } from './Icon';

interface Props { stationId: string; onSelect: (id: string) => void; onClose: () => void }

export function StationPicker({ stationId, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
    return () => previous?.focus({ preventScroll: true });
  }, []);

  function trapTab(event: React.KeyboardEvent) {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const items = [...ref.current!.querySelectorAll<HTMLElement>('button, a')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div id="stations-list" ref={ref} role="dialog" aria-modal="true" aria-label="Choose a station"
    onClick={onClose} onKeyDown={trapTab}>
    <div className="station-grid">
      {stations.map(station => <div className="station-wrapper" key={station.id}>
        <button className="station-choice" type="button" aria-label={station.name}
          aria-pressed={station.id === stationId} onClick={() => onSelect(station.id)}>
          <span className={`station-thumbnail ${station.id === stationId ? 'green-box' : ''}`}
            style={{ backgroundImage: `url(${gifUrl('station_thumb_' + station.id)})` }} />
          <span className="station-name">{station.name}</span>
        </button>
        <a className="station-external" href={`https://www.youtube.com/watch?v=${station.id}`} target="_blank"
          rel="noopener noreferrer" aria-label={`Open ${station.name} on YouTube`} onClick={e => e.stopPropagation()}>
          <Icon name="open" />
        </a>
      </div>)}
    </div>
    <button className="sr-only picker-close" onClick={onClose}>Close stations</button>
  </div>;
}
