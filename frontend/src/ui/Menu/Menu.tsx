import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { Icon } from '../Icon/Icon';
import { ChevronDown } from '../Icon/icons';
import styles from './Menu.module.css';

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly icon?: ComponentChildren;
  readonly danger?: boolean;
  readonly onSelect?: () => void;
}

export interface MenuProps {
  readonly triggerLabel: string;
  readonly triggerText?: string;
  readonly triggerIcon?: ComponentChildren;
  readonly items: readonly MenuItem[];
  readonly align?: 'left' | 'right';
  readonly class?: string;
}

export function Menu({
  triggerLabel,
  triggerText,
  triggerIcon,
  items,
  align = 'right',
  class: className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const pendingFocusRef = useRef<'first' | 'last' | null>(null);

  useEffect(() => {
    if (!open) return;

    if (pendingFocusRef.current === 'first') {
      itemRefs.current[0]?.focus();
    } else if (pendingFocusRef.current === 'last') {
      itemRefs.current[items.length - 1]?.focus();
    }
    pendingFocusRef.current = null;

    function handleOutsidePointer(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsidePointer);
    return () => {
      document.removeEventListener('mousedown', handleOutsidePointer);
    };
  }, [open, items.length]);

  function closeAndRestoreFocus() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTriggerKeyDown(event: JSX.TargetedKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      pendingFocusRef.current = 'first';
      setOpen(true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      pendingFocusRef.current = 'last';
      setOpen(true);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  }

  function handleMenuKeyDown(event: JSX.TargetedKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }

    if (items.length === 0) return;

    const activeEl = document.activeElement;
    const currentIndex = itemRefs.current.findIndex((el) => el === activeEl);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = currentIndex >= 0 ? (currentIndex + 1) % items.length : 0;
      itemRefs.current[next]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev =
        currentIndex >= 0 ? (currentIndex - 1 + items.length) % items.length : items.length - 1;
      itemRefs.current[prev]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      itemRefs.current[items.length - 1]?.focus();
    }
  }

  return (
    <div ref={wrapperRef} class={`${styles.wrapper}${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        class={styles.trigger}
        aria-label={triggerText ? undefined : triggerLabel}
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => {
          setOpen((prev) => {
            if (!prev) {
              pendingFocusRef.current = 'first';
            }
            return !prev;
          });
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        {triggerIcon}
        {triggerText ? <span>{triggerText}</span> : null}
        <Icon icon={ChevronDown} size={16} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={triggerLabel}
          class={`${styles.panel} ${styles[`align-${align}`]}`}
          onKeyDown={handleMenuKeyDown}
        >
          {items.map((item, index) => {
            const itemClasses = `${styles.item}${item.danger ? ` ${styles.danger}` : ''}`;
            if (item.href) {
              return (
                <a
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  href={item.href}
                  role="menuitem"
                  class={itemClasses}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect?.();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              );
            }

            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                class={itemClasses}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
