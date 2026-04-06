import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Pflegeplanung, Gartenbereiche, Arbeitsprotokoll, SaisonaleAufgaben } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [pflegeplanung, setPflegeplanung] = useState<Pflegeplanung[]>([]);
  const [gartenbereiche, setGartenbereiche] = useState<Gartenbereiche[]>([]);
  const [arbeitsprotokoll, setArbeitsprotokoll] = useState<Arbeitsprotokoll[]>([]);
  const [saisonaleAufgaben, setSaisonaleAufgaben] = useState<SaisonaleAufgaben[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [pflegeplanungData, gartenbereicheData, arbeitsprotokollData, saisonaleAufgabenData] = await Promise.all([
        LivingAppsService.getPflegeplanung(),
        LivingAppsService.getGartenbereiche(),
        LivingAppsService.getArbeitsprotokoll(),
        LivingAppsService.getSaisonaleAufgaben(),
      ]);
      setPflegeplanung(pflegeplanungData);
      setGartenbereiche(gartenbereicheData);
      setArbeitsprotokoll(arbeitsprotokollData);
      setSaisonaleAufgaben(saisonaleAufgabenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [pflegeplanungData, gartenbereicheData, arbeitsprotokollData, saisonaleAufgabenData] = await Promise.all([
          LivingAppsService.getPflegeplanung(),
          LivingAppsService.getGartenbereiche(),
          LivingAppsService.getArbeitsprotokoll(),
          LivingAppsService.getSaisonaleAufgaben(),
        ]);
        setPflegeplanung(pflegeplanungData);
        setGartenbereiche(gartenbereicheData);
        setArbeitsprotokoll(arbeitsprotokollData);
        setSaisonaleAufgaben(saisonaleAufgabenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const pflegeplanungMap = useMemo(() => {
    const m = new Map<string, Pflegeplanung>();
    pflegeplanung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [pflegeplanung]);

  const gartenbereicheMap = useMemo(() => {
    const m = new Map<string, Gartenbereiche>();
    gartenbereiche.forEach(r => m.set(r.record_id, r));
    return m;
  }, [gartenbereiche]);

  const saisonaleAufgabenMap = useMemo(() => {
    const m = new Map<string, SaisonaleAufgaben>();
    saisonaleAufgaben.forEach(r => m.set(r.record_id, r));
    return m;
  }, [saisonaleAufgaben]);

  return { pflegeplanung, setPflegeplanung, gartenbereiche, setGartenbereiche, arbeitsprotokoll, setArbeitsprotokoll, saisonaleAufgaben, setSaisonaleAufgaben, loading, error, fetchAll, pflegeplanungMap, gartenbereicheMap, saisonaleAufgabenMap };
}