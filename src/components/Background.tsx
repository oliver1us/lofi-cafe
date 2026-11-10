import { useEffect, useState } from 'react';
import { backgrounds, gifUrl, randomOther } from '../data/catalog';

export function Background({ index, staticVisible }: { index: number; staticVisible: boolean }) {
  const [next, setNext] = useState(() => randomOther(backgrounds.length, index));
  useEffect(() => { setNext(randomOther(backgrounds.length, index)); }, [index]);
  return <>
    <img className="scene" src={gifUrl(backgrounds[index] ?? backgrounds[0])} alt="" fetchPriority="high" />
    <img className="preload" src={gifUrl(backgrounds[next])} alt="" aria-hidden="true" />
    <img className={`scene static-screen ${staticVisible ? 'visible' : ''}`} src={gifUrl('static1')} alt="" aria-hidden="true" />
    <div id="darken" />
    <div id="crt-lines" />
    <div id="vignette" />
  </>;
}
