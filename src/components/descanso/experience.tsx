'use client';

import { useCallback, useState } from 'react';
import { Opening, type Pausa } from '../apertura/opening';
import { Rhythms, type Intencion } from '../ritmos/rhythms';
import { P08Experience } from '../p08/experience';
import { P08Reading } from '../p08/reading';
import { SoundProvider, SoundToggle } from './sound';

// Recorrido continuo del piloto. Cada estación termina un tramo: el siguiente se incorpora
// al pulsar «Continuar», así un gesto rápido no atraviesa una actividad pendiente.
// Las elecciones viven en memoria mientras dura la visita.
export function DescansoExperience() {
  const [pausa, setPausa] = useState<Pausa | null>(null);
  const [intencion, setIntencion] = useState<Intencion | null>(null);
  const [reached, setReached] = useState(0);
  const toRhythms = useCallback(() => setReached(r => Math.max(r, 1)), []);
  const toEarth = useCallback(() => setReached(r => Math.max(r, 2)), []);
  return <SoundProvider>
    <SoundToggle />
    <Opening pausa={pausa} onPausa={setPausa} onUnlock={toRhythms} />
    {reached >= 1 && <Rhythms intencion={intencion} onIntencion={setIntencion} onUnlock={toEarth} pausa={pausa} />}
    {reached >= 2 && <><P08Experience pausa={pausa} embedded /><P08Reading /></>}
  </SoundProvider>;
}
