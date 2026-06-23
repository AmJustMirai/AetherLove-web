// Web port of Widgets/NewsBodyRenderer.cs — renders a news body as an ordered list of lines, each either
// text (native unicode emoji; the plugin's custom emoji atlas collapses to the browser's own rendering) or
// a centered image. Images come as WebP bytes from the hub and are wrapped in object URLs.

import { useEffect, useMemo } from 'react';
import { NewsLineKind } from '../shared/enums';
import type { NewsLineDto } from '../shared/dtos';
import { revokeUrl, webpUrl } from './image';

function NewsImage({ line }: { line: NewsLineDto }) {
  const url = useMemo(() => webpUrl(line.ImageBytes), [line.ImageBytes]);
  useEffect(() => () => revokeUrl(url), [url]);
  if (!url) return null;
  const ratio = line.Width && line.Height ? line.Width / line.Height : undefined;
  return (
    <img
      src={url}
      alt=""
      className="mx-auto h-auto max-w-full rounded-xl"
      style={ratio ? { aspectRatio: String(ratio) } : undefined}
    />
  );
}

export function NewsBody({ lines }: { lines: NewsLineDto[] }) {
  return (
    <div className="space-y-3">
      {lines.map((line, i) =>
        line.Kind === NewsLineKind.Image && line.ImageBytes?.length ? (
          <NewsImage key={i} line={line} />
        ) : line.Text ? (
          <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-body">
            {line.Text}
          </p>
        ) : null
      )}
    </div>
  );
}
