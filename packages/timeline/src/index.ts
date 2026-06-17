/**
 * @media-studio/timeline — conversion temps↔pixels et moteur de snap (headless).
 * Les gestes (drag/trim/zoom) et le commit via CommandBus sont câblés par l'UI ;
 * ici, logique pure. Voir docs/05-TIMELINE.md.
 */
export { createTimeScale, type TimeScale } from "./scale";
export { collectSnapPoints, snapToPoints, createSnapEngine, type SnapEngine } from "./snap";
