import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichPflegeplanung, enrichArbeitsprotokoll } from '@/lib/enrich';
import type { EnrichedPflegeplanung, EnrichedArbeitsprotokoll } from '@/types/enriched';
import type { Gartenbereiche, SaisonaleAufgaben } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useState, useMemo, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { GartenbereicheDialog } from '@/components/dialogs/GartenbereicheDialog';
import { ArbeitsprotokollDialog } from '@/components/dialogs/ArbeitsprotokollDialog';
import { PflegeplanungDialog } from '@/components/dialogs/PflegeplanungDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconTree, IconClipboardList,
  IconCalendarEvent, IconChevronRight, IconLeaf, IconClockHour4,
  IconNotes, IconSun, IconSnowflake, IconFlower, IconPlant,
} from '@tabler/icons-react';

const APPGROUP_ID = '69ac68625c22e0feecb5d1c7';
const REPAIR_ENDPOINT = '/claude/build/repair';

const SEASON_NOW = (() => {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'fruehjahr';
  if (m >= 6 && m <= 8) return 'sommer';
  if (m >= 9 && m <= 11) return 'herbst';
  return 'winter';
})();

const SEASON_LABELS: Record<string, string> = {
  fruehjahr: 'Frühjahr', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter',
};

const SEASON_ICONS: Record<string, React.ReactNode> = {
  fruehjahr: <IconFlower size={14} className="shrink-0" />,
  sommer: <IconSun size={14} className="shrink-0" />,
  herbst: <IconLeaf size={14} className="shrink-0" />,
  winter: <IconSnowflake size={14} className="shrink-0" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  hoch: 'bg-red-100 text-red-700 border-red-200',
  mittel: 'bg-amber-100 text-amber-700 border-amber-200',
  niedrig: 'bg-green-100 text-green-700 border-green-200',
};

