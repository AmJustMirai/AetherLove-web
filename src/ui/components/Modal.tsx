// Centered modal over a scrim, port of Widgets/ModalUi + ConfirmModal. Rendered inside the phone shell
// (absolute, not a portal) so it's clipped to the phone frame like the in-game window.

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  /** When set, renders a confirm/cancel footer. */
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  danger?: boolean;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  confirmLabel,
  cancelLabel,
  onConfirm,
  danger,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-scrim/60" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-[340px] rounded-2xl border border-line/10 bg-void p-5 shadow-2xl"
            initial={{ scale: 0.92, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            {title && <h2 className="mb-2 font-display text-lg font-bold text-strong">{title}</h2>}
            <div className="text-[14px] text-body">{children}</div>
            {(confirmLabel || cancelLabel) && (
              <div className="mt-5 flex justify-end gap-2">
                {cancelLabel && (
                  <Button variant="ghost" onClick={onClose}>
                    {cancelLabel}
                  </Button>
                )}
                {confirmLabel && (
                  <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
                    {confirmLabel}
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
