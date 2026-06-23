// Client-side photo preparation for PhotoUploadDto. Ports PhotoTransform.cs (AetherLove.Shared).
// Crop rect units are PIXELS (confirmed against SharedUiHelpers.ReadPhotoUpload). The processed
// image is sent with CropX/Y=0 and CropWidth/Height = target dims — the server reads this as
// "already processed, no further crop needed". Upload encoding is lossless PNG; the server does
// the single lossy re-encode to WebP.

import type {PhotoUploadDto} from '../shared/dtos';

export const PHOTO_SPEC = {
    avatar: {w: 100, h: 100},
    portrait: {w: 350, h: 560},
} as const;

export const MIN_CROP_SIDE = 32;

export type CropRect = { x: number; y: number; width: number; height: number };

/** Loads a file and revokes the object URL once decoded. */
export function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(e);
        };
        img.src = url;
    });
}

/** Loads from a caller-owned URL (does not revoke). */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/** Largest centered crop of the target aspect at 75% fit (mirrors ImageCropWidget default). */
export function defaultCropRect(imgW: number, imgH: number, aspectWoverH: number): CropRect {
    const maxByWidth = imgW * 0.75;
    const maxByHeight = imgH * aspectWoverH * 0.75;
    const cropW = Math.min(maxByWidth, maxByHeight);
    const cropH = cropW / aspectWoverH;
    return {
        x: (imgW - cropW) / 2,
        y: (imgH - cropH) / 2,
        width: cropW,
        height: cropH,
    };
}

/** Renders the crop region of img to target dimensions. Returns PNG base64 (no data-url prefix). */
export function renderCrop(img: HTMLImageElement, crop: CropRect, target: { w: number; h: number }): string {
    const canvas = document.createElement('canvas');
    canvas.width = target.w;
    canvas.height = target.h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, target.w, target.h);
    return canvas.toDataURL('image/png').split(',')[1];
}

export function processCroppedPhoto(
    img: HTMLImageElement,
    crop: CropRect,
    kind: 'avatar' | 'portrait',
    isNsfw = false,
): PhotoUploadDto {
    const spec = PHOTO_SPEC[kind];
    const base64 = renderCrop(img, crop, spec);
    return {Base64: base64, CropX: 0, CropY: 0, CropWidth: spec.w, CropHeight: spec.h, IsNsfw: isNsfw};
}

/** A data-url preview for a processed PNG base64. */
export function previewUrl(base64: string): string {
    return `data:image/png;base64,${base64}`;
}
