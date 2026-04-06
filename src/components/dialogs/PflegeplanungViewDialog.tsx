import type { Pflegeplanung, Gartenbereiche, SaisonaleAufgaben } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface PflegeplanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Pflegeplanung | null;
  onEdit: (record: Pflegeplanung) => void;
  gartenbereicheList: Gartenbereiche[];
  saisonale_aufgabenList: SaisonaleAufgaben[];
}

export function PflegeplanungViewDialog({ open, onClose, record, onEdit, gartenbereicheList, saisonale_aufgabenList }: PflegeplanungViewDialogProps) {
  function getGartenbereicheDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return gartenbereicheList.find(r => r.record_id === id)?.fields.bereichsname ?? '—';
  }

  function getSaisonaleAufgabenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return saisonale_aufgabenList.find(r => r.record_id === id)?.fields.aufgabenname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pflegeplanung anzeigen</DialogTitle>
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
            <p className="text-sm">{getGartenbereicheDisplayName(record.fields.gartenbereich)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aufgaben</Label>
            <p className="text-sm">{getSaisonaleAufgabenDisplayName(record.fields.aufgaben)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplante Jahreszeit</Label>
            <Badge variant="secondary">{record.fields.geplante_jahreszeit?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplanter Zeitraum</Label>
            <p className="text-sm">{record.fields.geplanter_zeitraum ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Priorität</Label>
            <Badge variant="secondary">{record.fields.prioritaet?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notizen zur Planung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.planungsnotizen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}