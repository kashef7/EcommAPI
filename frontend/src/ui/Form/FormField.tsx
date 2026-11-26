import { cloneElement, isValidElement, type ComponentChildren, type VNode } from 'preact';
import { useId } from 'preact/hooks';
import { Icon } from '../Icon/Icon';
import { CircleAlert } from '../Icon/icons';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import styles from './Form.module.css';

export interface FormFieldA11yProps {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: 'true';
}

export interface FormFieldProps {
  readonly id?: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly class?: string;
  readonly children: ComponentChildren | ((props: FormFieldA11yProps) => VNode);
}

export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  class: className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedByIds = [hint ? hintId : null, error ? errorId : null].filter(Boolean);
  const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

  const a11yProps: FormFieldA11yProps = {
    id: fieldId,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(error ? { 'aria-invalid': 'true' as const } : {}),
  };

  let controlNode: ComponentChildren;
  if (typeof children === 'function') {
    controlNode = children(a11yProps);
  } else if (isValidElement(children)) {
    const existingDescribedBy = (children.props as Record<string, unknown>)['aria-describedby'];
    const mergedDescribedBy = [
      typeof existingDescribedBy === 'string' ? existingDescribedBy : null,
      describedBy ?? null,
    ]
      .filter(Boolean)
      .join(' ');

    controlNode = cloneElement(children, {
      id: (children.props as Record<string, unknown>)['id'] ?? fieldId,
      ...(mergedDescribedBy ? { 'aria-describedby': mergedDescribedBy } : {}),
      ...(error ? { 'aria-invalid': 'true' } : {}),
    });
  } else {
    controlNode = children;
  }

  return (
    <div class={`${styles.field}${className ? ` ${className}` : ''}`}>
      <label class={styles.label} htmlFor={fieldId}>
        <span>{label}</span>
        {required ? (
          <>
            <span class={styles.requiredMark} aria-hidden="true">
              *
            </span>
            <VisuallyHidden> (required)</VisuallyHidden>
          </>
        ) : null}
      </label>

      {controlNode}

      {hint ? (
        <p id={hintId} class={styles.hint}>
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" class={styles.error}>
          <Icon icon={CircleAlert} size={16} class={styles.errorIcon} />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
