import type { SaisonaleAufgaben } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface SaisonaleAufgabenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: SaisonaleAufgaben | null;
  onEdit: (record: SaisonaleAufgaben) => void;
}

export function SaisonaleAufgabenViewDialog({ open, onClose, record, onEdit }: SaisonaleAufgabenViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saisonale Aufgaben anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name der Aufgabe</Label>
            <p className="text-sm">{record.fields.aufgabenname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Jahreszeit(en)</Label>
            <p className="text-sm">{Array.isArray(record.fields.jahreszeit) ? record.fields.jahreszeit.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Häufigkeit</Label>
            <Badge variant="secondary">{record.fields.haeufigkeit?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geschätzte Dauer</Label>
            <p className="text-sm">{record.fields.dauer_schaetzung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anleitung/Tipps</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.anleitung ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}