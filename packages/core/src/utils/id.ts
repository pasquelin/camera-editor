/**
 * Générateur d'identifiant léger (sans dépendance externe). Suffisant pour les ids
 * internes du Core ; un générateur d'UUID conforme peut être injecté côté hôte.
 */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
