'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as React from 'react';

type ConfirmDialogProps = {
  title?: string;
  description?: string;
  trigger: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
};

const ConfirmDialog = ({
  title = '확인',
  description,
  trigger,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
}: ConfirmDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {error && (
          <p role='status' aria-live='polite' className='mb-2 text-sm text-destructive'>
            {error}
          </p>
        )}
        <div className='mt-2 flex justify-end gap-2'>
          <Button variant='secondary' onClick={() => setOpen(false)} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant='destructive'
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await onConfirm();
                setOpen(false);
              } catch (e) {
                const msg = e instanceof Error ? e.message : '요청 처리 중 오류가 발생했어요';
                setError(msg);
              } finally {
                setLoading(false);
              }
            }}
            aria-busy={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
