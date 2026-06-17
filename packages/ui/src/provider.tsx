/**
 * MediaStudioProvider — monté à la racine de l'app. Détient la façade headless
 * (Core + JobQueue + licence), l'état discret des jobs d'export et l'ouverture de
 * l'éditeur en overlay. API impérative via `useMediaStudio()`.
 * Voir docs/26-STUDIO-FLOW.md, docs/27-BACKGROUND-JOBS.md, ADR-0017.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createMediaStudio,
  type ExportConfig,
  type ExportJob,
  type MediaStudio,
  type MediaStudioDeps,
} from "@media-studio/sdk";

export interface MediaStudioContextValue {
  /** Façade headless (core, jobs, exportProject). */
  readonly studio: MediaStudio;
  /** État discret des jobs d'export (rafraîchi sur événement). */
  readonly jobs: readonly ExportJob[];
  /** L'éditeur est-il présenté en overlay ? */
  readonly isOpen: boolean;
  /** Présente l'éditeur (overlay/portail). */
  open(): void;
  /** Ferme l'éditeur (les jobs en cours continuent). */
  close(): void;
  /** Snapshot le projet courant et lance un export en arrière-plan. */
  exportProject(config: ExportConfig): void;
}

const MediaStudioContext = createContext<MediaStudioContextValue | null>(null);

export type MediaStudioProviderProps = React.PropsWithChildren<MediaStudioDeps>;

export function MediaStudioProvider({
  children,
  ...deps
}: MediaStudioProviderProps): React.JSX.Element {
  // Façade créée une seule fois (stable sur la durée de vie du provider).
  const studioRef = useRef<MediaStudio | null>(null);
  studioRef.current ??= createMediaStudio(deps);
  const studio = studioRef.current;

  const [jobs, setJobs] = useState<readonly ExportJob[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const queue = studio.jobs;
    if (!queue) return;
    const refresh = (): void => setJobs(queue.list().map((j) => ({ ...j })));
    const events = ["job:started", "job:progress", "job:completed", "job:failed"] as const;
    const unsubscribers = events.map((event) => queue.on(event, refresh));
    return () => unsubscribers.forEach((u) => u());
  }, [studio]);

  const value = useMemo<MediaStudioContextValue>(
    () => ({
      studio,
      jobs,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      exportProject: (config: ExportConfig) => studio.exportProject(config),
    }),
    [studio, jobs, isOpen],
  );

  return <MediaStudioContext.Provider value={value}>{children}</MediaStudioContext.Provider>;
}

/** Accès à la façade Media Studio. Doit être appelé sous `<MediaStudioProvider>`. */
export function useMediaStudio(): MediaStudioContextValue {
  const value = useContext(MediaStudioContext);
  if (!value) {
    throw new Error("useMediaStudio() doit être utilisé dans un <MediaStudioProvider>.");
  }
  return value;
}
