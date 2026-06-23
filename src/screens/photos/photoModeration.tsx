// Ports PhotoModerationModals.cs (Screens/PhotoModerationModals.cs), SfwImageGateModal.cs
// (Widgets/SfwImageGateModal.cs), ImageRequirementsModal.cs (Widgets/ImageRequirementsModal.cs).
// Shared by onboarding and MyProfile images tab.

import { Modal } from '../../ui/components';
import { PHOTO_SPEC } from '../../ui/photo';
import { useT } from '../../i18n/useT';

export enum PhotoNsfwDecl {
  Unselected = 0,
  Sfw = 1,
  Nsfw = 2,
}

export const NSFW_DECL_OPTIONS = [
  { value: PhotoNsfwDecl.Unselected, label: '' as string },
  { value: PhotoNsfwDecl.Sfw, label: '' as string },
  { value: PhotoNsfwDecl.Nsfw, label: '' as string },
];

// ---- SFW gate ----

interface GateModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function SfwGateModal({ open, onAccept, onCancel }: GateModalProps) {
  const t = useT();
  return (
    <Modal
      open={open}
      title={t('common.sfw_gate_title')}
      confirmLabel={t('common.sfw_gate_ack')}
      cancelLabel={t('common.cancel')}
      onConfirm={onAccept}
      onClose={onCancel}
    >
      <p className="mb-3 text-[13px] font-semibold text-danger">{t('common.sfw_gate_subtitle')}</p>
      <ul className="space-y-1.5">
        {(
          [
            'common.sfw_gate_b1',
            'common.sfw_gate_b2',
            'common.sfw_gate_b3',
            'common.sfw_gate_b4',
            'common.sfw_gate_b5',
            'common.sfw_gate_b6',
          ] as const
        ).map((key) => (
          <li key={key} className="flex items-start gap-2 text-[13px] text-danger/90">
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-danger/80" />
            {t(key)}
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5 text-[13px] text-success">
        {t('common.sfw_gate_secondary')}
      </div>
    </Modal>
  );
}

// ---- Lalafell NSFW modal ----

interface SimpleModalProps {
  open: boolean;
  onClose: () => void;
}

export function LalafellNsfwModal({ open, onClose }: SimpleModalProps) {
  const t = useT();
  return (
    <Modal
      open={open}
      title={t('common.lalafell_nsfw_title')}
      confirmLabel={t('common.i_understand')}
      onConfirm={onClose}
      onClose={onClose}
    >
      <p className="whitespace-pre-line text-[14px] text-body">{t('common.lalafell_nsfw_body')}</p>
    </Modal>
  );
}

// ---- Undeclared photo modal ----

export function UndeclaredNsfwModal({ open, onClose }: SimpleModalProps) {
  const t = useT();
  return (
    <Modal
      open={open}
      title={t('common.undeclared_photo_title')}
      confirmLabel={t('common.ok')}
      onConfirm={onClose}
      onClose={onClose}
    >
      <p className="text-[14px] text-body">{t('common.undeclared_photo_body')}</p>
    </Modal>
  );
}

// ---- Image requirements modal ----

interface RequirementsModalProps extends SimpleModalProps {
  message: string;
}

export function ImageRequirementsModal({ open, message, onClose }: RequirementsModalProps) {
  const t = useT();
  const { avatar, portrait } = PHOTO_SPEC;
  return (
    <Modal
      open={open}
      title={t('common.img_requirements_title')}
      confirmLabel={t('common.close')}
      onConfirm={onClose}
      onClose={onClose}
    >
      <p className="mb-2 text-[14px] text-body">{message}</p>
      <p className="text-[13px] text-subtle">
        {t('common.img_requirements_sizes', avatar.w, avatar.h, portrait.w, portrait.h)}
      </p>
    </Modal>
  );
}
