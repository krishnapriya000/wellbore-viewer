/** A raw survey station as measured. Depths in feet, angles in degrees. */
export interface Station {
  md: number;
  inc: number;
  azi: number;
}

/** A station after minimum-curvature computation. n/e/tvd in feet from the tie-in; dls in °/100 ft. */
export interface SurveyPoint extends Station {
  n: number;
  e: number;
  tvd: number;
  dls: number;
  /** Dogleg angle to the previous station, radians. */
  beta: number;
}

/** Position the first station ties on to. Surface tie-in is the default. */
export interface TieIn {
  tvd: number;
  n: number;
  e: number;
}

export const SURFACE_TIE_IN: TieIn = { tvd: 0, n: 0, e: 0 };
