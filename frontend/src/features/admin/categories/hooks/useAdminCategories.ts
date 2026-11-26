import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
  createCategory,
  deleteCategory,
  getCategories,
  renameCategory,
} from '@/api/categories.api';
import type { Category } from '@/api/types';
import { invalidateResourceCache, useMutation, useResource } from '@/core/data/useResource';
import { isApiError } from '@/core/http/api-error';
import { toUserMessage } from '@/core/http/error-messages';
import { mapFieldErrors } from '@/core/http/problem-details';
import { validateCategoryName } from '../model/category-validation';

const CATEGORIES_CACHE_TTL_MS = 5 * 60_000;

export interface ActionOutcome {
  readonly ok: boolean;
  readonly message?: string;
}

export function useAdminCategories() {
  const categoriesResource = useResource('categories', getCategories, {
    ttlMs: CATEGORIES_CACHE_TTL_MS,
    staleWhileRevalidate: true,
  });

  const [newName, setNewName] = useState('');
  const [createFieldError, setCreateFieldError] = useState<string | undefined>(undefined);
  const [createFormErrors, setCreateFormErrors] = useState<readonly string[]>([]);
  const createInputRef = useRef<HTMLInputElement | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState<string | undefined>(undefined);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);

  const createMutation = useMutation((name: string) => createCategory(name));
  const renameMutation = useMutation(
    ({ id, name }: { readonly id: string; readonly name: string }) => renameCategory(id, name),
  );
  const deleteMutation = useMutation((id: string) => deleteCategory(id));

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const refreshCategories = useCallback(() => {
    invalidateResourceCache('categories');
    categoriesResource.reload();
  }, [categoriesResource]);

  function onNewNameChange(nextValue: string) {
    setNewName(nextValue);
    if (createFieldError) {
      setCreateFieldError(validateCategoryName(nextValue));
    }
    if (createFormErrors.length > 0) {
      setCreateFormErrors([]);
    }
  }

  function onNewNameBlur() {
    if (newName.trim().length > 0 || createFieldError) {
      setCreateFieldError(validateCategoryName(newName));
    }
  }

  async function submitCreate(): Promise<ActionOutcome> {
    if (createMutation.submitting) {
      return { ok: false };
    }

    const validationError = validateCategoryName(newName);
    if (validationError) {
      setCreateFieldError(validationError);
      setCreateFormErrors([]);
      createInputRef.current?.focus();
      return { ok: false };
    }

    setCreateFieldError(undefined);
    setCreateFormErrors([]);

    try {
      await createMutation.run(newName.trim());
      setNewName('');
      refreshCategories();
      return { ok: true };
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, ['name']);
        if (mapped.fields['name']) {
          setCreateFieldError(mapped.fields['name']);
          createInputRef.current?.focus();
        }
        if (mapped.summary.length > 0) {
          setCreateFormErrors(mapped.summary);
        } else if (!mapped.fields['name']) {
          setCreateFormErrors([toUserMessage(err)]);
        }
        return { ok: false };
      }

      setCreateFormErrors([toUserMessage(err)]);
      return { ok: false };
    }
  }

  function startRename(category: Category) {
    setEditingId(category.id);
    setEditValue(category.name);
    setEditError(undefined);
  }

  function cancelRename() {
    setEditingId(null);
    setEditValue('');
    setEditError(undefined);
  }

  function onEditValueChange(nextValue: string) {
    setEditValue(nextValue);
    if (editError) {
      setEditError(validateCategoryName(nextValue));
    }
  }

  async function submitRename(category: Category): Promise<ActionOutcome> {
    if (renameMutation.submitting) {
      return { ok: false };
    }

    const validationError = validateCategoryName(editValue);
    if (validationError) {
      setEditError(validationError);
      editInputRef.current?.focus();
      return { ok: false };
    }

    const trimmed = editValue.trim();
    if (trimmed === category.name.trim()) {
      cancelRename();
      return { ok: false };
    }

    setEditError(undefined);

    try {
      await renameMutation.run({ id: category.id, name: trimmed });
      cancelRename();
      refreshCategories();
      return { ok: true };
    } catch (err: unknown) {
      if (isApiError(err) && Object.keys(err.fieldErrors).length > 0) {
        const mapped = mapFieldErrors(err.fieldErrors, ['name']);
        setEditError(mapped.fields['name'] ?? mapped.summary[0] ?? toUserMessage(err));
      } else {
        setEditError(toUserMessage(err));
      }
      editInputRef.current?.focus();
      return { ok: false };
    }
  }

  function requestDelete(category: Category) {
    setDeleteTarget(category);
  }

  function cancelDelete() {
    if (!deleteMutation.submitting) {
      setDeleteTarget(null);
    }
  }

  function dismissConflictBanner() {
    setConflictBanner(null);
  }

  async function confirmDelete(): Promise<ActionOutcome> {
    if (!deleteTarget || deleteMutation.submitting) {
      return { ok: false };
    }

    const targetId = deleteTarget.id;
    setConflictBanner(null);

    try {
      await deleteMutation.run(targetId);
      setDeleteTarget(null);
      if (editingId === targetId) {
        cancelRename();
      }
      refreshCategories();
      return { ok: true };
    } catch (err: unknown) {
      setDeleteTarget(null);
      const message = toUserMessage(err);
      if (isApiError(err) && err.status === 409) {
        setConflictBanner(message);
      }
      return { ok: false, message };
    }
  }

  return {
    categoriesResource,
    loadErrorMessage:
      categoriesResource.status === 'error' ? toUserMessage(categoriesResource.error) : null,
    newName,
    createFieldError,
    createFormErrors,
    createInputRef,
    creating: createMutation.submitting,
    onNewNameChange,
    onNewNameBlur,
    submitCreate,
    editingId,
    editValue,
    editError,
    editInputRef,
    renaming: renameMutation.submitting,
    startRename,
    cancelRename,
    onEditValueChange,
    submitRename,
    deleteTarget,
    deleting: deleteMutation.submitting,
    conflictBanner,
    dismissConflictBanner,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
