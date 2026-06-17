/** Horodatage ISO8601 courant. Centralisé pour faciliter un mock d'horloge en test. */
export const nowIso = (): string => new Date().toISOString();
