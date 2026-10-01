import * as u from "@showcase/ui";
import "./layout.css";
import "./progress.js";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const people = ["Ada Lovelace", "Rafael Silva", "Jun Park"];
const titles = [
  "Make something.",
  "Around the studio",
  "A little direction",
  "Small palette. Big possibility.",
  "Creative momentum",
  "Ready for a first impression",
  "One idea, many possibilities",
  "What’s your first impression?",
  "Set your next milestone",
  "Every little detail",
  "Your own corner of the studio",
  "Keep the useful signals",
  "Better, together.",
  "A thought to get you started",
  "Bring another screen",
  "A place for what’s next",
];
const ids = [
  "actions",
  "navigation",
  "brief",
  "brand",
  "activity",
  "readiness",
  "asset",
  "feedback",
  "project",
  "output",
  "access",
  "notifications",
  "team",
  "chat",
  "share",
  "library",
];
const week = [
    ["Mon", 12],
    ["Tue", 26],
    ["Wed", 19],
    ["Thu", 32],
    ["Fri", 23],
    ["Sat", 8],
  ],
  month = [
    ["Apr", 78],
    ["May", 104],
    ["Jun", 86],
    ["Jul", 124],
    ["Aug", 96],
    ["Sep", 112],
  ];
let canvas = "portrait",
  opacity = 82,
  scale = 100,
  members = ["Mira Chen", "Omar Haddad"];
const row = (s) => `<div class="row">${s}</div>`,
  button = u.button,
  input = u.input,
  select = u.select,
  check = u.check;
const status = (id) => `<p class="status" id="${id}-status" role="status"></p>`;
const art = () =>
  `<div class="art" data-layout="${canvas}" role="img" aria-label="${canvas} composition with overlapping shapes"><div class="artboard" style="opacity:${opacity / 100}"><i></i><b></b><strong>Make room<br>for a new idea.</strong></div></div>`;
const chart = (rows) =>
  `<figure><div class="bars" aria-hidden="true">${rows.map(([l, v]) => `<div><div class="bar" style="height:${(v / Math.max(...rows.map((x) => x[1]))) * 110}px"></div><small>${l}</small></div>`).join("")}</div><figcaption>Contributions to studio projects · sample data</figcaption></figure><details><summary>View activity data</summary><table><caption>Contributions per period</caption><thead><tr><th>Period</th><th>Contributions</th></tr></thead><tbody>${rows.map(([l, v]) => `<tr><th>${l}</th><td>${v}</td></tr>`).join("")}</tbody></table></details><div class="summary"><div>Total contributions<strong>${rows.reduce((s, x) => s + x[1], 0)}</strong></div><div>Next review<strong>Friday</strong></div></div>`;
const memberList = () =>
  members
    .map(
      (name, i) =>
        `<li>${u.avatar(name)}<div class="person-info"><strong>${esc(name)}</strong><small>${i === 0 ? "Designer · Owner" : "Collaborator"}</small></div>${u.badge(i === 0 ? "You" : "Member")}</li>`,
    )
    .join("");
