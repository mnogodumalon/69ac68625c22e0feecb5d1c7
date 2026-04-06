// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Pflegeplanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gartenbereich?: string; // applookup -> URL zu 'Gartenbereiche' Record
    aufgaben?: string; // applookup -> URL zu 'SaisonaleAufgaben' Record
    geplante_jahreszeit?: LookupValue;
    geplanter_zeitraum?: string;
    prioritaet?: LookupValue;
    planungsnotizen?: string;
  };
}

export interface Gartenbereiche {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bereichsname?: string;
    beschreibung?: string;
    groesse?: number;
    lage?: string;
    notizen?: string;
  };
}

export interface Arbeitsprotokoll {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    gartenbereich_arbeit?: string; // applookup -> URL zu 'Gartenbereiche' Record
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    durchgefuehrte_arbeiten?: string;
    zeitaufwand?: string;
    wetter?: string;
    beobachtungen?: string;
    foto?: string;
    geplante_pflege?: string; // applookup -> URL zu 'Pflegeplanung' Record
  };
}

export interface SaisonaleAufgaben {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    aufgabenname?: string;
    beschreibung?: string;
    jahreszeit?: LookupValue[];
    haeufigkeit?: LookupValue;
    dauer_schaetzung?: string;
    anleitung?: string;
  };
}

export const APP_IDS = {
  PFLEGEPLANUNG: '69ac68506c4047109f2ef1b3',
  GARTENBEREICHE: '69ac684a7a71d66a8bcf9a19',
  ARBEITSPROTOKOLL: '69ac6850bdf7c76fbace388c',
  SAISONALE_AUFGABEN: '69ac684f4e04afa6767a4c6e',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'pflegeplanung': {
    geplante_jahreszeit: [{ key: "sommer", label: "Sommer" }, { key: "herbst", label: "Herbst" }, { key: "fruehjahr", label: "Frühjahr" }, { key: "winter", label: "Winter" }],
    prioritaet: [{ key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
  },
  'saisonale_aufgaben': {
    jahreszeit: [{ key: "fruehjahr", label: "Frühjahr" }, { key: "sommer", label: "Sommer" }, { key: "herbst", label: "Herbst" }, { key: "winter", label: "Winter" }],
    haeufigkeit: [{ key: "einmalig", label: "Einmalig" }, { key: "woechentlich", label: "Wöchentlich" }, { key: "zwei_wochen", label: "Alle 2 Wochen" }, { key: "monatlich", label: "Monatlich" }, { key: "nach_bedarf", label: "Nach Bedarf" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'pflegeplanung': {
    'gartenbereich': 'applookup/select',
    'aufgaben': 'applookup/select',
    'geplante_jahreszeit': 'lookup/select',
    'geplanter_zeitraum': 'string/text',
    'prioritaet': 'lookup/select',
    'planungsnotizen': 'string/textarea',
  },
  'gartenbereiche': {
    'bereichsname': 'string/text',
    'beschreibung': 'string/textarea',
    'groesse': 'number',
    'lage': 'string/text',
    'notizen': 'string/textarea',
  },
  'arbeitsprotokoll': {
    'gartenbereich_arbeit': 'applookup/select',
    'datum': 'date/date',
    'durchgefuehrte_arbeiten': 'string/textarea',
    'zeitaufwand': 'string/text',
    'wetter': 'string/text',
    'beobachtungen': 'string/textarea',
    'foto': 'file',
    'geplante_pflege': 'applookup/select',
  },
  'saisonale_aufgaben': {
    'aufgabenname': 'string/text',
    'beschreibung': 'string/textarea',
    'jahreszeit': 'multiplelookup/checkbox',
    'haeufigkeit': 'lookup/select',
    'dauer_schaetzung': 'string/text',
    'anleitung': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreatePflegeplanung = StripLookup<Pflegeplanung['fields']>;
export type CreateGartenbereiche = StripLookup<Gartenbereiche['fields']>;
export type CreateArbeitsprotokoll = StripLookup<Arbeitsprotokoll['fields']>;
export type CreateSaisonaleAufgaben = StripLookup<SaisonaleAufgaben['fields']>;