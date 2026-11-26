import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';
import { toUserMessage } from './error-messages';
import { mapFieldErrors, parseIndexedFieldPath, parseProblemDetails } from './problem-details';

describe('ProblemDetails parsing and field mapping', () => {
  it('parses RFC 7807 ProblemDetails and ValidationProblemDetails', () => {
    const parsed = parseProblemDetails(
      {
        status: 400,
        title: 'One or more validation errors occurred.',
        errors: {
          Email: ['Email is invalid.'],
          'Variants[0].Price': ['Price must be positive.'],
          UnknownField: ['Server validation issue.'],
        },
      },
      400,
    );

    expect(parsed.status).toBe(400);
    const mapped = mapFieldErrors(parsed.fieldErrors, ['email', 'name']);
    expect(mapped.fields['email']).toBe('Email is invalid.');
    expect(mapped.summary).toEqual(['Price must be positive.', 'Server validation issue.']);
  });

  it('maps indexed variant paths like Variants[0].Price to row index and field', () => {
    expect(parseIndexedFieldPath('Variants[0].Price')).toEqual({
      collection: 'variants',
      index: 0,
      field: 'price',
    });
    expect(parseIndexedFieldPath('variants[12].StockQuantity')).toEqual({
      collection: 'variants',
      index: 12,
      field: 'stockquantity',
    });
    expect(parseIndexedFieldPath('Name')).toBeNull();
  });

  it('maps HTTP errors and titles to exact calm user messages', () => {
    expect(toUserMessage(new ApiError({ kind: 'network', status: 0, title: '', detail: '' }))).toBe(
      'We could not reach the server. Check your connection and try again.',
    );

    expect(toUserMessage(new ApiError({ kind: 'timeout', status: 0, title: '', detail: '' }))).toBe(
      'This is taking longer than expected. Please try again.',
    );

    expect(
      toUserMessage(
        new ApiError({ kind: 'http', status: 401, title: 'Invalid Credentials', detail: '' }),
      ),
    ).toBe('That email and password do not match.');

    expect(toUserMessage(new ApiError({ kind: 'http', status: 401, title: '', detail: '' }))).toBe(
      'Your session has ended. Please sign in again.',
    );

    expect(toUserMessage(new ApiError({ kind: 'http', status: 403, title: '', detail: '' }))).toBe(
      'You do not have permission to do that.',
    );

    expect(toUserMessage(new ApiError({ kind: 'http', status: 404, title: '', detail: '' }))).toBe(
      'We could not find what you were looking for.',
    );

    expect(
      toUserMessage(
        new ApiError({ kind: 'http', status: 409, title: 'Email Already Exists', detail: '' }),
      ),
    ).toBe('An account with this email already exists.');

    expect(
      toUserMessage(
        new ApiError({
          kind: 'http',
          status: 409,
          title: 'Insufficient Stock',
          detail: 'Requested 5, only 2 left.',
        }),
      ),
    ).toBe('Requested 5, only 2 left.');

    expect(
      toUserMessage(
        new ApiError({ kind: 'http', status: 409, title: 'Category Has Products', detail: '' }),
      ),
    ).toBe('This category still has products. Move or remove them first.');

    expect(
      toUserMessage(
        new ApiError({ kind: 'http', status: 400, title: 'Incorrect Password', detail: '' }),
      ),
    ).toBe('Your current password is not correct.');

    expect(
      toUserMessage(new ApiError({ kind: 'http', status: 500, title: '', detail: 'Raw' })),
    ).toBe('Something went wrong on our side. Please try again in a moment.');
  });
});
