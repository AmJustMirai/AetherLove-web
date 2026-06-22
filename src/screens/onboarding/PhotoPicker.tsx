// A single photo slot: tap to pick a file, which is centre-cropped + downscaled to the target spec and
// handed back as a PhotoUploadDto. Shows the processed preview. Ports the slot tiles from Step5Avatar /
// Step6Photos (without the full crop popup, which is a later batch).

import {useRef, useState} from 'react';
import type {PhotoUploadDto} from '../../shared/dtos';
import {previewUrl, processPhoto} from '../../ui/photo';
import {LoadingSpinner} from '../../ui/components';
import {cn} from '../../ui/cn';

interface PhotoPickerProps {
    value: PhotoUploadDto | null;
    onChange: (photo: PhotoUploadDto | null) => void;
    kind: 'avatar' | 'portrait';
    label?: string;
    className?: string;
}

export function PhotoPicker({value, onChange, kind, label, className}: PhotoPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);

    async function onFile(file: File | undefined) {
        if (!file) return;
        setBusy(true);
        try {
            onChange(await processPhoto(file, kind));
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
                'relative flex items-center justify-center overflow-hidden border-2 border-dashed border-line/20 bg-void/20 transition-colors hover:border-accent/60',
                kind === 'avatar' ? 'rounded-full' : 'rounded-2xl',
                className,
            )}
            aria-label={label ?? 'Add photo'}
        >
            {value ? (
                <img src={previewUrl(value.Base64)} alt="" className="h-full w-full object-cover"/>
            ) : busy ? (
                <LoadingSpinner/>
            ) : (
                <span className="text-2xl text-strong/40">+</span>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
            />
        </button>
    );
}
