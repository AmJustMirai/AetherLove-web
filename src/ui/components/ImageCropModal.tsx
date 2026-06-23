// Ports ImageCropWidget (Widgets/ImageCropWidget.cs) + ImageCropPopup (Widgets/ImageCropPopup.cs).
// Full-screen scrim over the phone shell with a draggable, fixed-aspect crop rectangle. The image
// is scaled to fit; the crop rect is tracked in image-pixel coordinates throughout.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { type CropRect, defaultCropRect, MIN_CROP_SIDE, PHOTO_SPEC } from '../photo';
import { prefersReducedMotion } from '@/effects/reduceMotion.ts';
import { useT } from '@/i18n/useT.ts';

interface ImageCropModalProps {
  open: boolean;
  /** Must have img.src pointing to a valid (caller-owned) URL for display. */
  img: HTMLImageElement | null;
  kind: 'avatar' | 'portrait';
  onConfirm: (crop: CropRect) => void;
  onCancel: () => void;
}

export function ImageCropModal({ open, img, kind, onConfirm, onCancel }: ImageCropModalProps) {
  const t = useT();
  const spec = PHOTO_SPEC[kind];
  const aspectWoverH = spec.w / spec.h;

  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  useEffect(() => {
    if (!open || !img) return;
    setCrop(defaultCropRect(img.width, img.height, aspectWoverH));
  }, [open, img, aspectWoverH]);

  useEffect(() => {
    if (!open || !img || !containerRef.current) return;
    const compute = () => {
      const el = containerRef.current;
      if (!el || !img) return;
      const { width: availW, height: availH } = el.getBoundingClientRect();
      const imgAspect = img.width / img.height;
      const s = imgAspect > availW / availH ? availW / img.width : availH / img.height;
      setScale(s);
      setImgOffset({
        x: (availW - img.width * s) / 2,
        y: (availH - img.height * s) / 2,
      });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [open, img]);

  const clampCrop = useCallback(
    (c: CropRect): CropRect => {
      if (!img) return c;
      let w = Math.max(MIN_CROP_SIDE, c.width);
      let h = w / aspectWoverH;
      const maxW = img.width - Math.max(0, c.x);
      const maxH = img.height - Math.max(0, c.y);
      if (w > maxW) {
        w = maxW;
        h = w / aspectWoverH;
      }
      if (h > maxH) {
        h = maxH;
        w = h * aspectWoverH;
      }
      w = Math.max(MIN_CROP_SIDE, w);
      h = w / aspectWoverH;
      const x = Math.max(0, Math.min(c.x, img.width - w));
      const y = Math.max(0, Math.min(c.y, img.height - h));
      return { x, y, width: w, height: h };
    },
    [img, aspectWoverH]
  );

  const onPointerDownMove = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        type: 'move',
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...crop },
      };
    },
    [crop]
  );

  const onPointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        type: 'resize',
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...crop },
      };
    },
    [crop]
  );

  const onPointerMoveShared = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !img) return;
      const dx = (e.clientX - dragRef.current.startX) / scale;
      const dy = (e.clientY - dragRef.current.startY) / scale;
      const s = dragRef.current.startCrop;
      if (dragRef.current.type === 'move') {
        setCrop(clampCrop({ ...s, x: s.x + dx, y: s.y + dy }));
      } else {
        const newW = Math.max(MIN_CROP_SIDE, s.width + dx);
        const maxW = Math.min(img.width - s.x, (img.height - s.y) * aspectWoverH);
        const w = Math.min(newW, Math.max(maxW, MIN_CROP_SIDE));
        setCrop({ x: s.x, y: s.y, width: w, height: w / aspectWoverH });
      }
    },
    [img, scale, aspectWoverH, clampCrop]
  );

  const onPointerUpShared = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(clampCrop(crop));
  }, [crop, clampCrop, onConfirm]);

  if (!img) return null;

  const dispW = img.width * scale;
  const dispH = img.height * scale;
  const cx = crop.x * scale;
  const cy = crop.y * scale;
  const cw = crop.width * scale;
  const ch = crop.height * scale;
  const handleSz = 28;
  const tick = 14;
  const reduced = prefersReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex flex-col bg-scrim/90"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div ref={containerRef} className="relative flex-1 overflow-hidden">
            {/* Scaled image */}
            <img
              src={img.src}
              alt=""
              draggable={false}
              style={{
                position: 'absolute',
                left: imgOffset.x,
                top: imgOffset.y,
                width: dispW,
                height: dispH,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
            {/* Overlay: dimmed mask + crop border + corner ticks */}
            <svg
              style={{
                position: 'absolute',
                left: imgOffset.x,
                top: imgOffset.y,
                width: dispW,
                height: dispH,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <rect x={0} y={0} width={dispW} height={cy} fill="rgba(0,0,0,0.55)" />
              <rect x={0} y={cy} width={cx} height={ch} fill="rgba(0,0,0,0.55)" />
              <rect
                x={cx + cw}
                y={cy}
                width={dispW - cx - cw}
                height={ch}
                fill="rgba(0,0,0,0.55)"
              />
              <rect
                x={0}
                y={cy + ch}
                width={dispW}
                height={dispH - cy - ch}
                fill="rgba(0,0,0,0.55)"
              />
              <rect
                x={cx}
                y={cy}
                width={cw}
                height={ch}
                fill="none"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.5"
              />
              {/* Top-left corner */}
              <line
                x1={cx}
                y1={cy}
                x2={cx + tick}
                y2={cy}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy + tick}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Top-right corner */}
              <line
                x1={cx + cw}
                y1={cy}
                x2={cx + cw - tick}
                y2={cy}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1={cx + cw}
                y1={cy}
                x2={cx + cw}
                y2={cy + tick}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Bottom-left corner */}
              <line
                x1={cx}
                y1={cy + ch}
                x2={cx + tick}
                y2={cy + ch}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1={cx}
                y1={cy + ch}
                x2={cx}
                y2={cy + ch - tick}
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            {/* Move handle (crop body minus bottom-right corner) */}
            <div
              style={{
                position: 'absolute',
                left: imgOffset.x + cx,
                top: imgOffset.y + cy,
                width: Math.max(0, cw - handleSz),
                height: Math.max(0, ch - handleSz),
                cursor: 'move',
                touchAction: 'none',
              }}
              onPointerDown={onPointerDownMove}
              onPointerMove={onPointerMoveShared}
              onPointerUp={onPointerUpShared}
            />
            {/* Resize handle — bottom-right, accent-coloured */}
            <div
              style={{
                position: 'absolute',
                left: imgOffset.x + cx + cw - handleSz,
                top: imgOffset.y + cy + ch - handleSz,
                width: handleSz,
                height: handleSz,
                cursor: 'nwse-resize',
                touchAction: 'none',
                borderRadius: 4,
                background: 'rgb(var(--al-accent))',
                border: '1.5px solid rgba(255,255,255,0.6)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
              onPointerDown={onPointerDownResize}
              onPointerMove={onPointerMoveShared}
              onPointerUp={onPointerUpShared}
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line/10 bg-void px-5 py-4">
            <Button variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirm}>{t('common.use_this_crop')}</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
