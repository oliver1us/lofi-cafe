import { useEffect, useRef, useState } from 'react';
import { playSound } from '../lib/sounds';

export function Pomodoro({ visible }: { visible: boolean }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const rounds = useRef(0);
  const deadline = useRef(0);

  useEffect(() => {
    if (!running) return;
    deadline.current = Date.now() + seconds * 1000;
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
    // A deadline prevents timer drift in background tabs; changes while running update it explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (seconds !== 0 || !running) return;
    setRunning(false);
    if (phase === 'work') {
      rounds.current += 1;
      setSeconds(rounds.current % 4 === 0 ? 15 * 60 : 5 * 60);
      setPhase('break');
      playSound('endWork');
    } else {
      setSeconds(25 * 60); setPhase('work'); playSound('endPause');
    }
  }, [seconds, running, phase]);

  function addTime() {
    if (running) deadline.current += 300000;
    setSeconds(n => n + 300);
    if (!running) { setPhase('work'); setRunning(true); playSound('endWork'); }
  }
  function reset() { setRunning(false); setSeconds(1500); setPhase('work'); }
  const pristine = seconds === 1500 || seconds === 300 || seconds === 900;

  return <section hidden={!visible} className="pomodoro panel vertical" aria-label="Pomodoro Timer">
    <span className={phase === 'break' ? 'blue' : running ? 'red' : ''} role="timer" aria-label="Time remaining">
      {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
    </span>
    <div>
      <button onClick={() => setRunning(n => !n)}>{running ? 'Pause' : pristine ? 'Start' : 'Continue'}</button>
      {!running && !pristine && <button className="timer-stop" onClick={reset}>Stop</button>}
    </div>
    {(phase === 'work' || !running) && <button onClick={addTime}>+5:00</button>}
  </section>;
}
