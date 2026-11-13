"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DriveDocument } from "@/lib/okr/types";

const OFFSET_X = 14;
const OFFSET_Y = 14;

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-2 gap-y-0.5">
      <dt className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-white/55">
        {label}
      </dt>
      <dd className="max-w-[14rem] truncate text-xs text-white/95">
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

function HoverPanel({
  document,
  x,
  y,
}: {
  document: DriveDocument;
  x: number;
  y: number;
}) {
  const left = Math.min(x + OFFSET_X, window.innerWidth - 240);
  const top = Math.min(y + OFFSET_Y, window.innerHeight - 180);

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-white/15 bg-slate-950/92 px-2.5 py-2 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md"
      style={{ left, top }}
      role="tooltip"
    >
      <p className="mb-1.5 truncate text-[0.7rem] font-semibold text-white">
        Task-Details
      </p>
      <dl className="space-y-1">
        <DetailRow label="Typ" value={document.taskType?.name} />
        <DetailRow label="Status" value={document.task.status?.name} />
        <DetailRow label="Verantw." value={document.responsible?.name} />
        <DetailRow label="Betreff" value={document.task.name} />
        <DetailRow label="Projekt" value={document.project?.name} />
      </dl>
    </div>
  );
}

export function TaskHoverDetails({
  document: driveDocument,
}: {
  document: DriveDocument;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 z-10"
        onMouseEnter={(event) =>
          setPos({ x: event.clientX, y: event.clientY })
        }
        onMouseMove={(event) =>
          setPos({ x: event.clientX, y: event.clientY })
        }
        onMouseLeave={() => setPos(null)}
        aria-hidden
      />
      {mounted && pos
        ? createPortal(
            <HoverPanel document={driveDocument} x={pos.x} y={pos.y} />,
            globalThis.document.body
          )
        : null}
    </>
  );
}