const body = {
  actions: () =>
    `${row(button("Create →", "create") + button("Preview", "preview", true) + button("Reset canvas", "reset-canvas", true))}${input("study-name", "Study name", "Name your next idea")}${input("quick-note", "Quick note", "Leave a note for your future self…", "textarea")}${row(u.badge("In progress") + u.badge("Local draft") + u.toggle("sync", "Sync", true))}<div role="toolbar" aria-label="Canvas orientation">${row(button("Portrait", "portrait", true) + button("Landscape", "landscape", true))}</div>${row(
      u.menu("Actions", [
        ["Portrait canvas", "portrait"],
        ["Landscape canvas", "landscape"],
        ["Reset canvas", "reset-canvas"],
      ]) + button("All commands", "commands", true),
    )}<p class="status" id="canvas-status" role="status">Canvas: ${canvas}.</p>`,
  navigation: () =>
    `<nav aria-label="Current study path">${u.link("#showcase-navigation", "Studio")} / ${u.link("#showcase-project", "Projects")} / New study</nav><div class="pair">${[
      [
        "Planning",
        [
          ["Projects", "project"],
          ["Activity", "activity"],
          ["Reviews", "readiness"],
          ["Library", "library"],
        ],
      ],
      [
        "Workspace",
        [
          ["People", "team"],
          ["Brand kit", "brand"],
          ["Access", "access"],
          ["Notifications", "notifications"],
        ],
      ],
    ]
      .map(
        ([label, items]) =>
          `<nav aria-label="${label}" class="stack">${items.map(([label, id]) => u.link("#showcase-" + id, label)).join("")}</nav>`,
      )
      .join("")}</div>`,
  brief: () =>
    u.tabs([
      {
        id: "idea",
        label: "The idea",
        content: `<p>A quieter workspace for a brighter idea. Start with a strong shape, an honest headline, and room to breathe.</p>${check("editable", "Keep the headline editable", true)}`,
      },
      {
        id: "delivery",
        label: "Delivery",
        content: u.radio("Export quality", ["Review quality", "Final artwork"]),
      },
    ]) +
    u.disclosure(
      "What makes a useful review?",
      "Try one task, note where you hesitate, and share the result with your team.",
    ),
  brand: () =>
    `<div class="swatches">${["Brand", "Action", "Surface"].map((l, i) => `<div><button class="swatch" data-action="copy-color" aria-label="Copy ${l.toLowerCase()} color CSS reference" style="background:${i === 2 ? "var(--art-surface)" : "var(--art-accent)"}"></button><small>${l}</small></div>`).join("")}</div><p>These three swatches follow the page theme.</p><div class="color-preview" id="color-preview"><span>Studio / 04</span><strong>Color outside<br>the expected.</strong></div>${u.color("accent", "Study color", "#6d5ce7")}<small>Study color changes this artwork only.</small>${status("brand")}`,
  activity: () =>
    `<p>A few small steps, every day.</p>${u.segments("activity-range", "Activity period", ["This week", "Six months"])}<div id="activity-chart" class="stack">${chart(week)}</div>${u.link("https://en-reve-docs.reve-ai-0869.chatgpt.site/workflows/assets", "Explore the asset workflow ↗")}`,
  readiness: () =>
    `${row('<strong id="ready-count" style="font-size:32px">2 / 4</strong>' + u.badge("In review", "approval-badge"))}${u.progress("ready-progress", 2, 4)}${["The story is clear", "The layout responds", "Keyboard review complete", "Alternative text checked"].map((x, i) => check("ready-" + i, x, i < 2)).join("")}${button("Approve study", "approve", false, "disabled")}`,
  asset: () =>
    `${art()}<dl><dt>Study</dt><dd>Shape &amp; space</dd><dt>Format</dt><dd>Editable composition</dd><dt>Owner</dt><dd>Mira Chen</dd></dl>${row(button("Preview study", "preview") + u.popover("About this study", "This editable composition uses the active theme’s colors. Change its orientation in “Make something” and its opacity in “Every little detail.”"))}`,
  feedback: () =>
    `${select("rating", "Study rating", ["1", "2", "3", "4", "5"], "4")}${input("feedback-note", "Review note", "What’s working? What could be clearer?", "textarea")}${button("Add review", "review", true)}${status("feedback")}`,
  project: () =>
    `<p>Give an idea a name, a team, and a little momentum.</p>${input("project-name", "Project name", "A fresh perspective")}<div class="pair">${select("project-type", "Project type", ["Campaign", "Identity", "Product"])}${input("project-date", "Review date", "", "date", "2026-09-18")}</div>${button("Create project", "project")}${status("project")}`,
  output: () =>
    `<p>Shape the output to fit the idea.</p>${select("export-format", "Export format", ["PNG · Raster image", "SVG · Vector image", "PDF · Document"])}${u.slider("opacity", "Artwork opacity", opacity)}${u.number("scale", "Export scale", scale)}${check("transparent", "Include transparent background", true)}${input("export-notes", "Export notes", "Anything the next person should know?", "textarea")}${button("More export options", "export", true)}<div class="summary"><div>Opacity<strong id="opacity-value">${opacity}%</strong></div><div>Scale<strong id="scale-value">${scale}%</strong></div></div>`,
  access: () =>
    `${input("email", "Work email", "you@studio.com", "email")}${input("password", "Password", "", "password")}<small>At least 8 characters. Use a sample password here.</small>${u.toggle("remember", "Remember this device")}${button("Check details", "access", true)}${status("access")}`,
  notifications: () =>
    `${u.toggle("notify-mentions", "Mentions and replies", true)}${u.toggle("notify-reviews", "New review requests", true)}${u.toggle("notify-digest", "Weekly studio digest")}${button("Save preferences", "notifications", true)}${status("notifications")}`,
  team: () =>
    `<p>A small team with room for another perspective.</p><ul class="people" id="team-list">${memberList()}</ul>${u.combo("person", "Add a teammate", people)}${select("role", "Access level", ["Editor", "Reviewer", "Viewer"])}${button("Add to demo team", "invite")}${status("team")}`,
  chat: () =>
    `<div id="chat-welcome" class="welcome"><span style="font-size:32px">✦</span><h3>What are we making today?</h3><p>A rough idea is a good place to start.</p></div><ol class="messages" id="messages" aria-live="polite"></ol>${input("message", "Message", "I’m exploring a new direction…", "textarea")}<small>Local sample response · no AI connection</small>${button("Send", "send")}${status("chat")}`,
  share: () =>
    `<div class="welcome" style="min-height:100px">↗</div><p>Open this showcase on another screen to compare the layout.</p>${u.link(location.pathname, "Open showcase")}${button("Copy showcase link", "share", true)}<small>A localhost address opens only on the computer running this preview.</small>${status("share")}`,
  library: () =>
    `<div id="library-content" class="welcome"><h3>No assets yet</h3><p>Every collection starts with one good find.</p>${button("Add a sample asset", "insert", true)}</div>${u.popover("How this collection works", `<p>Add an authored sample asset to this page. Use Reset to empty the collection again.</p>${check("keep-source", "Keep the source editable", true)}`)}`,
};
const card = (id) =>
  `<section class="showcase-card" id="showcase-${id}" aria-labelledby="heading-${id}">${u.card(`<div class="card-heading"><h2 id="heading-${id}">${titles[ids.indexOf(id)]}</h2>${["navigation", "asset"].includes(id) ? "" : button("Reset", "reset:" + id, true, `aria-label="Reset ${titles[ids.indexOf(id)]}"`)}</div><div class="card-body">${body[id]()}</div>`)}</section>`;
