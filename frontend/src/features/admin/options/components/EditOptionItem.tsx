import { useEffect, useRef, useState } from 'preact/hooks';
import { LIMITS } from '@/core/validation/validators';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { Check, Pencil, Plus, Trash2, X } from '@/ui/Icon/icons';
import { ADMIN_OPTIONS_COPY } from '../copy';
import {
  type AdminOptionModel,
  type AdminOptionValueModel,
  validateOptionNameInput,
  validateOptionValueInput,
} from '../model/option-validation';
import styles from './EditOptionsSection.module.css';

export interface EditOptionItemProps {
  readonly option: AdminOptionModel;
  readonly otherOptionNamesLower: readonly string[];
  readonly busy: boolean;
  readonly onRenameOption: (optionId: string, name: string) => Promise<string | undefined>;
  readonly onDeleteOption: (option: AdminOptionModel) => void;
  readonly onAddValue: (optionId: string, value: string) => Promise<string | undefined>;
  readonly onRenameValue: (
    optionId: string,
    valueId: string,
    value: string,
  ) => Promise<string | undefined>;
  readonly onDeleteValue: (option: AdminOptionModel, valueItem: AdminOptionValueModel) => void;
}

export function EditOptionItem({
  option,
  otherOptionNamesLower,
  busy,
  onRenameOption,
  onDeleteOption,
  onAddValue,
  onRenameValue,
  onDeleteValue,
}: EditOptionItemProps) {
  const [editingOption, setEditingOption] = useState(false);
  const [optionNameDraft, setOptionNameDraft] = useState(option.name);
  const [optionNameError, setOptionNameError] = useState<string | undefined>(undefined);
  const [renamingOption, setRenamingOption] = useState(false);
  const optionNameInputRef = useRef<HTMLInputElement | null>(null);

  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [valueDraft, setValueDraft] = useState('');
  const [valueError, setValueError] = useState<string | undefined>(undefined);
  const [renamingValue, setRenamingValue] = useState(false);
  const valueInputRef = useRef<HTMLInputElement | null>(null);

  const [newValueDraft, setNewValueDraft] = useState('');
  const [newValueError, setNewValueError] = useState<string | undefined>(undefined);
  const [addingValue, setAddingValue] = useState(false);

  useEffect(() => {
    if (editingOption && optionNameInputRef.current) {
      optionNameInputRef.current.focus();
      optionNameInputRef.current.select();
    }
  }, [editingOption]);

  useEffect(() => {
    if (editingValueId && valueInputRef.current) {
      valueInputRef.current.focus();
      valueInputRef.current.select();
    }
  }, [editingValueId]);

  async function saveOptionRename() {
    if (renamingOption) return;
    const err = validateOptionNameInput(optionNameDraft, otherOptionNamesLower);
    if (err) {
      setOptionNameError(err);
      optionNameInputRef.current?.focus();
      return;
    }
    const trimmed = optionNameDraft.trim();
    if (trimmed === option.name.trim()) {
      setEditingOption(false);
      setOptionNameError(undefined);
      return;
    }
    setRenamingOption(true);
    const serverErr = await onRenameOption(option.id, trimmed);
    setRenamingOption(false);
    if (serverErr) {
      setOptionNameError(serverErr);
      optionNameInputRef.current?.focus();
      return;
    }
    setEditingOption(false);
    setOptionNameError(undefined);
  }

  async function saveValueRename(valueItem: AdminOptionValueModel) {
    if (renamingValue) return;
    const otherValues = option.values.filter((v) => v.id !== valueItem.id).map((v) => v.value);
    const err = validateOptionValueInput(valueDraft, otherValues);
    if (err) {
      setValueError(err);
      valueInputRef.current?.focus();
      return;
    }
    const trimmed = valueDraft.trim();
    if (trimmed === valueItem.value.trim()) {
      setEditingValueId(null);
      setValueError(undefined);
      return;
    }
    setRenamingValue(true);
    const serverErr = await onRenameValue(option.id, valueItem.id, trimmed);
    setRenamingValue(false);
    if (serverErr) {
      setValueError(serverErr);
      valueInputRef.current?.focus();
      return;
    }
    setEditingValueId(null);
    setValueError(undefined);
  }

  async function submitNewValue() {
    if (addingValue) return;
    const existingValues = option.values.map((v) => v.value);
    const err = validateOptionValueInput(newValueDraft, existingValues);
    if (err) {
      setNewValueError(err);
      return;
    }
    setAddingValue(true);
    const serverErr = await onAddValue(option.id, newValueDraft.trim());
    setAddingValue(false);
    if (serverErr) {
      setNewValueError(serverErr);
      return;
    }
    setNewValueDraft('');
    setNewValueError(undefined);
  }

  return (
    <div class={styles.optionCard}>
      {editingOption ? (
        <form
          class={styles.inlineEditForm}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void saveOptionRename();
          }}
        >
          <FormField
            label={ADMIN_OPTIONS_COPY.edit.renameFieldLabel}
            {...(optionNameError ? { error: optionNameError } : {})}
            required
          >
            <Input
              type="text"
              maxLength={LIMITS.optionNameMax}
              value={optionNameDraft}
              inputRef={optionNameInputRef}
              disabled={renamingOption}
              onInput={(event) => {
                setOptionNameDraft(event.currentTarget.value);
                if (optionNameError) setOptionNameError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setEditingOption(false);
                  setOptionNameError(undefined);
                }
              }}
            />
          </FormField>
          <div class={styles.inlineEditBtns}>
            <Button
              type="submit"
              variant="primary"
              loading={renamingOption}
              leadingIcon={<Icon icon={Check} size={16} />}
            >
              {renamingOption
                ? ADMIN_OPTIONS_COPY.edit.savingLabel
                : ADMIN_OPTIONS_COPY.edit.saveLabel}
            </Button>
            <Button
              variant="secondary"
              disabled={renamingOption}
              leadingIcon={<Icon icon={X} size={16} />}
              onClick={() => {
                setEditingOption(false);
                setOptionNameError(undefined);
              }}
            >
              {ADMIN_OPTIONS_COPY.edit.cancelLabel}
            </Button>
          </div>
        </form>
      ) : (
        <div class={styles.optionHeader}>
          <h3 class={styles.optionTitle}>{option.name}</h3>
          <div class={styles.inlineActions}>
            <IconButton
              label={ADMIN_OPTIONS_COPY.edit.renameOptionAria(option.name)}
              variant="quiet"
              disabled={busy}
              onClick={() => {
                setOptionNameDraft(option.name);
                setOptionNameError(undefined);
                setEditingOption(true);
              }}
            >
              <Icon icon={Pencil} size={16} />
            </IconButton>
            <IconButton
              label={ADMIN_OPTIONS_COPY.edit.deleteOptionAria(option.name)}
              variant="danger"
              disabled={busy}
              onClick={() => onDeleteOption(option)}
            >
              <Icon icon={Trash2} size={16} />
            </IconButton>
          </div>
        </div>
      )}

      <ul class={styles.valuesList}>
        {option.values.map((val) => {
          const isEditingVal = editingValueId === val.id;
          return (
            <li key={val.id}>
              {isEditingVal ? (
                <form
                  class={styles.inlineEditForm}
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveValueRename(val);
                  }}
                >
                  <FormField
                    label={ADMIN_OPTIONS_COPY.edit.renameValueFieldLabel}
                    {...(valueError ? { error: valueError } : {})}
                    required
                  >
                    <Input
                      type="text"
                      maxLength={LIMITS.optionValueMax}
                      value={valueDraft}
                      inputRef={valueInputRef}
                      disabled={renamingValue}
                      onInput={(event) => {
                        setValueDraft(event.currentTarget.value);
                        if (valueError) setValueError(undefined);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          event.preventDefault();
                          setEditingValueId(null);
                          setValueError(undefined);
                        }
                      }}
                    />
                  </FormField>
                  <div class={styles.inlineEditBtns}>
                    <Button type="submit" variant="primary" loading={renamingValue}>
                      {renamingValue
                        ? ADMIN_OPTIONS_COPY.edit.savingLabel
                        : ADMIN_OPTIONS_COPY.edit.saveLabel}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={renamingValue}
                      onClick={() => {
                        setEditingValueId(null);
                        setValueError(undefined);
                      }}
                    >
                      {ADMIN_OPTIONS_COPY.edit.cancelLabel}
                    </Button>
                  </div>
                </form>
              ) : (
                <span class={styles.valuePill}>
                  <span class={styles.valueText}>{val.value}</span>
                  <IconButton
                    label={ADMIN_OPTIONS_COPY.edit.renameValueAria(val.value)}
                    variant="quiet"
                    disabled={busy}
                    onClick={() => {
                      setEditingValueId(val.id);
                      setValueDraft(val.value);
                      setValueError(undefined);
                    }}
                  >
                    <Icon icon={Pencil} size={16} />
                  </IconButton>
                  <IconButton
                    label={ADMIN_OPTIONS_COPY.edit.deleteValueAria(val.value)}
                    variant="danger"
                    disabled={busy}
                    onClick={() => onDeleteValue(option, val)}
                  >
                    <Icon icon={Trash2} size={16} />
                  </IconButton>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <form
        class={styles.addValueForm}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitNewValue();
        }}
      >
        <div class={styles.addValueInputWrap}>
          <FormField
            label={ADMIN_OPTIONS_COPY.edit.addValueLabel}
            {...(newValueError ? { error: newValueError } : {})}
          >
            <Input
              type="text"
              maxLength={LIMITS.optionValueMax}
              placeholder={ADMIN_OPTIONS_COPY.edit.addValuePlaceholder}
              value={newValueDraft}
              disabled={busy || addingValue}
              onInput={(event) => {
                setNewValueDraft(event.currentTarget.value);
                if (newValueError) setNewValueError(undefined);
              }}
            />
          </FormField>
        </div>
        <Button
          type="submit"
          variant="secondary"
          loading={addingValue}
          disabled={busy}
          leadingIcon={<Icon icon={Plus} size={16} />}
        >
          {addingValue
            ? ADMIN_OPTIONS_COPY.edit.addingValueButton
            : ADMIN_OPTIONS_COPY.edit.addValueButton}
        </Button>
      </form>
    </div>
  );
}
