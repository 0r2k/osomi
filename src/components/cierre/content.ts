// Contenido editorial compartido por la perspectiva bíblica (P10), el cierre (P11–P12) y el libro del tema.

export const SOURCES = {
  S1: { label: 'NHLBI · Why Is Sleep Important?', href: 'https://www.nhlbi.nih.gov/health/sleep/why-sleep-important', scope: 'Síntesis institucional sobre sueño, salud, aprendizaje y memoria. No describe casos personales.' },
  S2: { label: 'NHLBI · Your Sleep/Wake Cycle', href: 'https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle', scope: 'Ritmos circadianos cercanos a 24 horas y su relación con la luz. No implica un ciclo semanal.' },
  A1: { label: 'NASA · Día solar y sideral', href: 'https://science.nasa.gov/learn/basics-of-space-flight/chapter2-1/', scope: 'Diferencia entre el día solar medio (≈24 h) y el sideral (≈23 h 56 min).' },
  A2: { label: 'NASA · Datos de la Tierra', href: 'https://science.nasa.gov/earth/facts/', scope: 'Rotación y órbita terrestre; cifras aproximadas de divulgación.' },
  H1: { label: 'UCL · La semana de siete días', href: 'https://www.ucl.ac.uk/arts-humanities/hebrew-jewish/hjs-research/research-projects-hjs/calendars-late-antiquity-and-middle-ages-standardization-and-fixation/seven-day-week-roman-empire-and-near-east', scope: 'Tradiciones de la semana del sábado y la semana planetaria. Orienta la cautela histórica.' },
  B1: { label: 'La Biblia · Reina-Valera 1909', href: 'https://www.biblegateway.com/versions/Reina-Valera-Antigua-RVA-Biblia/', scope: 'Traducción de dominio público, con ortografía actualizada. Génesis 2:1–3, Éxodo 20:8–11, Marcos 2:23–28 e Isaías 66:22–23.' },
} as const;
export type SourceKey = keyof typeof SOURCES;

/** Traducción usada para citar: Reina-Valera 1909, dominio público; se actualiza solo la ortografía. */
export const TRANSLATION = 'Reina-Valera 1909';

export type Passage = {
  title: string; reference: string; text: string; words: string[];
  /** Texto bíblico citado, versículo a versículo. */
  verses: [number, string][];
  /** Comentario breve, después de los versículos. */
  context: string;
};

export const PASSAGES: Passage[] = [
  {
    title: 'Un tiempo apartado', reference: 'Génesis 2:1–3', words: ['Descanso'],
    text: 'En el relato de la creación, el séptimo día tiene un lugar especial: Dios descansa, lo bendice y lo aparta como santo.',
    verses: [
      [1, 'Y fueron acabados los cielos y la tierra, y todo su ornamento.'],
      [2, 'Y acabó Dios en el día séptimo su obra que hizo, y reposó el día séptimo de toda su obra que había hecho.'],
      [3, 'Y bendijo Dios al día séptimo, y santificólo, porque en él reposó de toda su obra que había Dios criado y hecho.'],
    ],
    context: 'Estos versículos cierran el relato de la creación. La obra está terminada, y el séptimo día recibe algo que ningún otro día recibe: bendición y santificación.',
  },
  {
    title: 'Descanso compartido', reference: 'Éxodo 20:8–11', words: ['Tú', 'Quienes te rodean', 'Quienes trabajan contigo'],
    text: 'El mandamiento incluye a quienes viven y trabajan contigo. El descanso alcanza también a otras personas y a los animales.',
    verses: [
      [8, 'Acordarte has del día del reposo, para santificarlo:'],
      [9, 'Seis días trabajarás, y harás toda tu obra;'],
      [10, 'Mas el séptimo día será reposo para Jehová tu Dios: no hagas en él obra alguna, tú, ni tu hijo, ni tu hija, ni tu siervo, ni tu criada, ni tu bestia, ni tu extranjero que está dentro de tus puertas:'],
      [11, 'Porque en seis días hizo Jehová los cielos y la tierra, la mar y todas las cosas que en ellos hay, y reposó en el séptimo día: por tanto Jehová bendijo el día del reposo y lo santificó.'],
    ],
    context: 'El cuarto mandamiento une el descanso del séptimo día con la creación. Nadie queda fuera: la familia, quienes trabajan, los animales y el extranjero.',
  },
  {
    title: 'Un bien para las personas', reference: 'Marcos 2:23–28', words: ['Descanso', 'Adoración', 'Servicio'],
    text: 'Jesús presenta el sábado como un bien para el ser humano. Su sentido nos lleva a mirar a las personas.',
    verses: [
      [23, 'Y aconteció que pasando él por los sembrados en sábado, sus discípulos andando comenzaron a arrancar espigas.'],
      [24, 'Entonces los fariseos le dijeron: He aquí, ¿por qué hacen en sábado lo que no es lícito?'],
      [25, 'Y él les dijo: ¿Nunca leísteis qué hizo David cuando tuvo necesidad, y tuvo hambre, él y los que con él estaban:'],
      [26, 'Cómo entró en la casa de Dios, siendo Abiathar sumo pontífice, y comió los panes de la proposición, de los cuales no es lícito comer sino a los sacerdotes, y aun dio a los que con él estaban?'],
      [27, 'También les dijo: El sábado por causa del hombre es hecho; no el hombre por causa del sábado.'],
      [28, 'Así que el Hijo del hombre es Señor aun del sábado.'],
    ],
    context: 'Ante una discusión sobre lo permitido, Jesús recuerda para qué existe el sábado: fue hecho para bien del ser humano. Y afirma su autoridad sobre ese día.',
  },
  {
    title: 'Un encuentro que vuelve cada semana', reference: 'Isaías 66:22–23', words: ['Con Dios', 'Con otras personas'],
    text: 'Sábado viene del hebreo shabbat (sabbath), que significa cesar, reposar. Es el séptimo día, dedicado al descanso, la adoración y el servicio: un tiempo de encuentro con Dios y con otras personas.',
    verses: [
      [22, 'Porque como los cielos nuevos y la nueva tierra, que yo hago, permanecen delante de mí, dice Jehová, así permanecerá vuestra simiente y vuestro nombre.'],
      [23, 'Y será que de mes en mes, y de sábado en sábado, vendrá toda carne a adorar delante de mí, dijo Jehová.'],
    ],
    context: 'Al describir los cielos nuevos y la tierra nueva, el profeta presenta un encuentro que continúa: de sábado en sábado, todos vendrán a adorar. El tiempo apartado no solo recuerda la creación; también mira hacia el futuro.',
  },
];

