/// <reference lib="webworker" />
import { expose } from 'comlink';
import { parseSurveyText } from './parseSurvey';

/** Parsing runs off the main thread so a large file never freezes the 3D view. */
const api = {
  parse(text: string, fallbackWell: string) {
    const { wells, issues } = parseSurveyText(text, fallbackWell);
    // Maps are structured-cloneable, but plain arrays are friendlier to inspect in devtools.
    return { wells: [...wells.entries()], issues };
  },
};

export type ParseWorkerApi = typeof api;
expose(api);
