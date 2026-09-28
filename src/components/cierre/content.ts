// Contenido editorial compartido por el cierre (P11–P12) y el libro del tema.

export const SOURCES = {
  S1: { label: 'NHLBI · Why Is Sleep Important?', href: 'https://www.nhlbi.nih.gov/health/sleep/why-sleep-important', scope: 'Síntesis institucional sobre sueño, salud, aprendizaje y memoria. No describe casos personales.' },
  S2: { label: 'NHLBI · Your Sleep/Wake Cycle', href: 'https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle', scope: 'Ritmos circadianos cercanos a 24 horas y su relación con la luz. No implica un ciclo semanal.' },
  A1: { label: 'NASA · Día solar y sideral', href: 'https://science.nasa.gov/learn/basics-of-space-flight/chapter2-1/', scope: 'Diferencia entre el día solar medio (≈24 h) y el sideral (≈23 h 56 min).' },
  A2: { label: 'NASA · Datos de la Tierra', href: 'https://science.nasa.gov/earth/facts/', scope: 'Rotación y órbita terrestre; cifras aproximadas de divulgación.' },
  H1: { label: 'UCL · La semana de siete días', href: 'https://www.ucl.ac.uk/arts-humanities/hebrew-jewish/hjs-research/research-projects-hjs/calendars-late-antiquity-and-middle-ages-standardization-and-fixation/seven-day-week-roman-empire-and-near-east', scope: 'Tradiciones de la semana del sábado y la semana planetaria. Orienta la cautela histórica.' },
  B1: { label: 'Iglesia Adventista · Creencia fundamental 20', href: 'https://gc.adventist.org/beliefs/', scope: 'Fuente doctrinal, no científica: el sábado como día de descanso, adoración y servicio.' },
} as const;
export type SourceKey = keyof typeof SOURCES;

export type Question = { id: string; ask: string; options: string[]; answer: number; feedback: string; takeaway: string; source: SourceKey | null; biblical?: boolean };
export const QUESTIONS: Question[] = [
  { id: 'lab', ask: '¿Qué puede mostrar la actividad de las dos rondas?', options: ['Cómo te fue en esas condiciones de juego', 'Tu nivel de estrés clínico', 'Cuánto necesitas dormir'], answer: 0,
    feedback: 'Fue una demostración educativa: describe un momento de juego, influido por la práctica, el azar y el dispositivo. No diagnostica tu salud ni tu atención.', takeaway: 'Una prueba breve permite observar, no diagnosticar.', source: null },
  { id: 'ritmo', ask: 'Los ritmos circadianos describen principalmente un ciclo cercano a…', options: ['24 horas', 'Siete días', 'Un mes'], answer: 0,
    feedback: 'El organismo tiene ritmos cercanos a 24 horas, y la luz y la oscuridad ayudan a sincronizarlos. No son evidencia de un ciclo semanal.', takeaway: 'Tu cuerpo sigue ritmos cercanos a 24 horas.', source: 'S2' },
  { id: 'semana', ask: '¿Qué mostró la escena de la Tierra y las siete fichas?', options: ['Dos movimientos astronómicos y un ritmo de calendario', 'Que la semana es una órbita de siete días', 'Que la astronomía demuestra el sábado'], answer: 0,
    feedback: 'El día y el año se relacionan con movimientos de la Tierra. La semana es un ritmo de calendario con historia cultural y religiosa; la escena no la presenta como un fenómeno astronómico.', takeaway: 'Día y año son astronomía; la semana es calendario con historia.', source: 'H1' },
  { id: 'evidencia', ask: '¿Qué diferencia hay entre consultar evidencia y hacer una reflexión personal?', options: ['La evidencia sustenta afirmaciones verificables; la reflexión explora su sentido para tu vida', 'Son lo mismo', 'La reflexión demuestra lo que dice la evidencia'], answer: 0,
    feedback: 'Las dos tienen su lugar, pero no son intercambiables: una fuente respalda lo que se afirma; la reflexión es tuya y no tiene respuesta correcta.', takeaway: 'Evidencia y reflexión se complementan, sin sustituirse.', source: null },
  { id: 'sabado', ask: '¿Cómo presentó esta experiencia el sábado adventista?', options: ['Un tiempo de descanso, adoración y servicio', 'Exclusivamente dormir más', 'Una técnica para trabajar más'], answer: 0, biblical: true,
    feedback: 'Desde la perspectiva adventista, el sábado es el séptimo día dedicado al descanso, la adoración y el servicio: un encuentro con Dios y con otras personas. Es una creencia; puedes comprenderla sin compartirla.', takeaway: 'El sábado adventista: descanso, adoración y servicio.', source: 'B1' },
];

export const PASSAGES = [
  ['Génesis 2:1–3', 'Al cerrar el relato de la creación, Dios descansa en el séptimo día, lo bendice y lo aparta.'],
  ['Éxodo 20:8–11', 'El mandamiento del sábado incluye a la familia, a quienes trabajan, a los animales y al extranjero.'],
  ['Marcos 2:23–28', 'Jesús explica que el sábado fue hecho para el ser humano.'],
  ['Creencia adventista 20', 'El sábado como día de descanso, adoración y servicio, en comunión con Dios y con otros.'],
];
