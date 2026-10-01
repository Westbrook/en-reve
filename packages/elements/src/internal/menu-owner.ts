/** Internal composition capability. No consumer receives a private shadow node. */
export interface MenuItemOwner {
  ready(): boolean;
  owns(item: HTMLElement): boolean;
  capture(): () => void;
  accepted(checkpoint: () => void): void;
  radioPeers(item: HTMLElement): readonly MenuCheckState[];
  radioSelected(item: HTMLElement): void;
}
const owners = new WeakMap<HTMLElement, MenuItemOwner>();
export function ownMenuItem(item: HTMLElement, owner: MenuItemOwner): () => void {
  owners.set(item, owner);
  return () => { if (owners.get(item) === owner) owners.delete(item); };
}
export function menuItemOwner(item: HTMLElement): MenuItemOwner | undefined { return owners.get(item); }

/** Internal state leases let a radio proposal stage its whole group before dispatch. */
export interface MenuCheckState {
  element: HTMLElement;
  checked(): boolean;
  revision(): number;
  stage(value: boolean): void;
  write(value: boolean): void;
}
const checks = new WeakMap<HTMLElement, MenuCheckState>();
export function registerMenuCheckState(element: HTMLElement, state: MenuCheckState): void { checks.set(element, state); }
export function menuCheckState(element: HTMLElement): MenuCheckState | undefined { return checks.get(element); }
