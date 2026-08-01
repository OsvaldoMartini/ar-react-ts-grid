import type { MouseEvent, ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import styles from './RulesCard.module.scss';

export type RulesCardColor = 'green' | 'red' | 'orange' | 'blue';

export interface RulesCardEvent {
  color: RulesCardColor;
  rules: string;
  context?: string;
  label?: string;
  ts: number;
}

interface RulesCardProps {
  event: RulesCardEvent | null;
  className?: string;
  ariaLabel?: string;
  compactLabel?: string;
  glow?: boolean;
  border?: boolean;
  animate?: boolean;
  pulse?: boolean;
  icon?: boolean;
  iconNode?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  ariaPressed?: boolean;
  title?: string;
  disabled?: boolean;
}

export function RulesCard({
  event,
  className,
  ariaLabel,
  compactLabel,
  glow = true,
  border = false,
  animate = true,
  pulse = false,
  icon = true,
  iconNode,
  onClick,
  ariaPressed,
  title,
  disabled = false,
}: RulesCardProps) {
  if (!event) return null;

  const DefaultIcon = event.color === 'red' ? XCircle : CheckCircle2;
  const rootClassName = [
    styles.badge,
    styles[event.color],
    !glow && styles.noGlow,
    border && styles.withBorder,
    !animate && styles.static,
    pulse && styles.pulse,
    onClick && styles.interactive,
    className,
  ].filter(Boolean).join(' ');
  const iconElement = icon ? (
    iconNode != null
      ? <span className={styles.icon}>{iconNode}</span>
      : <DefaultIcon className={styles.icon} />
  ) : null;
  const content = (
    <>
      {iconElement}
      <span className={styles.label}>
        {event.context && <strong>{event.context}</strong>}
        <span
          className={`${styles.rules} ${compactLabel ? styles.rulesWithCompact : ''}`}
        >
          {event.rules}
        </span>
        {compactLabel && (
          <span className={styles.compactRules}>{compactLabel}</span>
        )}
        {event.label && <span>{event.label}</span>}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        key={event.ts}
        type="button"
        className={rootClassName}
        aria-label={ariaLabel}
        onClick={onClick}
        aria-pressed={ariaPressed}
        title={title}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      key={event.ts}
      className={rootClassName}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      title={title}
    >
      {content}
    </div>
  );
}
