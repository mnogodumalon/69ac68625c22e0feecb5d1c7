import type { EnrichedArbeitsprotokoll, EnrichedPflegeplanung } from '@/types/enriched';
import type { Arbeitsprotokoll, Gartenbereiche, Pflegeplanung, SaisonaleAufgaben } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface PflegeplanungMaps {
  gartenbereicheMap: Map<string, Gartenbereiche>;
  saisonaleAufgabenMap: Map<string, SaisonaleAufgaben>;
}

export function enrichPflegeplanung(
  pflegeplanung: Pflegeplanung[],
  maps: PflegeplanungMaps
): EnrichedPflegeplanung[] {
  return pflegeplanung.map(r => ({
    ...r,
    gartenbereichName: resolveDisplay(r.fields.gartenbereich, maps.gartenbereicheMap, 'bereichsname'),
    aufgabenName: resolveDisplay(r.fields.aufgaben, maps.saisonaleAufgabenMap, 'aufgabenname'),
  }));
}

interface ArbeitsprotokollMaps {
  gartenbereicheMap: Map<string, Gartenbereiche>;
  pflegeplanungMap: Map<string, Pflegeplanung>;
}

export function enrichArbeitsprotokoll(
  arbeitsprotokoll: Arbeitsprotokoll[],
  maps: ArbeitsprotokollMaps
): EnrichedArbeitsprotokoll[] {
  return arbeitsprotokoll.map(r => ({
    ...r,
    gartenbereich_arbeitName: resolveDisplay(r.fields.gartenbereich_arbeit, maps.gartenbereicheMap, 'bereichsname'),
    geplante_pflegeName: resolveDisplay(r.fields.geplante_pflege, maps.pflegeplanungMap, 'geplanter_zeitraum'),
  }));
}
