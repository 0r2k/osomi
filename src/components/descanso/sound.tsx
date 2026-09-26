'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OpeningAudio } from '../apertura/audio';

// Un único paisaje sonoro para todo el recorrido. Opcional: el visitante lo activa.
type Sound = { get: () => OpeningAudio | null; enabled: boolean; toggle: () => Promise<void> };
const SoundContext = createContext<Sound>({ get: () => null, enabled: false, toggle: async () => {} });

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<OpeningAudio | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const onVisibility = () => { void audio.current?.hold(document.hidden); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      audio.current?.close();
      audio.current = null;
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!audio.current) audio.current = new OpeningAudio();
    const next = !audio.current.enabled;
    await audio.current.setEnabled(next);
    setEnabled(next);
  }, []);
  const get = useCallback(() => audio.current, []);

  return <SoundContext.Provider value={{ get, enabled, toggle }}>{children}</SoundContext.Provider>;
}

export const useSound = () => useContext(SoundContext);

export function SoundToggle() {
  const { enabled, toggle } = useSound();
  return <button className="sound-toggle" onClick={() => void toggle()} aria-pressed={enabled}>
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />{enabled
      ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      : <path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}</svg>
    <span className="sound-label">{enabled ? 'Silenciar' : 'Activar sonido'}</span>
  </button>;
}