const overlays = () =>
  u.dialog(
    "create",
    "Start with a direction",
    `<p>Choose a canvas for this local study. You can change it at any time.</p>${row(button("Portrait", "choose-portrait") + button("Landscape", "choose-landscape"))}`,
  ) +
  u.dialog(
    "preview",
    "Shape & space",
    `<div id="preview-art">${art()}</div><p id="preview-description"></p>${button("Back to the studio", "close:preview", true)}`,
  ) +
  u.dialog(
    "commands",
    "Studio commands",
    `${input("command-search", "Find a layout command", "Search commands…")}<div id="command-list" class="stack">${button("Portrait canvas", "choose-portrait") + button("Landscape canvas", "choose-landscape") + button("Reset canvas", "choose-portrait")}</div>`,
  ) +
  u.dialog(
    "approve",
    "Ready to approve?",
    `<p>This marks the sample study as approved in this page only.</p>${row(button("Keep reviewing", "close:approve", true) + button("Confirm approval", "confirm"))}`,
  ) +
  u.drawer(
    "export",
    "Export options",
    `${check("layer-names", "Keep layer names", true)}${check("review-notes", "Include review notes")}${input("handoff", "Handoff message", "", "textarea")}${button("Done", "close:export")}`,
  );
document.getElementById("root").innerHTML = u.provider(
  `<main id="showcase"><div class="showcase-heading"><h1>Made of ${u.libraryName}.</h1><p>Creative work, in sixteen small spaces. Local demos; nothing is sent or saved after reload.</p></div><div class="showcase-grid">${[
    0, 4, 8, 12,
  ]
    .map(
      (i) =>
        `<div class="showcase-column">${ids
          .slice(i, i + 4)
          .map(card)
          .join("")}</div>`,
    )
    .join("")}</div>${overlays()}</main>`,
);
const $ = (id) => document.getElementById(id),
  value = (id) => u.value($(id)),
  message = (id, s) => ($(id + "-status").textContent = s);
