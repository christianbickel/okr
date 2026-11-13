import { ExternalLink } from "lucide-react";

import type { LinkedProject } from "@/lib/okr/types";
import { cn } from "@/lib/utils";

interface ProjectLinksProps {
  projects: LinkedProject[];
  unauthorized?: boolean;
  className?: string;
  /** Compact chips for list rows. */
  compact?: boolean;
}

function ProjectChip({
  project,
  compact,
}: {
  project: LinkedProject;
  compact?: boolean;
}) {
  const className = compact
    ? "inline-flex max-w-full items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[0.7rem] text-sky-800 transition-colors hover:bg-sky-500/20 dark:text-sky-300"
    : "inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-foreground hover:underline";

  const label = (
    <>
      <span className="truncate">{project.name}</span>
      {project.url ? (
        <ExternalLink
          className={cn(
            "shrink-0 opacity-60",
            compact ? "size-2.5" : "size-3.5"
          )}
          aria-hidden
        />
      ) : null}
    </>
  );

  if (!project.url) {
    return (
      <span title={project.databaseId} className={className}>
        {label}
      </span>
    );
  }

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      title={
        project.databaseId
          ? `${project.databaseId} · in Consolidate öffnen`
          : "In Consolidate öffnen"
      }
      className={className}
    >
      {label}
    </a>
  );
}

export function ProjectLinks({
  projects,
  unauthorized = false,
  className,
  compact = false,
}: ProjectLinksProps) {
  if (projects.length === 0) {
    if (compact) return null;
    return (
      <div className={cn("space-y-1", className)}>
        <h2 className="text-sm font-medium text-muted-foreground">Projekte</h2>
        <p className="text-sm text-muted-foreground">
          {unauthorized
            ? "Keine Leserechte auf Consolidate-Projekte (Feld „Ziele“). Mit einem User-API-Key anmelden oder Project-Rechte für den Service-User setzen."
            : "Noch keine Projekte über das Feld „Ziele“ verknüpft."}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {projects.map((project) => (
          <ProjectChip key={project.id} project={project} compact />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h2 className="text-sm font-medium text-muted-foreground">
        Projekte{" "}
        <span className="font-normal tabular-nums">({projects.length})</span>
      </h2>
      <ul className="divide-y rounded-xl border border-border/80">
        {projects.map((project) => (
          <li key={project.id} className="px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <ProjectChip project={project} />
              {project.databaseId ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {project.databaseId}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Verknüpft in Consolidate über Projektfeld „Ziele“. Klick öffnet die
        Projekt-Detailansicht.
      </p>
    </div>
  );
}
