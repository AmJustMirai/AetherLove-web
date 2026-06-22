// Client-side photo preparation for PhotoUploadDto. The plugin let the user crop, then the *server*
// crops+resizes to PhotoSpec (avatar 100², portrait 350×560). A full crop UI is a later batch; for now
// we centre-crop to the target aspect and downscale in a canvas, then send a full-frame crop rect.
//
// Crop rect units are PIXELS (confirmed against the C# SharedUiHelpers.ReadPhotoUpload). Since we've
// already cropped+resized to the target, the rect is the full processed image: CropX/Y=0 and
// CropWidth/Height = the target dimensions. The server reads that as "already processed, no further crop".

import type {PhotoUploadDto} from '../shared/dtos';

export const PHOTO_SPEC = {
    avatar: {w: 100, h: 100},
    portrait: {w: 350, h: 560},
} as const;

function loadImage(file: File): Promise<HTMLImageElement> {
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

/** Centre-crops `img` to the target aspect, scales to target size, returns base64 (no data-url prefix). */
function renderToBase64(img: HTMLImageElement, target: { w: number; h: number }): string {
    const targetAspect = target.w / target.h;
    const srcAspect = img.width / img.height;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (srcAspect > targetAspect) {
        // Source too wide — crop the sides.
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
    } else {
        // Source too tall — crop top/bottom.
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = target.w;
    canvas.height = target.h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, target.w, target.h);
    return canvas.toDataURL('image/jpeg', 0.88).split(',')[1];
}

export async function processPhoto(
    file: File,
    kind: 'avatar' | 'portrait',
    isNsfw = false,
): Promise<PhotoUploadDto> {
    const img = await loadImage(file);
    const spec = PHOTO_SPEC[kind];
    const base64 = renderToBase64(img, spec);
    // Crop fields are pixels, not normalized: we've already cropped+resized to the target, so the rect is
    // the full processed image (CropWidth/Height = target dims). That's the server's "no further crop needed"
    // signal — sending 1×1 reads as a 1px crop and trips img_crop_too_small (min 32px/side).
    return {Base64: base64, CropX: 0, CropY: 0, CropWidth: spec.w, CropHeight: spec.h, IsNsfw: isNsfw};
}

/** A data-url preview for an already-processed base64 JPEG. */
export function previewUrl(base64: string): string {
    return `data:image/jpeg;base64,${base64}`;
}
