import React from 'react';

import { cn } from '@/utils/cn';

interface SelectContextValue {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  triggerClassName?: string;
  placeholder?: string;
  items: Array<{ value: string; label: React.ReactNode; disabled?: boolean }>;
  triggerDecorators: React.ReactNode[];
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

type SelectProps = {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const isElementOfType = (node: React.ReactNode, displayName: string): node is React.ReactElement => {
  return React.isValidElement(node) && ((node.type as { displayName?: string }).displayName === displayName);
};

export function Select({ children, value, defaultValue, onValueChange }: SelectProps) {
  const nodes = React.Children.toArray(children);

  let triggerClassName = '';
  let placeholder: string | undefined;
  const triggerDecorators: React.ReactNode[] = [];
  const items: Array<{ value: string; label: React.ReactNode; disabled?: boolean }> = [];

  for (const node of nodes) {
    if (isElementOfType(node, 'SelectTrigger')) {
      triggerClassName = typeof node.props.className === 'string' ? node.props.className : '';
      const triggerChildren = React.Children.toArray(node.props.children);
      for (const child of triggerChildren) {
        if (isElementOfType(child, 'SelectValue')) {
          if (typeof child.props.placeholder === 'string') {
            placeholder = child.props.placeholder;
          }
        } else {
          triggerDecorators.push(child);
        }
      }
    }

    if (isElementOfType(node, 'SelectContent')) {
      const contentChildren = React.Children.toArray(node.props.children);
      for (const child of contentChildren) {
        if (isElementOfType(child, 'SelectItem')) {
          items.push({
            value: String(child.props.value),
            label: child.props.children,
            disabled: Boolean(child.props.disabled),
          });
        }
      }
    }
  }

  return (
    <SelectContext.Provider
      value={{ value, defaultValue, onValueChange, triggerClassName, placeholder, items, triggerDecorators }}
    >
      <SelectTrigger />
    </SelectContext.Provider>
  );
}

type SelectTriggerProps = React.HTMLAttributes<HTMLDivElement>;

export function SelectTrigger({ className }: SelectTriggerProps) {
  const context = React.useContext(SelectContext);

  if (!context) {
    throw new Error('SelectTrigger має використовуватися всередині Select');
  }

  const hasValue = Boolean(context.value ?? context.defaultValue);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded px-3 py-2',
        context.triggerClassName,
        className
      )}
    >
      {context.triggerDecorators}
      <select
        value={context.value}
        defaultValue={context.defaultValue}
        onChange={(event) => context.onValueChange?.(event.target.value)}
        className={cn(
          'w-full bg-transparent text-slate-100 focus:outline-none',
          !hasValue && 'text-slate-400'
        )}
      >
        {context.placeholder && !hasValue ? (
          <option value="" disabled>
            {context.placeholder}
          </option>
        ) : null}
        {context.items.map((item) => (
          <option key={item.value} value={item.value} disabled={item.disabled}>
            {typeof item.label === 'string' ? item.label : item.value}
          </option>
        ))}
      </select>
    </div>
  );
}
SelectTrigger.displayName = 'SelectTrigger';

type SelectContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function SelectContent({ children }: SelectContentProps) {
  return <>{children}</>;
}
SelectContent.displayName = 'SelectContent';

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
}

export function SelectItem({ children, ...props }: SelectItemProps) {
  return <option {...props}>{children}</option>;
}
SelectItem.displayName = 'SelectItem';

type SelectValueProps = {
  placeholder?: string;
};

export function SelectValue(_: SelectValueProps) {
  return null;
}
SelectValue.displayName = 'SelectValue';
