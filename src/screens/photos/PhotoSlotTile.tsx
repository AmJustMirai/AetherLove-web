// Reusable editable photo slot: file pick → min-size validation → SFW gate (avatar/main) →
// interactive crop → PhotoUploadDto. Used by onboarding steps and the MyProfile images tab.
// Ports PendingImagePick.cs, ImageCropPopup.cs, and slot tile logic from MyProfileScreen.Images.cs.

import {useEffect, useRef, useState} from 'react';
import type {PhotoUploadDto} from '../../shared/dtos';
import {Race} from '../../shared/enums';
import {type CropRect, loadImageFromUrl, PHOTO_SPEC, previewUrl, processCroppedPhoto} from '../../ui/photo';
import {ImageCropModal, LoadingSpinner} from '../../ui/components';
import {revokeUrl, webpUrl} from '../../ui/image';
import {useT} from '../../i18n/useT';
import {cn} from '../../ui/cn';
import {ImageRequirementsModal, LalafellNsfwModal, PhotoNsfwDecl, SfwGateModal,} from './photoModeration';

interface PhotoSlotTileProps {
    kind: 'avatar' | 'portrait';
    order: number;
    value: PhotoUploadDto | null;
    serverBytes?: Uint8Array | null;
    serverIsNsfw?: boolean;
    declaration?: PhotoNsfwDecl;
    onDeclaration?: (d: PhotoNsfwDecl) => void;
    race: Race;
    onChange: (photo: PhotoUploadDto | null) => void;
    onRemove?: () => void;
    pendingRemove?: boolean;
    onUndoRemove?: () => void;
    className?: string;
}

