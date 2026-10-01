/** Pointer coordination is allocated only for a live, resolved group element. */
const groups = new WeakMap<Element, TooltipWarmupGroup>();

class TooltipWarmupGroup {
  #members = new Map<object, { handoff: (focus: boolean) => void; focused: () => boolean; resume: () => void }>();
  #focused = new Set<object>();
  #active = new Set<object>();
  #warm = false;
  #cooldown: ReturnType<typeof setTimeout> | undefined;

  get warm(): boolean { return this.#warm; }

  join(member: object, handoff: (focus: boolean) => void, focused: () => boolean, resume: () => void): void {
    this.#members.set(member, { handoff, focused, resume });
  }

  hasFocusedPeer(source: object): boolean {
    return [...this.#members].some(([member, callbacks]) => member !== source && callbacks.focused());
  }

  focus(member: object, active: boolean): void {
    if (active === this.#focused.has(member)) return;
    if (active) {
      this.#focused.add(member);
      const source = this.#members.get(member);
      for (const [peer, callbacks] of [...this.#members]) {
        if (!source?.focused()) break;
        if (peer !== member && this.#members.get(peer) === callbacks) callbacks.handoff(true);
      }
    } else {
      this.#focused.delete(member);
      // Membership can change from inside a peer's reconciliation or en-change.
      queueMicrotask(() => {
        for (const [peer, callbacks] of [...this.#members]) {
          if (!this.hasFocusedPeer(peer)) callbacks.resume();
        }
      });
    }
  }

  leave(member: object): void {
    this.focus(member, false);
    this.#members.delete(member);
    this.activity(member, false);
    if (!this.#members.size) this.cool();
  }

  activity(member: object, active: boolean): void {
    if (active && this.#members.has(member)) this.#active.add(member);
    else this.#active.delete(member);
    if (this.#active.size) {
      clearTimeout(this.#cooldown);
      this.#cooldown = undefined;
    } else if (this.#warm && this.#cooldown === undefined) {
      this.#cooldown = setTimeout(() => this.cool(), 500);
    }
  }

  markWarm(source: object, stillPresented: () => boolean): void {
    this.#warm = true;
    // An accepted opening may have completed after the pointer left.
    this.activity(this, false);
    // A peer close listener may synchronously cancel, rebind or close the new help.
    for (const [member, callbacks] of [...this.#members]) {
      if (!stillPresented()) break;
      if (member !== source && this.#members.get(member) === callbacks) callbacks.handoff(false);
    }
  }

  cool(): void {
    this.#warm = false;
    clearTimeout(this.#cooldown);
    this.#cooldown = undefined;
  }
}

/** Create an independent scope for contextual tooltip timing and handoff. No DOM or registration work. */
export function createTooltipWarmupGroup(): TooltipWarmupGroup { return new TooltipWarmupGroup(); }

export function tooltipWarmupGroup(element: Element): TooltipWarmupGroup {
  let group = groups.get(element);
  if (!group) groups.set(element, group = new TooltipWarmupGroup());
  return group;
}

export type { TooltipWarmupGroup };
