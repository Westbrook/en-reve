import React from "react";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import * as S from "@react-spectrum/s2";
import { parseDate } from "@internationalized/date";
import "@react-spectrum/s2/page.css";
export const libraryName = "React Spectrum 2";
export const Provider = ({ children }) => (
  <S.Provider
    colorScheme="light"
    background="base"
    styles={style({ font: "body", color: "body" })}
  >
    {children}
  </S.Provider>
);
// S2 Card is a collection item, not a generic interactive form surface.
export const Card = ({ children }) => (
  <div
    className={style({
      padding: 20,
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "gray-300",
      borderRadius: "lg",
      backgroundColor: "layer-1",
    })}
  >
    {children}
  </div>
);
export const Button = ({ secondary, onClick, disabled, ...p }) => (
  <S.Button
    variant={secondary ? "secondary" : "accent"}
    onPress={onClick}
    isDisabled={disabled}
    {...p}
  />
);
export const Input = ({ multiline, required, ...p }) =>
  multiline ? (
    <S.TextArea {...p} isRequired={required} />
  ) : (
    <S.TextField {...p} isRequired={required} />
  );
export const Check = ({ label, checked, defaultChecked, ...p }) => (
  <S.Checkbox isSelected={checked} defaultSelected={defaultChecked} {...p}>
    {label}
  </S.Checkbox>
);
export const Switch = ({ label, checked, defaultChecked, ...p }) => (
  <S.Switch isSelected={checked} defaultSelected={defaultChecked} {...p}>
    {label}
  </S.Switch>
);
export const Badge = ({ children }) => (
  <S.Badge variant="neutral">{children}</S.Badge>
);
export const Avatar = ({ name }) => (
  <S.Avatar
    alt={name}
    src={
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#ddd"/><text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-size="14">${name
          .split(" ")
          .map((x) => x[0])
          .join("")}</text></svg>`,
      )
    }
  />
);
export const Select = ({ options, value, defaultValue, onChange, ...p }) => (
  <S.Picker
    {...p}
    selectedKey={value}
    defaultSelectedKey={defaultValue}
    onSelectionChange={onChange}
  >
    {options.map((x) => (
      <S.PickerItem key={x} id={x}>
        {x}
      </S.PickerItem>
    ))}
  </S.Picker>
);
export const Combo = ({ options, value, onChange, ...p }) => (
  <S.ComboBox
    {...p}
    selectedKey={value || null}
    onSelectionChange={(v) => onChange(v || "")}
  >
    {options.map((x) => (
      <S.ComboBoxItem key={x} id={x}>
        {x}
      </S.ComboBoxItem>
    ))}
  </S.ComboBox>
);
export const Tabs = ({ label, items }) => (
  <S.Tabs aria-label={label}>
    <S.TabList>
      {items.map((x) => (
        <S.Tab key={x.id} id={x.id}>
          {x.label}
        </S.Tab>
      ))}
    </S.TabList>
    {items.map((x) => (
      <S.TabPanel key={x.id} id={x.id}>
        {x.content}
      </S.TabPanel>
    ))}
  </S.Tabs>
);
export const Disclosure = ({ label, children }) => (
  <S.Accordion>
    <S.AccordionItem id="review">
      <S.AccordionItemHeader>
        <S.AccordionItemTitle>{label}</S.AccordionItemTitle>
      </S.AccordionItemHeader>
      <S.AccordionItemPanel>{children}</S.AccordionItemPanel>
    </S.AccordionItem>
  </S.Accordion>
);
export const Progress = ({ max, ...p }) => (
  <S.ProgressBar {...p} maxValue={max} />
);
export const Slider = S.Slider;
export const Number = ({ min, max, ...p }) => (
  <S.NumberField {...p} minValue={min} maxValue={max} />
);
export const Date = ({ value, onChange, ...p }) => (
  <S.DatePicker
    {...p}
    value={value ? parseDate(value) : null}
    onChange={(v) => onChange(v?.toString() || "")}
  />
);
export const Color = ({ onChange, ...p }) => (
  <S.ColorField
    {...p}
    onChange={(v) => {
      if (v) onChange(v.toString("hex"));
    }}
  />
);
export const Rating = ({ value, onChange, ...p }) => (
  <Select
    {...p}
    options={["1", "2", "3", "4", "5"]}
    value={String(value)}
    onChange={(v) => onChange(Number(v))}
  />
);
export const Segments = ({ label, options, value, onChange }) => (
  <S.SegmentedControl
    aria-label={label}
    selectedKey={value}
    onSelectionChange={onChange}
  >
    {options.map((x) => (
      <S.SegmentedControlItem key={x} id={x}>
        {x}
      </S.SegmentedControlItem>
    ))}
  </S.SegmentedControl>
);
export const Radio = ({ options, ...p }) => (
  <S.RadioGroup {...p}>
    {options.map((x) => (
      <S.Radio key={x} value={x}>
        {x}
      </S.Radio>
    ))}
  </S.RadioGroup>
);
export const Dialog = ({ open, onOpenChange, title, children }) => (
  <S.DialogContainer onDismiss={() => onOpenChange(false)}>
    {open && (
      <S.Dialog>
        <S.Heading slot="title">{title}</S.Heading>
        <S.Content>
          <div className="stack">
            {children}
            <Button secondary onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </S.Content>
      </S.Dialog>
    )}
  </S.DialogContainer>
);
export const Drawer = Dialog;
export const Menu = ({ label, items }) => (
  <S.MenuTrigger>
    <S.ActionButton>{label}</S.ActionButton>
    <S.Menu onAction={(key) => items.find((x) => x.label === key)?.action()}>
      {items.map((x) => (
        <S.MenuItem key={x.label} id={x.label}>
          {x.label}
        </S.MenuItem>
      ))}
    </S.Menu>
  </S.MenuTrigger>
);
export const Popover = ({ label, children }) => (
  <S.DialogTrigger>
    <S.ActionButton>{label}</S.ActionButton>
    <S.Popover aria-label={label}>
      <div className="stack">{children}</div>
    </S.Popover>
  </S.DialogTrigger>
);
// Use semantic breadcrumbs with native S2 links: S2 1.7.1's automatic
// collapse currently omits the final item in this narrow-card fixture.
export const Breadcrumbs = ({ items }) => (
  <nav aria-label="Current study path">
    <div className="row">
      {items.map(([label, href], i) => (
        <React.Fragment key={label}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {href ? (
            <S.Link href={href}>{label}</S.Link>
          ) : (
            <span aria-current="page">{label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  </nav>
);

export const Link = S.Link;