export function PhotoSlotTile({
                                  kind,
                                  order,
                                  value,
                                  serverBytes,
                                  serverIsNsfw,
                                  declaration,
                                  onDeclaration,
                                  race,
                                  onChange,
                                  onRemove,
                                  pendingRemove,
                                  onUndoRemove,
                                  className,
                              }: PhotoSlotTileProps) {
    const t = useT();
    const spec = PHOTO_SPEC[kind];
    const isExtra = order >= 2;
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingUrlRef = useRef<string | null>(null);

    const [pendingImg, setPendingImg] = useState<HTMLImageElement | null>(null);
    const [showSfwGate, setShowSfwGate] = useState(false);
    const [showCrop, setShowCrop] = useState(false);
    const [showReq, setShowReq] = useState(false);
    const [reqMsg, setReqMsg] = useState('');
    const [showLalafell, setShowLalafell] = useState(false);
    const [busy, setBusy] = useState(false);
    const [serverDisplayUrl, setServerDisplayUrl] = useState<string | null>(null);

    useEffect(() => {
        const url = webpUrl(serverBytes);
        setServerDisplayUrl(url);
        return () => {
            if (url) revokeUrl(url);
        };
    }, [serverBytes]);

    function revokePending() {
        if (pendingUrlRef.current) {
            URL.revokeObjectURL(pendingUrlRef.current);
            pendingUrlRef.current = null;
        }
        setPendingImg(null);
    }

    async function onFile(file: File | undefined) {
        if (!file) return;
        setBusy(true);

        const url = URL.createObjectURL(file);
        pendingUrlRef.current = url;

        try {
            const img = await loadImageFromUrl(url);

            if (img.width < spec.w || img.height < spec.h) {
                setReqMsg(t('common.img_too_small', img.width, img.height));
                setShowReq(true);
                revokePending();
                setBusy(false);
                return;
            }

            setPendingImg(img);

            // Avatar (0) and main (1) must be SFW — gate first.
            if (order === 0 || order === 1) {
                setShowSfwGate(true);
            } else {
                setShowCrop(true);
            }
        } catch {
            setReqMsg(t('common.img_invalid'));
            setShowReq(true);
            URL.revokeObjectURL(url);
            pendingUrlRef.current = null;
        }

        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
    }

    function onSfwGateAccept() {
        setShowSfwGate(false);
        setShowCrop(true);
    }

    function onSfwGateCancel() {
        setShowSfwGate(false);
        revokePending();
    }

    function onCropConfirm(crop: CropRect) {
        const img = pendingImg;
        if (!img) return;
        const isNsfw = isExtra && declaration === PhotoNsfwDecl.Nsfw;
        const dto = processCroppedPhoto(img, crop, kind, isNsfw);
        // Revoke AFTER processCroppedPhoto so drawImage finishes with the decoded buffer.
        revokePending();
        setShowCrop(false);
        onChange(dto);
    }

    function onCropCancel() {
        revokePending();
        setShowCrop(false);
    }

    function openPicker() {
        inputRef.current?.click();
    }

    const localSrc = value ? previewUrl(value.Base64) : null;
    const displaySrc = localSrc ?? serverDisplayUrl;
    const hasImage = !!displaySrc && !pendingRemove;

    function handleDeclChange(raw: number) {
        const d = raw as PhotoNsfwDecl;
        if (d === PhotoNsfwDecl.Nsfw && race === Race.Lalafell) {
            setShowLalafell(true);
            return;
        }
        onDeclaration?.(d);
        // Sync IsNsfw flag in the already-processed DTO
        if (value) {
            onChange({...value, IsNsfw: d === PhotoNsfwDecl.Nsfw});
        }
    }

    return (
        <>
            <div className={cn('flex flex-col gap-1.5', className)}>
                {/* Image tile */}
                <div
                    className={cn(
                        'relative flex flex-1 items-center justify-center overflow-hidden',
                        'border-2 border-dashed border-line/20 bg-void/20 transition-colors',
                        kind === 'avatar' ? 'rounded-full' : 'rounded-2xl',
                        !hasImage && !busy && 'cursor-pointer hover:border-accent/60',
                        pendingRemove && 'border-danger/40',
                    )}
                    onClick={!hasImage && !busy ? openPicker : undefined}
                >
                    {pendingRemove && serverDisplayUrl ? (
                        <>
                            <img src={serverDisplayUrl} alt="" className="h-full w-full object-cover opacity-40"
                                 draggable={false}/>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-danger">✕</span>
                            </div>
                        </>
                    ) : hasImage ? (
                        <img src={displaySrc!} alt="" className="h-full w-full object-cover" draggable={false}/>
                    ) : busy ? (
                        <LoadingSpinner/>
                    ) : (
                        <span className="select-none text-2xl text-strong/40">+</span>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-1.5">
                    {pendingRemove ? (
                        onUndoRemove && (
                            <button
                                type="button"
                                onClick={onUndoRemove}
                                className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-accent hover:bg-accent/10"
                            >
                                {t('photo.undo_remove')}
                            </button>
                        )
                    ) : (
                        <>
                            {(hasImage || value) && (
                                <button
                                    type="button"
                                    onClick={openPicker}
                                    className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-body ring-1 ring-line/15 hover:bg-surface/10"
                                >
                                    {t('photo.replace')}
                                </button>
                            )}
                            {value && (
                                <button
                                    type="button"
                                    onClick={() => onChange(null)}
                                    className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-danger hover:bg-danger/10"
                                >
                                    {t('photo.remove')}
                                </button>
                            )}
                            {!value && onRemove && serverDisplayUrl && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-danger hover:bg-danger/10"
                                >
                                    {t('photo.remove')}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* NSFW declaration for extras */}
                {isExtra && value && (
                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium uppercase tracking-wide text-accent-light">
                            {t('profile.sfw_or_nsfw')}
                        </label>
                        <select
                            value={declaration ?? PhotoNsfwDecl.Unselected}
                            onChange={(e) => handleDeclChange(Number(e.target.value))}
                            className="w-full appearance-none rounded-xl border border-line/10 bg-void/30 px-3 py-1.5 text-[13px] text-body outline-none focus:border-accent"
                        >
                            <option value={PhotoNsfwDecl.Unselected} className="bg-[#160d1f]">
                                {t('common.nsfw_decl_unselected')}
                            </option>
                            <option value={PhotoNsfwDecl.Sfw} className="bg-[#160d1f]">
                                {t('common.nsfw_decl_sfw')}
                            </option>
                            <option value={PhotoNsfwDecl.Nsfw} className="bg-[#160d1f]">
                                {t('common.nsfw_decl_nsfw')}
                            </option>
                        </select>
                        {declaration === PhotoNsfwDecl.Sfw && (
                            <p className="text-[11px] leading-snug text-danger/80">
                                {t('profile.sfw_mismatch_warning')}
                            </p>
                        )}
                    </div>
                )}

                {/* Server NSFW status when no local replacement */}
                {isExtra && !value && serverDisplayUrl && !pendingRemove && serverIsNsfw !== undefined && (
                    <p className={cn('text-[11px]', serverIsNsfw ? 'text-amber' : 'text-success/80')}>
                        {serverIsNsfw ? t('profile.currently_nsfw') : t('profile.currently_sfw')}
                    </p>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void onFile(e.target.files?.[0])}
                />
            </div>

            {/* Modals — rendered inside the phone shell (absolute inset-0 z-50) */}
            <SfwGateModal open={showSfwGate} onAccept={onSfwGateAccept} onCancel={onSfwGateCancel}/>
            <ImageCropModal
                open={showCrop}
                img={pendingImg}
                kind={kind}
                onConfirm={onCropConfirm}
                onCancel={onCropCancel}
            />
            <ImageRequirementsModal open={showReq} message={reqMsg} onClose={() => setShowReq(false)}/>
            <LalafellNsfwModal open={showLalafell} onClose={() => setShowLalafell(false)}/>
        </>
    );
}