export type Question = {
  id: string; ask: string; options: string[];
  /** Respuestas válidas (en la primera pregunta, más de una percepción es válida). */
  answer: number[];
  feedback: string; takeaway: string; source: SourceKey | null;
  /** Referencias bíblicas por nombre, en lugar de un enlace. */
  refs?: string;
};

// Las respuestas están en primera persona: quien responde es el visitante.
export const QUESTIONS: Question[] = [
  { id: 'lab', ask: 'En la actividad con las formas geométricas, ¿qué notaste?',
    options: ['Me costó más concentrarme cuando llegaban los avisos', 'No noté mucha diferencia entre las dos rondas', 'La actividad midió mi nivel de estrés'], answer: [0, 1],
    feedback: 'Lo que notaste es tuyo y es válido. Fue una demostración: permite observar cómo te fue en ese momento, pero no mide el estrés ni diagnostica tu atención.',
    takeaway: 'Una prueba breve permite observar, no diagnosticar.', source: null },
  { id: 'ritmo', ask: '¿Qué aprendiste sobre los ritmos de tu cuerpo?',
    options: ['Que mi cuerpo sigue ritmos cercanos a 24 horas', 'Que mi cuerpo sigue un ciclo de siete días', 'Que mi cuerpo sigue un ciclo mensual'], answer: [0],
    feedback: 'El organismo tiene ritmos cercanos a 24 horas, y la luz y la oscuridad ayudan a sincronizarlos. No son evidencia de un ciclo semanal.',
    takeaway: 'Tu cuerpo sigue ritmos cercanos a 24 horas.', source: 'S2' },
  { id: 'semana', ask: '¿Qué te mostró la escena de la Tierra y las siete fichas?',
    options: ['Que el día y el año vienen de movimientos de la Tierra, y la semana es un ritmo de calendario', 'Que la semana es una órbita de siete días', 'Que la astronomía demuestra que hay que descansar un día a la semana'], answer: [0],
    feedback: 'El día y el año se relacionan con movimientos de la Tierra. La semana es un ritmo de calendario con historia cultural y religiosa; la astronomía no la demuestra.',
    takeaway: 'Día y año son astronomía; la semana es calendario con historia.', source: 'H1' },
  { id: 'evidencia', ask: '¿En qué se diferencian consultar evidencia y hacer una reflexión personal?',
    options: ['La evidencia respalda lo que se afirma; mi reflexión explora qué significa para mi vida', 'Para mí son lo mismo', 'Mi reflexión demuestra lo que dice la evidencia'], answer: [0],
    feedback: 'Las dos tienen su lugar, pero no son intercambiables: una fuente respalda lo que se afirma; la reflexión es tuya y no tiene respuesta correcta.',
    takeaway: 'Evidencia y reflexión se complementan, sin sustituirse.', source: null },
  { id: 'sabado', ask: '¿Cómo presentó esta experiencia el séptimo día?',
    options: ['Como un tiempo de descanso, adoración y servicio', 'Como un día para dormir más', 'Como una técnica para trabajar más'], answer: [0],
    feedback: 'Desde la perspectiva bíblica, el sábado es el séptimo día dedicado al descanso, la adoración y el servicio: un tiempo de encuentro con Dios y con otras personas.',
    takeaway: 'El sábado: descanso, adoración y servicio.', source: null,
    refs: 'Génesis 2:2–3 · Éxodo 20:8–11 · Marcos 2:27 · Isaías 66:23' },
];
