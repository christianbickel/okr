"use client";

import {
  File,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react";
import { useState } from "react";
import type { DrivePreviewType } from "@/lib/okr/types";
import { cn } from "@/lib/utils";

function FileTypeIcon({
  previewType,
  className,
}: {
  previewType: DrivePreviewType;
  className?: string;
}) {
  const props = { className: cn("size-10 stroke-[1.25]", className) };
  switch (previewType) {
    case "Image":
      return <FileImage {...props} />;
    case "Video":
      return <FileVideo {...props} />;
    case "Audio":
      return <FileAudio {...props} />;
    case "Pdf":
    case "Text":
      return <FileText {...props} />;
    case "Office":
      return <FileSpreadsheet {...props} />;
    default:
      return <File {...props} />;
  }
}

export function DocumentThumbnail({
  src,
  alt,
  previewType,
}: {
  src: string;
  alt: string;
  previewType: DrivePreviewType;
}) {
  const [failed, setFailed] = useState(false);
  const showImage =
    !failed &&
    (previewType === "Image" ||
      previewType === "Pdf" ||
      previewType === "Office" ||
      previewType === "Video");

  if (!showImage) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,oklch(0.97_0.01_240),oklch(0.93_0.02_220))] text-sky-800/70">
        <FileTypeIcon previewType={previewType} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-muted/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="absolute inset-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] object-cover outline outline-1 outline-black/10"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
