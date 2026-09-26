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
  return <button className="sound-toggle" onClick={() => void toggle()} aria-pressed={enabled}>{enabled ? 'Silenciar' : 'Activar sonido'}</button>;
}