const paint = () => {
  document.querySelectorAll(".art").forEach((e) => {
    e.dataset.layout = canvas;
    e.setAttribute(
      "aria-label",
      canvas + " composition with overlapping shapes",
    );
  });
  document
    .querySelectorAll(".artboard")
    .forEach((e) => (e.style.opacity = opacity / 100));
  $("canvas-status").textContent = `Canvas: ${canvas}.`;
  $("opacity-value").textContent = opacity + "%";
  $("scale-value").textContent = scale + "%";
  $("preview-description").textContent =
    `Canvas: ${canvas}. Opacity: ${opacity}%.`;
};
function update(event) {
  const el = event
    .composedPath()
    .find(
      (x) =>
        x instanceof HTMLElement &&
        x.id &&
        (x.id.startsWith("ready-") ||
          [
            "activity-range",
            "accent",
            "opacity",
            "scale",
            "command-search",
          ].includes(x.id)),
    );
  if (!el) return;
  const id = el.id;
  if (id.startsWith("ready-")) {
    const n = [0, 1, 2, 3].filter((i) => u.checked($("ready-" + i))).length;
    $("ready-count").textContent = n + " / 4";
    u.setProgress($("ready-progress"), n, 4);
    $("approval-badge").textContent = "In review";
    document.querySelector("[data-action=approve]").disabled = n !== 4;
  }
  if (id === "activity-range")
    $("activity-chart").innerHTML = chart(
      value(id) === "Six months" ? month : week,
    );
  if (id === "accent")
    $("color-preview").style.setProperty("--study-accent", value(id));
  if (id === "opacity") {
    opacity = Number(value(id));
    paint();
  }
  if (id === "scale") {
    scale = Number(value(id));
    paint();
  }
  if (id === "command-search")
    document
      .querySelectorAll("#command-list [data-action]")
      .forEach(
        (e) =>
          (e.hidden = !e.textContent
            .toLowerCase()
            .includes(value(id).toLowerCase())),
      );
}
document.addEventListener("input", update);
document.addEventListener("change", update);
document.addEventListener("click", async (event) => {
  const el = event
    .composedPath()
    .find((x) => x instanceof HTMLElement && x.dataset.action);
  if (!el || el.disabled) return;
  const action = el.dataset.action;
  if (action.startsWith("reset:")) {
    const id = action.slice(6);
    if (id === "actions") canvas = "portrait";
    if (id === "output") {
      opacity = 82;
      scale = 100;
    }
    if (id === "team") members = ["Mira Chen", "Omar Haddad"];
    $("showcase-" + id).querySelector(".card-body").innerHTML = body[id]();
    paint();
    return;
  }
  if (action.startsWith("close:")) {
    u.close($(action.slice(6) + "-dialog"));
    return;
  }
  if (["create", "preview", "commands", "approve", "export"].includes(action)) {
    paint();
    u.open($(action + "-dialog"));
    return;
  }
  if (
    [
      "portrait",
      "landscape",
      "reset-canvas",
      "choose-portrait",
      "choose-landscape",
    ].includes(action)
  ) {
    canvas = action.includes("landscape") ? "landscape" : "portrait";
    paint();
    if (action.startsWith("choose-")) {
      u.close($("create-dialog"));
      u.close($("commands-dialog"));
    }
    return;
  }
  if (action === "confirm") {
    $("approval-badge").textContent = "Approved";
    document.querySelector("[data-action=approve]").disabled = true;
    u.close($("approve-dialog"));
  }
  if (action === "review")
    message(
      "feedback",
      value("feedback-note").trim()
        ? value("rating") + " / 5 — " + value("feedback-note")
        : "Add a review note.",
    );
  if (action === "project")
    message(
      "project",
      value("project-name").trim() && value("project-date")
        ? `${value("project-name")} created locally. Review: ${value("project-date")}.`
        : "Add a project name and a valid review date.",
    );
  if (action === "access")
    message(
      "access",
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email")) &&
        value("password").length >= 8
        ? `Local form validated for ${value("email")}. No account was created.`
        : "Enter a valid email and at least 8 password characters.",
    );
  if (action === "notifications")
    message(
      "notifications",
      "Saved locally: " +
        ["mentions", "reviews", "digest"]
          .filter((x) => u.checked($("notify-" + x)))
          .join(", ") +
        ".",
    );
  if (action === "invite") {
    const name = value("person");
    if (!people.includes(name))
      message("team", "Choose a teammate from the list.");
    else if (members.includes(name))
      message("team", name + " is already on the team.");
    else {
      members.push(name);
      $("team-list").innerHTML = memberList();
      message(
        "team",
        `${name} added to this demo team as ${value("role").toLowerCase()}.`,
      );
    }
  }
  if (action === "send") {
    const text = value("message").trim();
    if (!text) {
      message("chat", "Write a message first.");
      return;
    }
    $("chat-welcome").hidden = true;
    $("messages").insertAdjacentHTML(
      "beforeend",
      `<li><strong>You</strong><p>${esc(text)}</p></li><li><strong>Demo assistant</strong><p>Try a portrait composition, compare two accent colors, and ask your team for a first impression.</p></li>`,
    );
    u.setValue($("message"), "");
    message("chat", "Message added. A sample response is shown below.");
  }
  if (action === "share" || action === "copy-color") {
    try {
      await navigator.clipboard.writeText(
        action === "share" ? location.href : "var(--art-accent)",
      );
      message(action === "share" ? "share" : "brand", "Copied.");
    } catch {
      message(action === "share" ? "share" : "brand", "Copy unavailable.");
    }
  }
  if (action === "insert")
    $("library-content").innerHTML =
      "<h3>First spark</h3><p>Your sample asset is in the collection.</p>" +
      u.badge("1 asset");
});

u.connect?.();
