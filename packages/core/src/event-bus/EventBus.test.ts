import { describe, expect, it, vi } from "vitest";
import { EventBus } from "./EventBus";

describe("EventBus", () => {
  it("notifie les abonnés sur emit", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    bus.on("export:progress", listener);
    bus.emit("export:progress", 42);
    expect(listener).toHaveBeenCalledWith(42);
  });

  it("gère les événements sans payload", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    bus.on("runtime:play", listener);
    bus.emit("runtime:play");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("le désabonnement arrête les notifications", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    const unsubscribe = bus.on("export:progress", listener);
    unsubscribe();
    bus.emit("export:progress", 1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("clear() supprime tous les abonnements", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    bus.on("runtime:pause", listener);
    bus.clear();
    bus.emit("runtime:pause");
    expect(listener).not.toHaveBeenCalled();
  });
});
