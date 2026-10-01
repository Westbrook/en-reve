import React, { useId } from "react";
import { Button as B } from "./components/ui/button";
import { Card as C, CardContent } from "./components/ui/card";
import { Input as I } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Checkbox } from "./components/ui/checkbox";
import { Switch as Sw } from "./components/ui/switch";
import * as Se from "./components/ui/select";
import * as T from "./components/ui/tabs";
import * as A from "./components/ui/accordion";
import { Progress as Pr } from "./components/ui/progress";
import { Slider as Sl } from "./components/ui/slider";
import { Badge as Ba } from "./components/ui/badge";
import * as Av from "./components/ui/avatar";
import * as D from "./components/ui/dialog";
import * as Sh from "./components/ui/sheet";
import * as M from "./components/ui/dropdown-menu";
import * as P from "./components/ui/popover";
import * as Ra from "./components/ui/radio-group";
import * as Cr from "./components/ui/breadcrumb";
import * as Co from "./components/ui/combobox";
import "./style.css";
export const libraryName = "shadcn/ui";
export const Provider = ({ children }) => (
  <div className="bg-background text-foreground font-sans min-h-screen">
    {children}
  </div>
);
export const Card = ({ children }) => (
  <C>
    <CardContent>{children}</CardContent>
  </C>
);
export const Button = ({ secondary, ...p }) => (
  <B variant={secondary ? "outline" : "default"} {...p} />
);
export function Input({ label, multiline, onChange, ...p }) {
  const id = useId();
  return (
    <div className="field">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} {...p} onChange={(e) => onChange?.(e.target.value)} />
      ) : (
        <I id={id} {...p} onChange={(e) => onChange?.(e.target.value)} />
      )}
    </div>
  );
}
export function Check({ label, onChange, ...p }) {
  const id = useId();
  return (
    <div className="row">
      <Checkbox id={id} {...p} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
export function Switch({ label, onChange, ...p }) {
  const id = useId();
  return (
    <div className="row">
      <Sw id={id} {...p} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
export const Badge = Ba;
export const Avatar = ({ name }) => (
  <Av.Avatar>
    <Av.AvatarFallback>
      {name
        .split(" ")
        .map((x) => x[0])
        .join("")}
    </Av.AvatarFallback>
  </Av.Avatar>
);
export const Select = ({ label, options, onChange, ...p }) => (
  <div className="field">
    <Label>{label}</Label>
    <Se.Select {...p} onValueChange={onChange}>
      <Se.SelectTrigger aria-label={label}>
        <Se.SelectValue />
      </Se.SelectTrigger>
      <Se.SelectContent>
        {options.map((x) => (
          <Se.SelectItem key={x} value={x}>
            {x}
          </Se.SelectItem>
        ))}
      </Se.SelectContent>
    </Se.Select>
  </div>
);
export const Combo = ({ label, options, value, onChange }) => (
  <div className="field">
    <Label>{label}</Label>
    <Co.Combobox
      items={options}
      value={value || null}
      onValueChange={(v) => onChange(v || "")}
    >
      <Co.ComboboxInput aria-label={label} placeholder="Search people…" />
      <Co.ComboboxContent>
        <Co.ComboboxEmpty>No people found.</Co.ComboboxEmpty>
        <Co.ComboboxList>
          {(item) => (
            <Co.ComboboxItem key={item} value={item}>
              {item}
            </Co.ComboboxItem>
          )}
        </Co.ComboboxList>
      </Co.ComboboxContent>
    </Co.Combobox>
  </div>
);
export const Tabs = ({ label, items }) => (
  <T.Tabs defaultValue={items[0].id}>
    <T.TabsList aria-label={label}>
      {items.map((x) => (
        <T.TabsTrigger key={x.id} value={x.id}>
          {x.label}
        </T.TabsTrigger>
      ))}
    </T.TabsList>
    {items.map((x) => (
      <T.TabsContent key={x.id} value={x.id}>
        {x.content}
      </T.TabsContent>
    ))}
  </T.Tabs>
);
export const Disclosure = ({ label, children }) => (
  <A.Accordion>
    <A.AccordionItem value="review">
      <A.AccordionTrigger>{label}</A.AccordionTrigger>
      <A.AccordionContent>{children}</A.AccordionContent>
    </A.AccordionItem>
  </A.Accordion>
);
export const Progress = ({ value, max, label }) => (
  <Pr value={(value / max) * 100} aria-label={label} />
);
export const Slider = ({ value, onChange, label }) => (
  <div className="field">
    <Label>{label}</Label>
    <Sl
      thumbLabel={label}
      value={[value]}
      onValueChange={(v) => onChange(v[0])}
    />
  </div>
);
export const Number = (p) => (
  <Input {...p} type="number" onChange={(v) => p.onChange(Number(v))} />
);
export const Date = (p) => <Input {...p} type="date" />;
export const Color = (p) => <Input {...p} type="color" />;
export const Rating = ({ value, onChange, ...p }) => (
  <Select
    {...p}
    options={["1", "2", "3", "4", "5"]}
    value={String(value)}
    onChange={(v) => onChange(Number(v))}
  />
);
export const Segments = ({ label, value, onChange, options }) => (
  <T.Tabs value={value} onValueChange={onChange}>
    <T.TabsList aria-label={label}>
      {options.map((x) => (
        <T.TabsTrigger key={x} value={x}>
          {x}
        </T.TabsTrigger>
      ))}
    </T.TabsList>
  </T.Tabs>
);
export const Radio = ({ label, options, ...p }) => (
  <Ra.RadioGroup aria-label={label} {...p}>
    {options.map((x) => (
      <div className="row" key={x}>
        <Ra.RadioGroupItem value={x} id={x.replaceAll(" ", "-")} />
        <Label
          id={x.replaceAll(" ", "-") + "-label"}
          htmlFor={x.replaceAll(" ", "-")}
        >
          {x}
        </Label>
      </div>
    ))}
  </Ra.RadioGroup>
);
export const Dialog = ({ title, children, ...p }) => (
  <D.Dialog {...p}>
    <D.DialogContent>
      <D.DialogHeader>
        <D.DialogTitle>{title}</D.DialogTitle>
        <D.DialogDescription>Local studio study.</D.DialogDescription>
      </D.DialogHeader>
      <div className="stack">{children}</div>
    </D.DialogContent>
  </D.Dialog>
);
export const Drawer = ({ title, children, ...p }) => (
  <Sh.Sheet {...p}>
    <Sh.SheetContent>
      <Sh.SheetHeader>
        <Sh.SheetTitle>{title}</Sh.SheetTitle>
        <Sh.SheetDescription>Local export settings.</Sh.SheetDescription>
      </Sh.SheetHeader>
      <div className="stack p-4">{children}</div>
    </Sh.SheetContent>
  </Sh.Sheet>
);
export const Menu = ({ label, items }) => (
  <M.DropdownMenu>
    <M.DropdownMenuTrigger render={<B variant="outline" />}>
      {label} ▾
    </M.DropdownMenuTrigger>
    <M.DropdownMenuContent>
      {items.map((x) => (
        <M.DropdownMenuItem key={x.label} onClick={x.action}>
          {x.label}
        </M.DropdownMenuItem>
      ))}
    </M.DropdownMenuContent>
  </M.DropdownMenu>
);
export const Popover = ({ label, children }) => (
  <P.Popover>
    <P.PopoverTrigger render={<B variant="outline" />}>
      {label}
    </P.PopoverTrigger>
    <P.PopoverContent>
      <div className="stack">{children}</div>
    </P.PopoverContent>
  </P.Popover>
);
export const Breadcrumbs = ({ items }) => (
  <Cr.Breadcrumb>
    <Cr.BreadcrumbList>
      {items.map(([label, href], i) => (
        <React.Fragment key={label}>
          {i > 0 && <Cr.BreadcrumbSeparator />}
          <Cr.BreadcrumbItem>
            {href ? (
              <Cr.BreadcrumbLink href={href}>{label}</Cr.BreadcrumbLink>
            ) : (
              <Cr.BreadcrumbPage>{label}</Cr.BreadcrumbPage>
            )}
          </Cr.BreadcrumbItem>
        </React.Fragment>
      ))}
    </Cr.BreadcrumbList>
  </Cr.Breadcrumb>
);

export const Link = ({ children, ...p }) => (
  <B variant="link" render={<a {...p} />} nativeButton={false}>
    {children}
  </B>
);
