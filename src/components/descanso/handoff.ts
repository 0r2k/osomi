// Geometría compartida entre escenas para encadenarlas sin cortes.
// P08 publica dónde aparecerá la Tierra 3D; P07 hace crecer su globo exactamente hasta ahí.
export type Circle = { x: number; y: number; r: number };
export const handoff: { earth: Circle | null } = { earth: null };
