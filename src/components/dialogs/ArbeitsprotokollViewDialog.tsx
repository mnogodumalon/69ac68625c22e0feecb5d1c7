import type { Arbeitsprotokoll, Gartenbereiche, Pflegeplanung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface ArbeitsprotokollViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Arbeitsprotokoll | null;
  onEdit: (record: Arbeitsprotokoll) => void;
  gartenbereicheList: Gartenbereiche[];
  pflegeplanungList: Pflegeplanung[];
}

export function ArbeitsprotokollViewDialog({ open, onClose, record, onEdit, gartenbereicheList, pflegeplanungList }: ArbeitsprotokollViewDialogProps) {
  function getGartenbereicheDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return gartenbereicheList.find(r => r.record_id === id)?.fields.bereichsname ?? '—';
  }

  function getPflegeplanungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return pflegeplanungList.find(r => r.record_id === id)?.fields.geplanter_zeitraum ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Arbeitsprotokoll anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gartenbereich</Label>
            <p className="text-sm">{getGartenbereicheDisplayName(record.fields.gartenbereich_arbeit)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Datum der Durchführung</Label>
            <p className="text-sm">{formatDate(record.fields.datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Durchgeführte Arbeiten</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.durchgefuehrte_arbeiten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zeitaufwand</Label>
            <p className="text-sm">{record.fields.zeitaufwand ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wetterbedingungen</Label>
            <p className="text-sm">{record.fields.wetter ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beobachtungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beobachtungen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto (optional)</Label>
            {record.fields.foto ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.foto} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplante Pflegemaßnahme (optional)</Label>
            <p className="text-sm">{getPflegeplanungDisplayName(record.fields.geplante_pflege)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}