// utils/conversions.ts

// 1 m³/h ≈ 0.588578 CFM
export const M3H_TO_CFM = 0.588578;
// 1 inWG ≈ 248.84 Pa
export const INWG_TO_PA = 248.84;

export const m3hToCfm = (m3h: number): number => m3h * M3H_TO_CFM;
export const cfmToM3h = (cfm: number): number => cfm / M3H_TO_CFM;

export const paToInwg = (pa: number): number => pa / INWG_TO_PA;
export const inwgToPa = (inwg: number): number => inwg * INWG_TO_PA;
