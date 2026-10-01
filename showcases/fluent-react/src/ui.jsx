import React, { useId, useState } from "react";
import * as F from "@fluentui/react-components";
export const libraryName = "Fluent 2 React";
export const Provider = ({ children }) => (
  <F.FluentProvider theme={F.webLightTheme}>
    <div
      style={{
        "--art-accent": "var(--colorBrandBackground)",
        "--art-surface": "var(--colorNeutralBackground3)",
      }}
    >
      {children}
    </div>
  </F.FluentProvider>
);
export const Card = ({ children }) => <F.Card size="large">{children}</F.Card>;
export const Button = ({ secondary, ...p }) => (
  <F.Button appearance={secondary ? "secondary" : "primary"} {...p} />
);
export function Input({ label, multiline, onChange, required, ...p }) {
  return (
    <F.Field label={label} required={required}>
      {multiline ? (
        <F.Textarea {...p} onChange={(_, d) => onChange?.(d.value)} />
      ) : (
        <F.Input {...p} onChange={(_, d) => onChange?.(d.value)} />
      )}
    </F.Field>
  );
}
export const Check = ({ onChange, ...p }) => (
  <F.Checkbox {...p} onChange={(_, d) => onChange?.(!!d.checked)} />
);
export const Switch = ({ onChange, ...p }) => (
  <F.Switch {...p} onChange={(_, d) => onChange?.(d.checked)} />
);
export const Badge = F.Badge;
export const Avatar = F.Avatar;
export const Select = ({ label, options, onChange, ...p }) => (
  <F.Field label={label}>
    <F.Select {...p} onChange={(_, d) => onChange?.(d.value)}>
      {options.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </F.Select>
  </F.Field>
);
export function Combo({ label, options, value, onChange }) {
  return (
    <F.Field label={label}>
      <F.Combobox
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onOptionSelect={(_, d) => onChange(d.optionValue || "")}
      >
        {options
          .filter(
            (x) =>
              !value ||
              x.toLowerCase().includes(value.toLowerCase()) ||
              options.includes(value),
          )
          .map((x) => (
            <F.Option key={x} value={x}>
              {x}
            </F.Option>
          ))}
      </F.Combobox>
    </F.Field>
  );
}
export function Tabs({ label, items }) {
  const [selected, setSelected] = useState(items[0].id);
  return (
    <>
      <F.TabList
        aria-label={label}
        selectedValue={selected}
        onTabSelect={(_, d) => setSelected(d.value)}
      >
        {items.map((x) => (
          <F.Tab value={x.id} key={x.id}>
            {x.label}
          </F.Tab>
        ))}
      </F.TabList>
      <div role="tabpanel">{items.find((x) => x.id === selected).content}</div>
    </>
  );
}
export const Disclosure = ({ label, children }) => (
  <F.Accordion collapsible>
    <F.AccordionItem value="review">
      <F.AccordionHeader>{label}</F.AccordionHeader>
      <F.AccordionPanel>{children}</F.AccordionPanel>
    </F.AccordionItem>
  </F.Accordion>
);
export const Progress = ({ label, ...p }) => (
  <F.ProgressBar {...p} aria-label={label} />
);
export const Slider = ({ label, onChange, ...p }) => (
  <F.Field label={label}>
    <F.Slider {...p} onChange={(_, d) => onChange(d.value)} />
  </F.Field>
);
export const Number = ({ label, onChange, ...p }) => (
  <F.Field label={label}>
    <F.SpinButton
      {...p}
      onChange={(_, d) => {
        if (d.value !== null) onChange(d.value);
      }}
    />
  </F.Field>
);
export const Date = (p) => <Input {...p} type="date" />;
export const Color = (p) => <Input {...p} type="color" />;
export const Rating = ({ label, onChange, ...p }) => (
  <F.Rating {...p} aria-label={label} onChange={(_, d) => onChange(d.value)} />
);
export const Segments = ({ label, value, onChange, options }) => (
  <F.TabList
    aria-label={label}
    selectedValue={value}
    onTabSelect={(_, d) => onChange(d.value)}
  >
    {options.map((x) => (
      <F.Tab key={x} value={x}>
        {x}
      </F.Tab>
    ))}
  </F.TabList>
);
export const Radio = ({ label, options, ...p }) => (
  <F.RadioGroup {...p} aria-label={label}>
    {options.map((x) => (
      <F.Radio key={x} value={x} label={x} />
    ))}
  </F.RadioGroup>
);
export const Dialog = ({ open, onOpenChange, title, children }) => (
  <F.Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
    <F.DialogSurface>
      <F.DialogBody>
        <F.DialogTitle>{title}</F.DialogTitle>
        <F.DialogContent>
          <div className="stack">{children}</div>
        </F.DialogContent>
        <F.DialogActions>
          <F.Button onClick={() => onOpenChange(false)}>Close</F.Button>
        </F.DialogActions>
      </F.DialogBody>
    </F.DialogSurface>
  </F.Dialog>
);
export const Drawer = ({ open, onOpenChange, title, children }) => (
  <F.OverlayDrawer
    open={open}
    onOpenChange={(_, d) => onOpenChange(d.open)}
    position="end"
  >
    <F.DrawerHeader>
      <F.DrawerHeaderTitle
        action={<F.Button onClick={() => onOpenChange(false)}>Close</F.Button>}
      >
        {title}
      </F.DrawerHeaderTitle>
    </F.DrawerHeader>
    <F.DrawerBody>
      <div className="stack">{children}</div>
    </F.DrawerBody>
  </F.OverlayDrawer>
);
export const Menu = ({ label, items }) => (
  <F.Menu>
    <F.MenuTrigger disableButtonEnhancement>
      <F.MenuButton>{label}</F.MenuButton>
    </F.MenuTrigger>
    <F.MenuPopover>
      <F.MenuList>
        {items.map((x) => (
          <F.MenuItem key={x.label} onClick={x.action}>
            {x.label}
          </F.MenuItem>
        ))}
      </F.MenuList>
    </F.MenuPopover>
  </F.Menu>
);
export const Popover = ({ label, children }) => (
  <F.Popover>
    <F.PopoverTrigger disableButtonEnhancement>
      <F.Button>{label}</F.Button>
    </F.PopoverTrigger>
    <F.PopoverSurface>
      <div className="stack" style={{ maxWidth: 300 }}>
        {children}
      </div>
    </F.PopoverSurface>
  </F.Popover>
);
export const Breadcrumbs = ({ items }) => (
  <F.Breadcrumb aria-label="Current study path">
    {items.map(([label, href], i) => (
      <React.Fragment key={label}>
        {i > 0 && <F.BreadcrumbDivider />}
        <F.BreadcrumbItem>
          {href ? (
            <F.BreadcrumbButton as="a" href={href}>
              {label}
            </F.BreadcrumbButton>
          ) : (
            label
          )}
        </F.BreadcrumbItem>
      </React.Fragment>
    ))}
  </F.Breadcrumb>
);

export const Link = F.Link;
