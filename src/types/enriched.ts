import type { Arbeitsprotokoll, Pflegeplanung } from './app';

export type EnrichedPflegeplanung = Pflegeplanung & {
  gartenbereichName: string;
  aufgabenName: string;
};

export type EnrichedArbeitsprotokoll = Arbeitsprotokoll & {
  gartenbereich_arbeitName: string;
  geplante_pflegeName: string;
};
