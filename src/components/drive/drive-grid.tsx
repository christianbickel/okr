import type { DriveDocument, DriveDocumentGroup } from "@/lib/okr/types";
import { formatFileSize } from "./format";
import { DocumentThumbnail } from "./document-thumbnail";
import { TaskHoverDetails } from "./task-hover-details";

function DocumentCard({ document }: { document: DriveDocument }) {
  const meta = [
    document.project?.name,
    document.responsible?.name,
    formatFileSize(document.size),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={document.openUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background transition-[transform,box-shadow,border-color] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 hover:border-border hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] active:scale-[0.96]"
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border/60 bg-muted/30">
        <DocumentThumbnail
          src={document.thumbnailUrl}
          alt={document.name}
          previewType={document.previewType}
        />
        <TaskHoverDetails document={document} />
      </div>
      <div className="flex min-h-[4.5rem] flex-col gap-1 px-3 py-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:underline">
          {document.name}
        </p>
        <p className="line-clamp-1 text-xs text-muted-foreground">{meta}</p>
      </div>
    </a>
  );
}

export function DriveGrid({ groups }: { groups: DriveDocumentGroup[] }) {
  if (groups.every((g) => g.documents.length === 0)) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 px-6 py-16 text-center">
        <p className="text-sm font-medium">Keine Dokumente gefunden</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Anhänge aus Consolidate-Tasks erscheinen hier, sobald sie für dich
          sichtbar sind.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          {group.key !== "all" ? (
            <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
              <h2 className="text-sm font-semibold tracking-tight">
                {group.label}
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {group.documents.length}
              </span>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {group.documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
