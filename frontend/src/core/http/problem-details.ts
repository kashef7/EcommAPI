import type { FieldErrors } from './api-error';

export interface ParsedProblemDetails {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors: FieldErrors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseProblemDetails(raw: unknown, fallbackStatus: number): ParsedProblemDetails {
  if (!isRecord(raw)) {
    return {
      status: fallbackStatus,
      title: '',
      detail: '',
      fieldErrors: {},
    };
  }

  const status = typeof raw['status'] === 'number' ? raw['status'] : fallbackStatus;
  const title = typeof raw['title'] === 'string' ? raw['title'].trim() : '';
  const detail = typeof raw['detail'] === 'string' ? raw['detail'].trim() : '';

  const errorsOut: Record<string, readonly string[]> = {};
  const rawErrors = raw['errors'];
  if (isRecord(rawErrors)) {
    for (const [key, messages] of Object.entries(rawErrors)) {
      if (Array.isArray(messages)) {
        const filtered = messages
          .filter((msg): msg is string => typeof msg === 'string' && msg.trim().length > 0)
          .map((msg) => msg.trim());
        if (filtered.length > 0) {
          errorsOut[key] = filtered;
        }
      } else if (typeof messages === 'string' && messages.trim().length > 0) {
        errorsOut[key] = [messages.trim()];
      }
    }
  }

  return {
    status,
    title,
    detail,
    fieldErrors: errorsOut,
  };
}

export function normalizeFieldKey(rawKey: string): string {
  const withoutJsonPrefix = rawKey.startsWith('$.') ? rawKey.slice(2) : rawKey;
  return withoutJsonPrefix.trim().toLowerCase();
}

export interface MappedFormErrors {
  readonly fields: Record<string, string>;
  readonly summary: readonly string[];
}

export function mapFieldErrors(
  fieldErrors: FieldErrors,
  knownFieldKeys: readonly string[],
): MappedFormErrors {
  const normalizedLookup = new Map<string, string>();
  for (const key of knownFieldKeys) {
    normalizedLookup.set(normalizeFieldKey(key), key);
  }

  const fields: Record<string, string> = {};
  const summary: string[] = [];

  for (const [rawKey, messages] of Object.entries(fieldErrors)) {
    const firstMessage = messages[0];
    if (!firstMessage) continue;

    const normalizedRaw = normalizeFieldKey(rawKey);
    const exactMatch = normalizedLookup.get(normalizedRaw);
    if (exactMatch) {
      if (!fields[exactMatch]) {
        fields[exactMatch] = firstMessage;
      }
      continue;
    }

    // Match dotted leaf name only when not indexed (e.g. "Dto.Email" -> "email")
    const isIndexed = normalizedRaw.includes('[');
    if (!isIndexed && normalizedRaw.includes('.')) {
      const leaf = normalizedRaw.slice(normalizedRaw.lastIndexOf('.') + 1);
      const leafMatch = normalizedLookup.get(leaf);
      if (leafMatch) {
        if (!fields[leafMatch]) {
          fields[leafMatch] = firstMessage;
        }
        continue;
      }
    }

    summary.push(firstMessage);
  }

  return { fields, summary };
}

export interface IndexedFieldPath {
  readonly collection: string;
  readonly index: number;
  readonly field: string;
}

export function parseIndexedFieldPath(rawKey: string): IndexedFieldPath | null {
  const normalized = normalizeFieldKey(rawKey);
  const match = /^([a-z0-9_]+)\[(\d+)\]\.(.+)$/i.exec(normalized);
  if (!match) {
    return null;
  }
  const collection = match[1];
  const indexStr = match[2];
  const field = match[3];
  if (!collection || !indexStr || !field) {
    return null;
  }
  const index = Number.parseInt(indexStr, 10);
  if (!Number.isSafeInteger(index) || index < 0) {
    return null;
  }
  return { collection, index, field };
}