export default function DashboardOverview() {
  const {
    pflegeplanung, gartenbereiche, arbeitsprotokoll, saisonaleAufgaben,
    pflegeplanungMap, gartenbereicheMap, saisonaleAufgabenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedPflegeplanung = enrichPflegeplanung(pflegeplanung, { gartenbereicheMap, saisonaleAufgabenMap });
  const enrichedArbeitsprotokoll = enrichArbeitsprotokoll(arbeitsprotokoll, { gartenbereicheMap, pflegeplanungMap });

  // --- state (ALL hooks before early returns!) ---
  const [selectedBereichId, setSelectedBereichId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && gartenbereiche.length > 0 && selectedBereichId === null) {
      setSelectedBereichId(gartenbereiche[0].record_id);
    }
  }, [loading, gartenbereiche, selectedBereichId]);
  const [bereichDialog, setBereichDialog] = useState<{ open: boolean; record?: Gartenbereiche }>({ open: false });
  const [protokollDialog, setProtokollDialog] = useState<{ open: boolean; record?: EnrichedArbeitsprotokoll; defaultBereichId?: string }>({ open: false });
  const [pflegeDialog, setPflegeDialog] = useState<{ open: boolean; record?: EnrichedPflegeplanung; defaultBereichId?: string }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'bereich' | 'protokoll' | 'pflege'; id: string } | null>(null);

  const selectedBereich = useMemo(
    () => gartenbereiche.find(b => b.record_id === selectedBereichId) ?? null,
    [gartenbereiche, selectedBereichId]
  );

  const bereichPlanung = useMemo(() => {
    if (!selectedBereichId) return [];
    return enrichedPflegeplanung.filter(p => {
      const id = extractRecordId(p.fields.gartenbereich);
      return id === selectedBereichId;
    });
  }, [enrichedPflegeplanung, selectedBereichId]);

  const bereichProtokoll = useMemo(() => {
    if (!selectedBereichId) return [];
    return enrichedArbeitsprotokoll
      .filter(p => {
        const id = extractRecordId(p.fields.gartenbereich_arbeit);
        return id === selectedBereichId;
      })
      .sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? ''));
  }, [enrichedArbeitsprotokoll, selectedBereichId]);

  const currentSeasonTasks = useMemo(() => {
    return saisonaleAufgaben.filter(t =>
      Array.isArray(t.fields.jahreszeit) &&
      t.fields.jahreszeit.some((j) => j.key === SEASON_NOW)
    );
  }, [saisonaleAufgaben]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'bereich') {
      await LivingAppsService.deleteGartenbereicheEntry(deleteTarget.id);
      if (selectedBereichId === deleteTarget.id) setSelectedBereichId(null);
    } else if (deleteTarget.type === 'protokoll') {
      await LivingAppsService.deleteArbeitsprotokollEntry(deleteTarget.id);
    } else if (deleteTarget.type === 'pflege') {
      await LivingAppsService.deletePflegeplanungEntry(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchAll();
  };

  const totalProtokollStunden = enrichedArbeitsprotokoll.length;
  const currentSeasonLabel = SEASON_LABELS[SEASON_NOW];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Gartenbereiche"
          value={String(gartenbereiche.length)}
          description="Angelegt"
          icon={<IconTree size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Pflegepläne"
          value={String(pflegeplanung.length)}
          description="Aktiv"
          icon={<IconPlant size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Protokolleinträge"
          value={String(totalProtokollStunden)}
          description="Gesamt"
          icon={<IconClipboardList size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title={currentSeasonLabel}
          value={String(currentSeasonTasks.length)}
          description="Saisonale Aufgaben"
          icon={<span className="text-muted-foreground">{SEASON_ICONS[SEASON_NOW]}</span>}
        />
      </div>

      {/* Main workspace: 2-column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Gartenbereich list */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base text-foreground">Gartenbereiche</h2>
            <Button size="sm" variant="outline" onClick={() => setBereichDialog({ open: true })}>
              <IconPlus size={15} className="mr-1 shrink-0" />
              <span className="hidden sm:inline">Neu</span>
            </Button>
          </div>

          {gartenbereiche.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed rounded-2xl text-muted-foreground">
              <IconTree size={36} stroke={1.5} />
              <p className="text-sm">Noch keine Gartenbereiche</p>
              <Button size="sm" variant="outline" onClick={() => setBereichDialog({ open: true })}>
                <IconPlus size={14} className="mr-1" />Ersten anlegen
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {gartenbereiche.map(b => {
                const planCount = enrichedPflegeplanung.filter(p => extractRecordId(p.fields.gartenbereich) === b.record_id).length;
                const protokollCount = enrichedArbeitsprotokoll.filter(p => extractRecordId(p.fields.gartenbereich_arbeit) === b.record_id).length;
                const isSelected = b.record_id === selectedBereichId;
                return (
                  <div
                    key={b.record_id}
                    onClick={() => setSelectedBereichId(isSelected ? null : b.record_id)}
                    className={`
                      group relative cursor-pointer rounded-2xl border p-4 transition-all
                      ${isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'}
                    `}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                        <IconTree size={17} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{b.fields.bereichsname ?? '—'}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {b.fields.groesse != null && (
                            <span>{b.fields.groesse} m²</span>
                          )}
                          {b.fields.lage && (
                            <span className="truncate max-w-[100px]">{b.fields.lage}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{planCount} Plan{planCount !== 1 ? 'einträge' : 'eintrag'}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{protokollCount} Protokoll{protokollCount !== 1 ? 'einträge' : 'eintrag'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setBereichDialog({ open: true, record: b }); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          title="Bearbeiten"
                        >
                          <IconPencil size={14} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget({ type: 'bereich', id: b.record_id }); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Löschen"
                        >
                          <IconTrash size={14} className="text-muted-foreground hover:text-destructive" />
                        </button>
                        <IconChevronRight size={14} className={`transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Saisonale Aufgaben widget */}
          <div className="mt-2">
            <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
              {SEASON_ICONS[SEASON_NOW]}
              {currentSeasonLabel}-Aufgaben
            </h3>
            {currentSeasonTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1">Keine Aufgaben für diese Jahreszeit.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {currentSeasonTasks.slice(0, 5).map(t => (
                  <div key={t.record_id} className="rounded-xl border border-border bg-card p-3">
                    <p className="text-sm font-medium truncate">{t.fields.aufgabenname ?? '—'}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {t.fields.haeufigkeit && (
                        <Badge variant="secondary" className="text-xs px-2 py-0">{t.fields.haeufigkeit.label}</Badge>
                      )}
                      {t.fields.dauer_schaetzung && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <IconClockHour4 size={12} className="shrink-0" />
                          {t.fields.dauer_schaetzung}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {currentSeasonTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{currentSeasonTasks.length - 5} weitere</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {!selectedBereich ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed rounded-2xl text-muted-foreground">
              <IconTree size={44} stroke={1.2} />
              <p className="text-sm font-medium">Gartenbereich auswählen</p>
              <p className="text-xs text-center max-w-xs">Klicke links auf einen Bereich, um Pflegepläne und Protokolleinträge zu sehen.</p>
            </div>
          ) : (
            <>
              {/* Bereich header */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg truncate">{selectedBereich.fields.bereichsname ?? '—'}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                      {selectedBereich.fields.groesse != null && <span>{selectedBereich.fields.groesse} m²</span>}
                      {selectedBereich.fields.lage && <span>{selectedBereich.fields.lage}</span>}
                    </div>
                    {selectedBereich.fields.beschreibung && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{selectedBereich.fields.beschreibung}</p>
                    )}
                    {selectedBereich.fields.notizen && (
                      <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{selectedBereich.fields.notizen}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setBereichDialog({ open: true, record: selectedBereich })}>
                      <IconPencil size={14} className="mr-1 shrink-0" />
                      <span className="hidden sm:inline">Bearbeiten</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pflegeplanung for this Bereich */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <IconCalendarEvent size={15} className="text-muted-foreground shrink-0" />
                    Pflegepläne
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPflegeDialog({ open: true, defaultBereichId: selectedBereichId ?? undefined })}
                  >
                    <IconPlus size={14} className="mr-1 shrink-0" />
                    <span className="hidden sm:inline">Plan</span>
                  </Button>
                </div>

                {bereichPlanung.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center gap-2 text-muted-foreground">
                    <IconCalendarEvent size={28} stroke={1.5} />
                    <p className="text-xs">Noch kein Pflegeplan für diesen Bereich</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {bereichPlanung.map(p => (
                      <div key={p.record_id} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{p.aufgabenName || 'Aufgabe'}</span>
                            {p.fields.prioritaet && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[p.fields.prioritaet.key] ?? 'bg-muted text-muted-foreground'}`}>
                                {p.fields.prioritaet.label}
                              </span>
                            )}
                            {p.fields.geplante_jahreszeit && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {SEASON_ICONS[p.fields.geplante_jahreszeit.key]}
                                {p.fields.geplante_jahreszeit.label}
                              </span>
                            )}
                          </div>
                          {p.fields.geplanter_zeitraum && (
                            <p className="text-xs text-muted-foreground mt-1">{p.fields.geplanter_zeitraum}</p>
                          )}
                          {p.fields.planungsnotizen && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{p.fields.planungsnotizen}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setPflegeDialog({ open: true, record: p })}
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                            title="Bearbeiten"
                          >
                            <IconPencil size={13} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'pflege', id: p.record_id })}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Löschen"
                          >
                            <IconTrash size={13} className="text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Arbeitsprotokoll for this Bereich */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <IconNotes size={15} className="text-muted-foreground shrink-0" />
                    Arbeitsprotokoll
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setProtokollDialog({ open: true, defaultBereichId: selectedBereichId ?? undefined })}
                  >
                    <IconPlus size={14} className="mr-1 shrink-0" />
                    <span className="hidden sm:inline">Eintrag</span>
                  </Button>
                </div>

                {bereichProtokoll.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center gap-2 text-muted-foreground">
                    <IconClipboardList size={28} stroke={1.5} />
                    <p className="text-xs">Noch kein Protokolleintrag</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-x-auto">
                    {bereichProtokoll.map(p => (
                      <div key={p.record_id} className="rounded-xl border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">{formatDate(p.fields.datum)}</span>
                              {p.fields.zeitaufwand && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <IconClockHour4 size={12} className="shrink-0" />
                                  {p.fields.zeitaufwand}
                                </span>
                              )}
                              {p.fields.wetter && (
                                <Badge variant="outline" className="text-xs px-2 py-0">{p.fields.wetter}</Badge>
                              )}
                            </div>
                            {p.fields.durchgefuehrte_arbeiten && (
                              <p className="text-sm text-foreground mt-1 line-clamp-2">{p.fields.durchgefuehrte_arbeiten}</p>
                            )}
                            {p.fields.beobachtungen && (
                              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{p.fields.beobachtungen}</p>
                            )}
                            {p.fields.foto && (
                              <a
                                href={p.fields.foto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                                title="Bild in neuem Tab öffnen"
                              >
                                <img
                                  src={p.fields.foto}
                                  alt="Foto"
                                  className="h-16 w-auto max-w-[120px] object-cover"
                                />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setProtokollDialog({ open: true, record: p })}
                              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                              title="Bearbeiten"
                            >
                              <IconPencil size={13} className="text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'protokoll', id: p.record_id })}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                              title="Löschen"
                            >
                              <IconTrash size={13} className="text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <GartenbereicheDialog
        open={bereichDialog.open}
        onClose={() => setBereichDialog({ open: false })}
        onSubmit={async (fields) => {
          if (bereichDialog.record) {
            await LivingAppsService.updateGartenbereicheEntry(bereichDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createGartenbereicheEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={bereichDialog.record?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Gartenbereiche']}
      />

      <ArbeitsprotokollDialog
        open={protokollDialog.open}
        onClose={() => setProtokollDialog({ open: false })}
        onSubmit={async (fields) => {
          if (protokollDialog.record) {
            await LivingAppsService.updateArbeitsprotokollEntry(protokollDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createArbeitsprotokollEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          protokollDialog.record
            ? protokollDialog.record.fields
            : protokollDialog.defaultBereichId
              ? { gartenbereich_arbeit: createRecordUrl(APP_IDS.GARTENBEREICHE, protokollDialog.defaultBereichId) }
              : undefined
        }
        gartenbereicheList={gartenbereiche}
        pflegeplanungList={pflegeplanung}
        enablePhotoScan={AI_PHOTO_SCAN['Arbeitsprotokoll']}
      />

      <PflegeplanungDialog
        open={pflegeDialog.open}
        onClose={() => setPflegeDialog({ open: false })}
        onSubmit={async (fields) => {
          if (pflegeDialog.record) {
            await LivingAppsService.updatePflegeplanungEntry(pflegeDialog.record.record_id, fields);
          } else {
            await LivingAppsService.createPflegeplanungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          pflegeDialog.record
            ? pflegeDialog.record.fields
            : pflegeDialog.defaultBereichId
              ? { gartenbereich: createRecordUrl(APP_IDS.GARTENBEREICHE, pflegeDialog.defaultBereichId) }
              : undefined
        }
        gartenbereicheList={gartenbereiche}
        saisonale_aufgabenList={saisonaleAufgaben}
        enablePhotoScan={AI_PHOTO_SCAN['Pflegeplanung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description="Möchtest du diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <div className="lg:col-span-2 space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
