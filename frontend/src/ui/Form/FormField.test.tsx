import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { FormField } from './FormField';
import { Input } from './Input';

afterEach(cleanup);

describe('FormField', () => {
  it('associates label, hint, and error via aria-describedby and sets aria-invalid', () => {
    render(
      <FormField
        label="Email address"
        hint="Use the email on your account."
        error="Please enter a valid email address."
        required
      >
        <Input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText(/Email address/i) as HTMLInputElement;
    const hint = screen.getByText('Use the email on your account.');
    const error = screen.getByRole('alert');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
    expect(error.textContent).toContain('Please enter a valid email address.');
  });

  it('omits aria-invalid when there is no error and supports render callback children', () => {
    render(
      <FormField label="Full name" hint="Max 200 characters.">
        {(a11yProps) => <Input {...a11yProps} value="Ada Lovelace" />}
      </FormField>,
    );

    const input = screen.getByLabelText('Full name') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.value).toBe('Ada Lovelace');
  });
});
