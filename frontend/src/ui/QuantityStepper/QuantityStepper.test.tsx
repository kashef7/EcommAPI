import { cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuantityStepper } from './QuantityStepper';

afterEach(cleanup);

describe('QuantityStepper', () => {
  it('increments and decrements within min and max bounds', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} min={1} max={3} onChange={onChange} />);

    const minus = screen.getByRole('button', { name: 'Decrease quantity' });
    const plus = screen.getByRole('button', { name: 'Increase quantity' });

    fireEvent.click(plus);
    expect(onChange).toHaveBeenCalledWith(3);

    fireEvent.click(minus);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables decrement at min and increment at max', () => {
    render(<QuantityStepper value={1} min={1} max={1} onChange={() => undefined} />);

    const minus = screen.getByRole('button', { name: 'Decrease quantity' }) as HTMLButtonElement;
    const plus = screen.getByRole('button', { name: 'Increase quantity' }) as HTMLButtonElement;

    expect(minus.disabled).toBe(true);
    expect(plus.disabled).toBe(true);
  });

  it('clamps typed numeric values on blur and ignores non-numeric input', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} min={1} max={5} onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'Quantity' }) as HTMLInputElement;
    fireEvent.input(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(5);

    fireEvent.input(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(input.value).toBe('2');
  });
});
