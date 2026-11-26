import { LIMITS } from '@/core/validation/validators';
import { Button } from '@/ui/Button/Button';
import { IconButton } from '@/ui/Button/IconButton';
import { FormField } from '@/ui/Form/FormField';
import { Input } from '@/ui/Form/Input';
import { Icon } from '@/ui/Icon/Icon';
import { Plus, Trash2 } from '@/ui/Icon/icons';
import { ADMIN_OPTIONS_COPY } from '../copy';
import type { OptionDraft, OptionDraftError } from '../model/option-validation';
import styles from './CreateOptionsSection.module.css';
import { OptionValuesChipInput } from './OptionValuesChipInput';

export interface CreateOptionsSectionProps {
  readonly options: readonly OptionDraft[];
  readonly optionErrors: Readonly<Record<number, OptionDraftError>>;
  readonly disabled?: boolean;
  readonly onAddOption: () => void;
  readonly onRemoveOption: (index: number) => void;
  readonly onRenameOption: (index: number, name: string) => void;
  readonly onChangeValues: (index: number, values: readonly string[]) => void;
}

export function CreateOptionsSection({
  options,
  optionErrors,
  disabled = false,
  onAddOption,
  onRemoveOption,
  onRenameOption,
  onChangeValues,
}: CreateOptionsSectionProps) {
  return (
    <div class={styles.stack}>
      <div class={styles.headerRow}>
        <h2>{ADMIN_OPTIONS_COPY.heading}</h2>
        <Button
          variant="secondary"
          disabled={disabled}
          leadingIcon={<Icon icon={Plus} size={16} />}
          onClick={onAddOption}
        >
          {ADMIN_OPTIONS_COPY.addOptionButton}
        </Button>
      </div>

      {options.length === 0 ? (
        <p class={styles.singleNote}>{ADMIN_OPTIONS_COPY.singleVersionNote}</p>
      ) : (
        options.map((option, index) => {
          const rowError = optionErrors[index];
          return (
            <div key={option.localId} class={styles.optionCard}>
              <div class={styles.optionTop}>
                <div class={styles.nameWrap}>
                  <FormField
                    label={ADMIN_OPTIONS_COPY.optionNameLabel}
                    {...(rowError?.name ? { error: rowError.name } : {})}
                    required
                  >
                    <Input
                      type="text"
                      name={`options[${index}].name`}
                      maxLength={LIMITS.optionNameMax}
                      placeholder={ADMIN_OPTIONS_COPY.optionNamePlaceholder}
                      value={option.name}
                      disabled={disabled}
                      onInput={(event) => onRenameOption(index, event.currentTarget.value)}
                    />
                  </FormField>
                </div>

                <IconButton
                  label={ADMIN_OPTIONS_COPY.removeOptionAria(index)}
                  variant="danger"
                  disabled={disabled}
                  onClick={() => onRemoveOption(index)}
                >
                  <Icon icon={Trash2} size={16} />
                </IconButton>
              </div>

              <OptionValuesChipInput
                values={option.values}
                {...(rowError?.values ? { error: rowError.values } : {})}
                disabled={disabled}
                onChange={(nextValues) => onChangeValues(index, nextValues)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
