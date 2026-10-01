import React, { useId, useState } from "react";
import * as R from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
export const libraryName = "Radix Themes";
export const Provider = ({ children }) => (
  <R.Theme appearance="light">
    <div
      style={{
        "--art-accent": "var(--accent-9)",
        "--art-surface": "var(--gray-3)",
      }}
    >
      {children}
    </div>
  </R.Theme>
);
export const Card = ({ children }) => <R.Card size="3">{children}</R.Card>;
export const Button = ({ secondary, ...p }) => (
  <R.Button variant={secondary ? "soft" : "solid"} {...p} />
);
export function Input({ label, multiline, onChange, ...p }) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <R.Text size="2">{label}</R.Text>
      {multiline ? (
        <R.TextArea
          id={id}
          {...p}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <R.TextField.Root
          id={id}
          {...p}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
    </label>
  );
}
export const Check = ({ label, onChange, ...p }) => (
  <R.Text as="label" size="2">
    <R.Flex gap="2" align="center">
      <R.Checkbox {...p} onCheckedChange={onChange} />
      {label}
    </R.Flex>
  </R.Text>
);
export const Switch = ({ label, onChange, ...p }) => (
  <R.Text as="label" size="2">
    <R.Flex gap="2" align="center">
      <R.Switch {...p} onCheckedChange={onChange} />
      {label}
    </R.Flex>
  </R.Text>
);
export const Badge = R.Badge;
export const Avatar = ({ name }) => (
  <R.Avatar
    fallback={name
      .split(" ")
      .map((x) => x[0])
      .join("")}
    aria-label={name}
  />
);
export function Select({ label, options, onChange, ...p }) {
  return (
    <div className="field">
      <R.Text size="2">{label}</R.Text>
      <R.Select.Root {...p} onValueChange={onChange}>
        <R.Select.Trigger aria-label={label} />
        <R.Select.Content>
          {options.map((x) => (
            <R.Select.Item key={x} value={x}>
              {x}
            </R.Select.Item>
          ))}
        </R.Select.Content>
      </R.Select.Root>
    </div>
  );
}
export const Tabs = ({ label, items }) => (
  <R.Tabs.Root defaultValue={items[0].id}>
    <R.Tabs.List aria-label={label}>
      {items.map((x) => (
        <R.Tabs.Trigger key={x.id} value={x.id}>
          {x.label}
        </R.Tabs.Trigger>
      ))}
    </R.Tabs.List>
    {items.map((x) => (
      <R.Tabs.Content key={x.id} value={x.id} style={{ paddingTop: 16 }}>
        {x.content}
      </R.Tabs.Content>
    ))}
  </R.Tabs.Root>
);
export const Progress = ({ value, max, label }) => (
  <R.Progress value={(value / max) * 100} aria-label={label} />
);
export const Slider = ({ value, onChange, label }) => (
  <div className="field">
    <R.Text size="2">{label}</R.Text>
    <R.Slider
      value={[value]}
      onValueChange={(v) => onChange(v[0])}
      ref={(node) =>
        node?.querySelector("[role=slider]")?.setAttribute("aria-label", label)
      }
    />
  </div>
);
export const Segments = ({ value, onChange, options, label }) => (
  <R.SegmentedControl.Root
    value={value}
    onValueChange={onChange}
    aria-label={label}
  >
    {options.map((x) => (
      <R.SegmentedControl.Item key={x} value={x}>
        {x}
      </R.SegmentedControl.Item>
    ))}
  </R.SegmentedControl.Root>
);
export const Radio = ({ label, options, ...p }) => (
  <R.RadioGroup.Root {...p} aria-label={label}>
    {options.map((x) => (
      <R.RadioGroup.Item key={x} value={x}>
        {x}
      </R.RadioGroup.Item>
    ))}
  </R.RadioGroup.Root>
);
export const Dialog = ({ open, onOpenChange, title, children }) => (
  <R.Dialog.Root open={open} onOpenChange={onOpenChange}>
    <R.Dialog.Content maxWidth="520px">
      <R.Dialog.Title>{title}</R.Dialog.Title>
      <div className="stack">
        {children}
        <R.Dialog.Close>
          <R.Button variant="soft">Close</R.Button>
        </R.Dialog.Close>
      </div>
    </R.Dialog.Content>
  </R.Dialog.Root>
);
export const Drawer = Dialog;
export const Menu = ({ label, items }) => (
  <R.DropdownMenu.Root>
    <R.DropdownMenu.Trigger>
      <R.Button variant="soft">
        {label}
        <R.DropdownMenu.TriggerIcon />
      </R.Button>
    </R.DropdownMenu.Trigger>
    <R.DropdownMenu.Content>
      {items.map((x) => (
        <R.DropdownMenu.Item key={x.label} onSelect={x.action}>
          {x.label}
        </R.DropdownMenu.Item>
      ))}
    </R.DropdownMenu.Content>
  </R.DropdownMenu.Root>
);
export const Popover = ({ label, children }) => (
  <R.Popover.Root>
    <R.Popover.Trigger>
      <R.Button variant="soft">{label}</R.Button>
    </R.Popover.Trigger>
    <R.Popover.Content maxWidth="320px">
      <div className="stack">{children}</div>
    </R.Popover.Content>
  </R.Popover.Root>
);
export const Disclosure = ({ label, children }) => (
  <details>
    <summary>{label}</summary>
    {children}
  </details>
);
export const Number = (p) => (
  <Input {...p} type="number" onChange={(v) => p.onChange(Number(v))} />
);
export const Date = (p) => <Input {...p} type="date" />;
export const Color = ({ label, ...p }) => (
  <label className="field">
    {label}
    <input
      type="color"
      value={p.value}
      onChange={(e) => p.onChange(e.target.value)}
    />
  </label>
);
export const Rating = ({ label, value, onChange }) => (
  <Select
    label={label}
    options={["1", "2", "3", "4", "5"]}
    value={String(value)}
    onChange={(v) => onChange(Number(v))}
  />
);
export function Combo({ label, options, ...p }) {
  const id = useId();
  return (
    <div>
      <Input label={label} {...p} list={id} />
      <datalist id={id}>
        {options.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
    </div>
  );
}
export const Breadcrumbs = ({ items }) => (
  <nav aria-label="Current study path">
    <R.Flex gap="2" wrap="wrap">
      {items.map(([label, href]) =>
        href ? (
          <R.Link key={label} href={href}>
            {label} /
          </R.Link>
        ) : (
          <R.Text key={label}>{label}</R.Text>
        ),
      )}
    </R.Flex>
  </nav>
);

export const Link = R.Link;
