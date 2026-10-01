import { LitElement, html } from "lit";
import { Signal } from "signal-polyfill";
import { SignalController } from "@en-reve/primitives/interactions/signal-controller.js";
import { afterAcceptedChange } from "./change-consumption.js";
import {
  createShowcaseState,
  people,
  type CardId,
  type ShowcaseState,
} from "./model.js";
import { showcaseGrid } from "./template.js";
type Field = HTMLElement & {
  value: string;
  checked: boolean;
  reportValidity(): boolean;
  focus(): void;
};
type Overlay = HTMLElement & {
  open: boolean;
  updateComplete: Promise<unknown>;
};
export class ShowcaseApp extends LitElement {
  private state = new Signal.State(createShowcaseState());
  private revision = new Signal.State(0);
  private observer = new SignalController(
    this,
    () => [this.state.get(), this.revision.get()] as const,
  );
  readonly resets = new Map<CardId, number>();
  get data() {
    return this.state.get();
  }
  private touch() {
    this.revision.set(this.revision.get() + 1);
  }
  patch(patch: Partial<ShowcaseState>) {
    this.state.set({ ...this.data, ...patch });
  }
  href(path: string) {
    return path === "/showcase"
      ? location.pathname
      : "https://en-reve-docs.reve-ai-0869.chatgpt.site" + path;
  }
  protected createRenderRoot() {
    return this;
  }
  field(id: string) {
    return this.querySelector<Field>(`#${id}`)!;
  }
  value(id: string) {
    return this.field(id).value;
  }
  valid(...ids: string[]) {
    for (const id of ids)
      if (!this.field(id).reportValidity()) {
        this.field(id).focus();
        return false;
      }
    return true;
  }
  change<T>(event: Event, read: (host: Field) => T, apply: (value: T) => void) {
    afterAcceptedChange<Field, T>(event, read, apply);
  }
  setLayout(layout: string) {
    if (["portrait", "landscape", "reset-canvas"].includes(layout))
      this.patch({ canvas: layout === "reset-canvas" ? "portrait" : layout });
  }
  command(event: Event) {
    const surface = event.currentTarget as Overlay;
    const action = (event as CustomEvent<{ action: string }>).detail?.action;
    queueMicrotask(async () => {
      await surface.updateComplete;
      if (!event.defaultPrevented && surface.isConnected && !surface.open)
        this.setLayout(action);
    });
  }
  open(id: string) {
    (this.querySelector(`#${id}`) as Overlay).open = true;
  }
  close(id: string) {
    (this.querySelector(`#${id}`) as Overlay).open = false;
  }
  async approve() {
    this.patch({ approved: true });
    this.close("showcase-approve-dialog");
    await this.updateComplete;
    await (this.querySelector("#showcase-approve-dialog") as Overlay)
      .updateComplete;
    const heading = this.querySelector<HTMLElement>(
      "#showcase-heading-readiness",
    )!;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  createProject() {
    if (!this.valid("project-title", "project-date")) {
      this.patch({
        projectStatus: "Add a project name and a valid review date.",
      });
      return;
    }
    this.patch({
      project: this.value("project-title"),
      projectStatus: `${this.value("project-title")} created locally. Review: ${this.value("project-date")}.`,
    });
  }
  invite() {
    const person = people.find(
      (person) => person.value === this.value("team-person"),
    );
    if (!person) {
      this.patch({ invitationStatus: "Choose a teammate from the list." });
      this.field("team-person").focus();
      return;
    }
    if (this.data.members.includes(person.label)) {
      this.patch({
        invitationStatus: `${person.label} is already on the team.`,
      });
      return;
    }
    this.patch({
      members: [...this.data.members, person.label],
      invitationStatus: `${person.label} added to this demo team as ${this.value("team-role")}.`,
    });
  }
  sendMessage() {
    const text = this.value("chat-message").trim();
    if (!text) {
      this.patch({ chatStatus: "Write a message first." });
      this.field("chat-message").focus();
      return;
    }
    const id = this.data.messages.length;
    this.patch({
      messages: [
        ...this.data.messages,
        { id, who: "You", text },
        {
          id: id + 1,
          who: "Demo assistant",
          text: "Try a portrait composition, compare two accent colors, and ask your team for a first impression.",
        },
      ],
      chatStatus: "Message added. A sample response is shown below.",
    });
    this.field("chat-message").value = "";
    this.field("chat-message").focus();
  }
  saveAccess() {
    if (this.valid("access-email", "access-password"))
      this.patch({
        accessStatus: `Local form validated for ${this.value("access-email")}. No account was created.`,
      });
    else this.patch({ accessStatus: "Check the highlighted fields." });
  }
  async copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      this.patch({ shareStatus: "Showcase link copied." });
    } catch {
      this.patch({
        shareStatus:
          "Copy unavailable. Use the link above to copy the address.",
      });
    }
  }
  reset(id: CardId) {
    const initial = createShowcaseState();
    const keys: Partial<Record<CardId, (keyof ShowcaseState)[]>> = {
      actions: ["canvas"],
      activity: ["activityRange"],
      readiness: ["ready", "approved"],
      project: ["project", "projectStatus"],
      output: ["opacity", "scale"],
      brand: ["accent"],
      team: ["members", "invitationStatus"],
      chat: ["messages", "chatStatus"],
      feedback: ["feedback"],
      access: ["accessStatus"],
      notifications: ["notificationStatus"],
      share: ["shareStatus"],
      library: ["inserted"],
    };
    this.patch(
      Object.fromEntries((keys[id] ?? []).map((key) => [key, initial[key]])),
    );
    this.resets.set(id, (this.resets.get(id) ?? 0) + 1);
    this.touch();
  }

  render() {
    return html`<div class="showcase-page">
      <main id="showcase">
        <div class="showcase-heading">
          <div>
            <h1>Made of en-reve.</h1>
            <p>
              Creative work, in sixteen small spaces. Local demos; nothing is
              sent or saved after reload.
            </p>
          </div>
        </div>
        ${showcaseGrid(this)}
      </main>
    </div>`;
  }
}
