import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'preact/hooks';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import { Dialog } from './Dialog';

afterEach(cleanup);

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      <Dialog open={open} title="Filters" onClose={() => setOpen(false)}>
        <p>Filter options</p>
      </Dialog>
    </div>
  );
}

describe('Dialog and ConfirmDialog focus management', () => {
  it('moves focus inside Dialog on open and returns focus to opener on Escape or close', () => {
    render(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open modal' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    expect(document.activeElement).toBe(closeBtn);

    const dialog = document.querySelector('dialog')!;
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });

  it('focuses the Cancel button by default in ConfirmDialog and returns focus on cancel', () => {
    const onConfirm = vi.fn();

    function ConfirmHarness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Delete item
          </button>
          <ConfirmDialog
            open={open}
            title="Delete product"
            message="This removes the product from the catalog."
            confirmLabel="Delete"
            onCancel={() => setOpen(false)}
            onConfirm={onConfirm}
          />
        </div>
      );
    }

    render(<ConfirmHarness />);
    const trigger = screen.getByRole('button', { name: 'Delete item' });
    trigger.focus();
    fireEvent.click(trigger);

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(document.activeElement).toBe(cancelBtn);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelBtn);
    expect(document.activeElement).toBe(trigger);
  });
});
