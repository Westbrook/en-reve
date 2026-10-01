import React, { memo, useState } from "react";
import * as U from "@showcase/ui";
import "./layout.css";
import "./progress.js";
const people = ["Ada Lovelace", "Rafael Silva", "Jun Park"];
const checklist = [
  "The story is clear",
  "The layout responds",
  "Keyboard review complete",
  "Alternative text checked",
];
const week = [
  ["Mon", 12],
  ["Tue", 26],
  ["Wed", 19],
  ["Thu", 32],
  ["Fri", 23],
  ["Sat", 8],
];
const month = [
  ["Apr", 78],
  ["May", 104],
  ["Jun", 86],
  ["Jul", 124],
  ["Aug", 96],
  ["Sep", 112],
];
const Row = ({ children }) => <div className="row">{children}</div>;
const Status = ({ children }) => (
  <p className="status" role="status">
    {children}
  </p>
);
function Card({ id, title, children, reset }) {
  return (
    <section
      className="showcase-card"
      id={"showcase-" + id}
      aria-labelledby={"heading-" + id}
    >
      <U.Card>
        <div className="card-heading">
          <h2 id={"heading-" + id}>{title}</h2>
          {reset && (
            <U.Button secondary onClick={reset} aria-label={"Reset " + title}>
              Reset
            </U.Button>
          )}
        </div>
        <div className="card-body">{children}</div>
      </U.Card>
    </section>
  );
}
function ResetCard({ id, title, children, onReset }) {
  const [revision, setRevision] = useState(0);
  return (
    <Card
      id={id}
      title={title}
      reset={() => {
        setRevision((n) => n + 1);
        onReset?.();
      }}
    >
      <React.Fragment key={revision}>{children}</React.Fragment>
    </Card>
  );
}
function Art({ canvas, opacity }) {
  return (
    <div
      className="art"
      data-layout={canvas}
      role="img"
      aria-label={canvas + " composition with overlapping shapes"}
    >
      <div className="artboard" style={{ opacity: opacity / 100 }}>
        <i />
        <b />
        <strong>
          Make room
          <br />
          for a new idea.
        </strong>
      </div>
    </div>
  );
}
function Actions({ canvas, setCanvas, onPreview }) {
  const [open, setOpen] = useState(false);
  const [commands, setCommands] = useState(false);
  const [query, setQuery] = useState("");
  const items = [
    ["Portrait canvas", "portrait"],
    ["Landscape canvas", "landscape"],
    ["Reset canvas", "portrait"],
  ].map(([label, value]) => ({ label, action: () => setCanvas(value) }));
  return (
    <ResetCard
      id="actions"
      title="Make something."
      onReset={() => setCanvas("portrait")}
    >
      <Row>
        <U.Button onClick={() => setOpen(true)}>Create →</U.Button>
        <U.Button secondary onClick={onPreview}>
          Preview
        </U.Button>
        <U.Button
          secondary
          onClick={() => setCanvas("portrait")}
          aria-label="Reset canvas"
        >
          ✦
        </U.Button>
      </Row>
      <U.Input label="Study name" placeholder="Name your next idea" />
      <U.Input
        multiline
        label="Quick note"
        placeholder="Leave a note for your future self…"
        rows={2}
      />
      <Row>
        <U.Badge>In progress</U.Badge>
        <U.Badge>Local draft</U.Badge>
        <U.Switch label="Sync" defaultChecked />
      </Row>
      <div role="toolbar" aria-label="Canvas orientation">
        <Row>
          <U.Button secondary onClick={() => setCanvas("portrait")}>
            Portrait
          </U.Button>
          <U.Button secondary onClick={() => setCanvas("landscape")}>
            Landscape
          </U.Button>
        </Row>
      </div>
      <Row>
        <U.Menu label="Actions" items={items} />
        <U.Button secondary onClick={() => setCommands(true)}>
          All commands
        </U.Button>
      </Row>
      <Status>Canvas: {canvas}.</Status>
      <U.Dialog
        open={open}
        onOpenChange={setOpen}
        title="Start with a direction"
      >
        <p>
          Choose a canvas for this local study. You can change it at any time.
        </p>
        <Row>
          {["portrait", "landscape"].map((x) => (
            <U.Button
              key={x}
              onClick={() => {
                setCanvas(x);
                setOpen(false);
              }}
            >
              {x[0].toUpperCase() + x.slice(1)}
            </U.Button>
          ))}
        </Row>
      </U.Dialog>
      <U.Dialog
        open={commands}
        onOpenChange={setCommands}
        title="Studio commands"
      >
        <U.Input
          label="Find a layout command"
          value={query}
          onChange={setQuery}
        />
        <div className="stack">
          {items
            .filter((x) => x.label.toLowerCase().includes(query.toLowerCase()))
            .map((x) => (
              <U.Button
                key={x.label}
                secondary
                onClick={() => {
                  x.action();
                  setCommands(false);
                }}
              >
                {x.label}
              </U.Button>
            ))}
        </div>
      </U.Dialog>
    </ResetCard>
  );
}
const Navigation = memo(function Navigation() {
  return (
    <Card id="navigation" title="Around the studio">
      <U.Breadcrumbs
        items={[
          ["Studio", "#showcase-navigation"],
          ["Projects", "#showcase-project"],
          ["New study", null],
        ]}
      />
      <div className="pair">
        {[
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
        ].map(([name, items]) => (
          <nav className="stack" aria-label={name} key={name}>
            {items.map(([label, id]) => (
              <U.Link key={id} href={"#showcase-" + id}>
                {label}
              </U.Link>
            ))}
          </nav>
        ))}
      </div>
    </Card>
  );
});
const Brief = memo(function Brief() {
  return (
    <ResetCard id="brief" title="A little direction">
      <U.Tabs
        label="Creative brief"
        items={[
          {
            id: "idea",
            label: "The idea",
            content: (
              <div className="stack">
                <p>
                  A quieter workspace for a brighter idea. Start with a strong
                  shape, an honest headline, and room to breathe.
                </p>
                <U.Check label="Keep the headline editable" defaultChecked />
              </div>
            ),
          },
          {
            id: "delivery",
            label: "Delivery",
            content: (
              <U.Radio
                label="Export quality"
                options={["Review quality", "Final artwork"]}
                defaultValue="Review quality"
              />
            ),
          },
        ]}
      />
      <U.Disclosure label="What makes a useful review?">
        <p>
          Try one task, note where you hesitate, and share the result with your
          team.
        </p>
      </U.Disclosure>
    </ResetCard>
  );
});
function BrandBody() {
  const [accent, setAccent] = useState("#6d5ce7");
  const [status, setStatus] = useState("");
  return (
    <>
      <div className="swatches">
        {["Brand", "Action", "Surface"].map((label, i) => (
          <div key={label}>
            <button
              className="swatch"
              style={{
                background: [
                  "var(--art-accent,#6d5ce7)",
                  "var(--art-accent,#6d5ce7)",
                  "var(--art-surface,#eee)",
                ][i],
              }}
              aria-label={
                "Copy " + label.toLowerCase() + " color CSS reference"
              }
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    i === 2 ? "--art-surface" : "--art-accent",
                  );
                  setStatus(label + " reference copied.");
                } catch {
                  setStatus("Copy unavailable.");
                }
              }}
            />
            <small>{label}</small>
          </div>
        ))}
      </div>
      <Status>{status}</Status>
      <p>These three swatches follow the page theme.</p>
      <div className="color-preview" style={{ "--study-accent": accent }}>
        <span>Studio / 04</span>
        <strong>
          Color outside
          <br />
          the expected.
        </strong>
      </div>
      <U.Color label="Study color" value={accent} onChange={setAccent} />
      <small>Study color changes this artwork only.</small>
    </>
  );
}
const Brand = memo(() => (
  <ResetCard id="brand" title="Small palette. Big possibility.">
    <BrandBody />
  </ResetCard>
));
function ActivityBody() {
  const [range, setRange] = useState("This week");
  const rows = range === "This week" ? week : month;
  return (
    <>
      <p>A few small steps, every day.</p>
      <U.Segments
        label="Activity period"
        options={["This week", "Six months"]}
        value={range}
        onChange={setRange}
      />
      <figure>
        <div className="bars" aria-hidden="true">
          {rows.map(([label, value]) => (
            <div key={label}>
              <div
                className="bar"
                style={{
                  height:
                    (value / Math.max(...rows.map((x) => x[1]))) * 110 + "px",
                }}
              />
              <small>{label}</small>
            </div>
          ))}
        </div>
        <figcaption>Contributions to studio projects · sample data</figcaption>
      </figure>
      <details>
        <summary>View activity data</summary>
        <table>
          <caption>Contributions per period</caption>
          <thead>
            <tr>
              <th>Period</th>
              <th>Contributions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <div className="summary">
        <div>
          Total contributions
          <strong>{rows.reduce((sum, x) => sum + x[1], 0)}</strong>
        </div>
        <div>
          Next review<strong>Friday</strong>
        </div>
      </div>
      <U.Link href="https://en-reve-docs.reve-ai-0869.chatgpt.site/workflows/assets">
        Explore the asset workflow ↗
      </U.Link>
    </>
  );
}
const Activity = memo(() => (
  <ResetCard id="activity" title="Creative momentum">
    <ActivityBody />
  </ResetCard>
));
function ReadinessBody() {
  const [ready, setReady] = useState([true, true, false, false]);
  const [approved, setApproved] = useState(false);
  const [open, setOpen] = useState(false);
  const n = ready.filter(Boolean).length;
  return (
    <>
      <Row>
        <strong style={{ fontSize: 32 }}>{n} / 4</strong>
        <U.Badge>{approved ? "Approved" : "In review"}</U.Badge>
      </Row>
      <U.Progress label="Review checklist" value={n} max={4} />
      {checklist.map((label, i) => (
        <U.Check
          key={label}
          label={label}
          checked={ready[i]}
          onChange={(v) => {
            setReady(ready.map((x, j) => (i === j ? v : x)));
            setApproved(false);
          }}
        />
      ))}
      <U.Button disabled={n !== 4 || approved} onClick={() => setOpen(true)}>
        Approve study
      </U.Button>
      <U.Dialog open={open} onOpenChange={setOpen} title="Ready to approve?">
        <p>This marks the sample study as approved in this page only.</p>
        <Row>
          <U.Button secondary onClick={() => setOpen(false)}>
            Keep reviewing
          </U.Button>
          <U.Button
            onClick={() => {
              setApproved(true);
              setOpen(false);
            }}
          >
            Confirm approval
          </U.Button>
        </Row>
      </U.Dialog>
    </>
  );
}
const Readiness = memo(() => (
  <ResetCard id="readiness" title="Ready for a first impression">
    <ReadinessBody />
  </ResetCard>
));
function Asset({ canvas, opacity, onPreview }) {
  return (
    <Card id="asset" title="One idea, many possibilities">
      <Art canvas={canvas} opacity={opacity} />
      <dl>
        <dt>Study</dt>
        <dd>Shape &amp; space</dd>
        <dt>Format</dt>
        <dd>Editable composition</dd>
        <dt>Owner</dt>
        <dd>Mira Chen</dd>
      </dl>
      <Row>
        <U.Button onClick={onPreview}>Preview study</U.Button>
        <U.Popover label="About this study">
          <p>
            This editable composition uses the active theme’s colors. Change its
            orientation in “Make something” and its opacity in “Every little
            detail.”
          </p>
        </U.Popover>
      </Row>
    </Card>
  );
}
function FeedbackBody() {
  const [rating, setRating] = useState(4),
    [note, setNote] = useState(""),
    [status, setStatus] = useState("");
  return (
    <>
      <U.Rating label="Study rating" value={rating} onChange={setRating} />
      <U.Input
        multiline
        label="Review note"
        value={note}
        onChange={setNote}
        placeholder="What’s working? What could be clearer?"
        rows={3}
        required
      />
      <U.Button
        secondary
        onClick={() =>
          setStatus(
            note.trim() ? `${rating} / 5 — ${note}` : "Add a review note.",
          )
        }
      >
        Add review
      </U.Button>
      <Status>{status}</Status>
    </>
  );
}
const Feedback = memo(() => (
  <ResetCard id="feedback" title="What’s your first impression?">
    <FeedbackBody />
  </ResetCard>
));
function ProjectBody() {
  const [name, setName] = useState(""),
    [date, setDate] = useState("2026-09-18"),
    [status, setStatus] = useState("");
  return (
    <>
      <p>Give an idea a name, a team, and a little momentum.</p>
      <U.Input
        label="Project name"
        value={name}
        onChange={setName}
        placeholder="A fresh perspective"
        required
      />
      <div className="pair">
        <U.Select
          label="Project type"
          options={["Campaign", "Identity", "Product"]}
          defaultValue="Campaign"
        />
        <U.Date label="Review date" value={date} onChange={setDate} />
      </div>
      <U.Button
        onClick={() =>
          setStatus(
            name.trim() && date
              ? `${name} created locally. Review: ${date}.`
              : "Add a project name and a valid review date.",
          )
        }
      >
        Create project
      </U.Button>
      <Status>{status}</Status>
    </>
  );
}
const Project = memo(() => (
  <ResetCard id="project" title="Set your next milestone">
    <ProjectBody />
  </ResetCard>
));
function Output({ opacity, setOpacity, scale, setScale }) {
  const [open, setOpen] = useState(false);
  return (
    <ResetCard
      id="output"
      title="Every little detail"
      onReset={() => {
        setOpacity(82);
        setScale(100);
      }}
    >
      <p>Shape the output to fit the idea.</p>
      <U.Select
        label="Export format"
        options={["PNG · Raster image", "SVG · Vector image", "PDF · Document"]}
        defaultValue="PNG · Raster image"
      />
      <U.Slider label="Artwork opacity" value={opacity} onChange={setOpacity} />
      <U.Number
        label="Export scale"
        value={scale}
        min={25}
        max={400}
        step={25}
        onChange={setScale}
      />
      <U.Check label="Include transparent background" defaultChecked />
      <U.Input
        multiline
        label="Export notes"
        placeholder="Anything the next person should know?"
        rows={3}
      />
      <U.Button secondary onClick={() => setOpen(true)}>
        More export options
      </U.Button>
      <U.Drawer open={open} onOpenChange={setOpen} title="Export options">
        <U.Check defaultChecked label="Keep layer names" />
        <U.Check label="Include review notes" />
        <U.Input multiline label="Handoff message" rows={3} />
        <U.Button onClick={() => setOpen(false)}>Done</U.Button>
      </U.Drawer>
      <div className="summary">
        <div>
          Opacity<strong>{opacity}%</strong>
        </div>
        <div>
          Scale<strong>{scale}%</strong>
        </div>
      </div>
    </ResetCard>
  );
}
function AccessBody() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [status, setStatus] = useState("");
  return (
    <>
      <U.Input
        label="Work email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@studio.com"
        required
      />
      <U.Input
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        required
      />
      <small>At least 8 characters. Use a sample password here.</small>
      <U.Switch label="Remember this device" />
      <U.Button
        secondary
        onClick={() =>
          setStatus(
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8
              ? `Local form validated for ${email}. No account was created.`
              : "Check the highlighted fields. Enter a valid email and at least 8 password characters.",
          )
        }
      >
        Check details
      </U.Button>
      <Status>{status}</Status>
    </>
  );
}
const Access = memo(() => (
  <ResetCard id="access" title="Your own corner of the studio">
    <AccessBody />
  </ResetCard>
));
function NotificationsBody() {
  const [values, setValues] = useState([true, true, false]),
    [status, setStatus] = useState("");
  return (
    <>
      {[
        "Mentions and replies",
        "New review requests",
        "Weekly studio digest",
      ].map((label, i) => (
        <U.Switch
          key={label}
          label={label}
          checked={values[i]}
          onChange={(v) => setValues(values.map((x, j) => (j === i ? v : x)))}
        />
      ))}
      <U.Button
        secondary
        onClick={() =>
          setStatus(
            "Saved locally: " +
              ["mentions", "reviews", "digest"]
                .filter((_, i) => values[i])
                .join(", ") +
              ".",
          )
        }
      >
        Save preferences
      </U.Button>
      <Status>{status}</Status>
    </>
  );
}
const Notifications = memo(() => (
  <ResetCard id="notifications" title="Keep the useful signals">
    <NotificationsBody />
  </ResetCard>
));
function TeamBody() {
  const [members, setMembers] = useState(["Mira Chen", "Omar Haddad"]),
    [person, setPerson] = useState(""),
    [role, setRole] = useState("Editor"),
    [status, setStatus] = useState("");
  return (
    <>
      <p>A small team with room for another perspective.</p>
      <ul className="people">
        {members.map((name, i) => (
          <li key={name}>
            <U.Avatar name={name} />
            <div className="person-info">
              <strong>{name}</strong>
              <small>{i === 0 ? "Designer · Owner" : "Collaborator"}</small>
            </div>
            <U.Badge>{i === 0 ? "You" : "Member"}</U.Badge>
          </li>
        ))}
      </ul>
      <U.Combo
        label="Add a teammate"
        options={people}
        value={person}
        onChange={setPerson}
      />
      <U.Select
        label="Access level"
        options={["Editor", "Reviewer", "Viewer"]}
        value={role}
        onChange={setRole}
      />
      <U.Button
        onClick={() => {
          if (!people.includes(person))
            setStatus("Choose a teammate from the list.");
          else if (members.includes(person))
            setStatus(person + " is already on the team.");
          else {
            setMembers([...members, person]);
            setStatus(
              `${person} added to this demo team as ${role.toLowerCase()}.`,
            );
          }
        }}
      >
        Add to demo team
      </U.Button>
      <Status>{status}</Status>
    </>
  );
}
const Team = memo(() => (
  <ResetCard id="team" title="Better, together.">
    <TeamBody />
  </ResetCard>
));
function ChatBody() {
  const [text, setText] = useState(""),
    [messages, setMessages] = useState([]),
    [status, setStatus] = useState("");
  return (
    <>
      {messages.length ? (
        <ol className="messages" aria-live="polite">
          {messages.map((m, i) => (
            <li key={i}>
              <strong>{m[0]}</strong>
              <p>{m[1]}</p>
            </li>
          ))}
        </ol>
      ) : (
        <div className="welcome">
          <span style={{ fontSize: 32 }}>✦</span>
          <h3>What are we making today?</h3>
          <p>A rough idea is a good place to start.</p>
        </div>
      )}
      <U.Input
        multiline
        label="Message"
        placeholder="I’m exploring a new direction…"
        value={text}
        onChange={setText}
        rows={3}
      />
      <U.Button
        onClick={() => {
          if (!text.trim()) {
            setStatus("Write a message first.");
            return;
          }
          setMessages([
            ...messages,
            ["You", text],
            [
              "Demo assistant",
              "Try a portrait composition, compare two accent colors, and ask your team for a first impression.",
            ],
          ]);
          setText("");
          setStatus("Message added. A sample response is shown below.");
        }}
      >
        Send
      </U.Button>
      <small>Local sample response · no AI connection</small>
      <Status>{status}</Status>
    </>
  );
}
const Chat = memo(() => (
  <ResetCard id="chat" title="A thought to get you started">
    <ChatBody />
  </ResetCard>
));
function ShareBody() {
  const [status, setStatus] = useState("");
  return (
    <>
      <div className="welcome" style={{ minHeight: 100 }}>
        ↗
      </div>
      <p>Open this showcase on another screen to compare the layout.</p>
      <U.Link href={location.pathname}>Open showcase</U.Link>
      <U.Button
        secondary
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.href);
            setStatus("Showcase link copied.");
          } catch {
            setStatus(
              "Copy unavailable. Use the link above to copy the address.",
            );
          }
        }}
      >
        Copy showcase link
      </U.Button>
      <small>
        A localhost address opens only on the computer running this preview.
      </small>
      <Status>{status}</Status>
    </>
  );
}
const Share = memo(() => (
  <ResetCard id="share" title="Bring another screen">
    <ShareBody />
  </ResetCard>
));
function LibraryBody() {
  const [inserted, setInserted] = useState(false);
  return (
    <>
      {inserted ? (
        <>
          <h3>First spark</h3>
          <p>Your sample asset is in the collection.</p>
          <U.Badge>1 asset</U.Badge>
        </>
      ) : (
        <div className="welcome">
          <h3>No assets yet</h3>
          <p>Every collection starts with one good find.</p>
          <U.Button secondary onClick={() => setInserted(true)}>
            Add a sample asset
          </U.Button>
        </div>
      )}
      <U.Popover label="How this collection works">
        <p>
          Add an authored sample asset to this page. Use Reset to empty the
          collection again.
        </p>
        <U.Check defaultChecked label="Keep the source editable" />
      </U.Popover>
    </>
  );
}
const Library = memo(() => (
  <ResetCard id="library" title="A place for what’s next">
    <LibraryBody />
  </ResetCard>
));
export default function Showcase() {
  const [canvas, setCanvas] = useState("portrait"),
    [opacity, setOpacity] = useState(82),
    [scale, setScale] = useState(100),
    [preview, setPreview] = useState(false);
  return (
    <U.Provider>
      <main id="showcase">
        <div className="showcase-heading">
          <h1>Made of {U.libraryName}.</h1>
          <p>
            Creative work, in sixteen small spaces. Local demos; nothing is sent
            or saved after reload.
          </p>
        </div>
        <div className="showcase-grid">
          <div className="showcase-column">
            <Actions
              canvas={canvas}
              setCanvas={setCanvas}
              onPreview={() => setPreview(true)}
            />
            <Navigation />
            <Brief />
            <Brand />
          </div>
          <div className="showcase-column">
            <Activity />
            <Readiness />
            <Asset
              canvas={canvas}
              opacity={opacity}
              onPreview={() => setPreview(true)}
            />
            <Feedback />
          </div>
          <div className="showcase-column">
            <Project />
            <Output
              opacity={opacity}
              setOpacity={setOpacity}
              scale={scale}
              setScale={setScale}
            />
            <Access />
            <Notifications />
          </div>
          <div className="showcase-column">
            <Team />
            <Chat />
            <Share />
            <Library />
          </div>
        </div>
        <U.Dialog
          open={preview}
          onOpenChange={setPreview}
          title="Shape & space"
        >
          <Art canvas={canvas} opacity={opacity} />
          <p>
            Canvas: {canvas}. Opacity: {opacity}%.
          </p>
          <U.Button onClick={() => setPreview(false)}>
            Back to the studio
          </U.Button>
        </U.Dialog>
      </main>
    </U.Provider>
  );
}
