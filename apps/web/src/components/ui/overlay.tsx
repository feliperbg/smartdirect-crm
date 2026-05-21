import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'right' | 'center';
  className?: string;
}

export function Overlay({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'center',
  className,
}: OverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" aria-label="Fechar" onClick={() => onOpenChange(false)} />
      <section
        className={cn(
          'relative z-10 flex flex-col border bg-card shadow-xl',
          side === 'right'
            ? 'ml-auto h-full w-full max-w-xl border-y-0 border-r-0'
            : 'm-auto max-h-[92vh] w-[calc(100%-2rem)] max-w-lg rounded-lg',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button variant="ghost" size="icon" type="button" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t p-5">{footer}</footer>}
      </section>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Overlay
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</div>
    </Overlay>
  );
}
