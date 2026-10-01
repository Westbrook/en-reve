import React, { useState, useId } from "react";
import * as A from "@astryxdesign/core";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-neutral/theme.css";
export const libraryName = "Astryx";
export const Provider = ({ children }) => (
  <A.Theme theme={neutralTheme} mode="light">
    <div
      style={{
        "--art-accent": "var(--color-accent)",
        "--art-surface": "var(--color-background-muted)",
      }}
    >
      {children}
    </div>
  </A.Theme>
);
export const Card = ({ children }) => <A.Card padding={5}>{children}</A.Card>;
export const Button = ({ children, secondary, disabled, ...p }) => (
  <A.Button
    label={
      typeof children === "string" ? children : p["aria-label"] || "Action"
    }
    variant={secondary ? "secondary" : "primary"}
    isDisabled={disabled}
    {...p}
  >
    {children}
  </A.Button>
);
function useValue(value, initial, onChange) {
  const [local, setLocal] = useState(initial);
  return [
    value === undefined ? local : value,
    (v) => {
      setLocal(v);
      onChange?.(v);
    },
  ];
}
export function Input({
  multiline,
  value,
  defaultValue = "",
  onChange,
  required,
  ...p
}) {
  const [v, set] = useValue(value, defaultValue, onChange);
  const Component = multiline ? A.TextArea : A.TextInput;
  return <Component {...p} value={v} onChange={set} isRequired={required} />;
}
export function Check({ checked, defaultChecked = false, onChange, ...p }) {
  const [v, set] = useValue(checked, defaultChecked, onChange);
  return <A.CheckboxInput {...p} value={v} onChange={set} />;
}
export function Switch({ checked, defaultChecked = false, onChange, ...p }) {
  const [v, set] = useValue(checked, defaultChecked, onChange);
  return <A.Switch {...p} value={v} onChange={set} />;
}
export const Badge = ({ children }) => <A.Badge label={children} />;
export const Avatar = A.Avatar;
export function Select({ value, defaultValue, options, onChange, ...p }) {
  const [v, set] = useValue(value, defaultValue || options[0], onChange);
  return (
    <A.Selector
      {...p}
      value={v}
      onChange={set}
      options={options.map((x) => ({ value: x, label: x }))}
    />
  );
}
export const Combo = (p) => <Select {...p} hasSearch />;
export function Tabs({ label, items }) {
  const [value, setValue] = useState(items[0].id);
  return (
    <>
      <A.TabList
        aria-label={label}
        role="tablist"
        value={value}
        onChange={setValue}
      >
        {items.map((x) => (
          <A.Tab key={x.id} value={x.id} label={x.label} />
        ))}
      </A.TabList>
      <div role="tabpanel">{items.find((x) => x.id === value).content}</div>
    </>
  );
}
export const Disclosure = ({ label, children }) => (
  <A.Collapsible trigger={label} defaultIsOpen={false}>
    {children}
  </A.Collapsible>
);
export const Progress = A.ProgressBar;
export const Slider = A.Slider;
export const Number = A.NumberInput;
export const Date = A.DateInput;
export const Color = ({ label, value, onChange }) => (
  <label className="field">
    {label}
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);
export const Rating = ({ value, onChange, label }) => (
  <Select
    label={label}
    options={["1", "2", "3", "4", "5"]}
    value={String(value)}
    onChange={(v) => onChange(Number(v))}
  />
);
export const Segments = ({ options, ...p }) => (
  <A.SegmentedControl {...p}>
    {options.map((x) => (
      <A.SegmentedControlItem key={x} value={x} label={x} />
    ))}
  </A.SegmentedControl>
);
export function Radio({ defaultValue, label, options }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <A.RadioList label={label} value={value} onChange={setValue}>
      {options.map((x) => (
        <A.RadioListItem key={x} value={x} label={x} />
      ))}
    </A.RadioList>
  );
}
export const Dialog = ({ open, title, children, ...p }) => {
  const id = useId();
  return (
    <A.Dialog isOpen={open} {...p} aria-labelledby={id}>
      <div className="stack">
        <h2 id={id}>{title}</h2>
        {children}
        <Button secondary onClick={() => p.onOpenChange(false)}>
          Close
        </Button>
      </div>
    </A.Dialog>
  );
};
export const Drawer = ({ open, title, children, ...p }) => (
  <A.BottomSheet isOpen={open} label={title} {...p}>
    <div className="stack" style={{ padding: 24 }}>
      <h2>{title}</h2>
      {children}
      <Button secondary onClick={() => p.onOpenChange(false)}>
        Close
      </Button>
    </div>
  </A.BottomSheet>
);
export const Menu = ({ label, items }) => (
  <A.DropdownMenu
    button={{ label }}
    items={items.map((x) => ({ label: x.label, onClick: x.action }))}
  />
);
export const Popover = ({ label, children }) => (
  <A.Popover
    label={label}
    content={
      <div className="stack" style={{ padding: 16, maxWidth: 320 }}>
        {children}
      </div>
    }
  >
    <A.Button label={label} />
  </A.Popover>
);
export const Breadcrumbs = ({ items }) => (
  <A.Breadcrumbs label="Current study path">
    {items.map(([label, href]) => (
      <A.BreadcrumbItem key={label} href={href || undefined} isCurrent={!href}>
        {label}
      </A.BreadcrumbItem>
    ))}
  </A.Breadcrumbs>
);

export const Link = A.Link;
