import type { ReactNode } from 'react';
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
  glow?: boolean;
  border?: boolean;
  animate?: boolean;
  pulse?: boolean;
  icon?: boolean;
  iconNode?: ReactNode;
  onClick?: () => void;
  ariaPressed?: boolean;
  title?: string;
  disabled?: boolean;
}

export function RulesCard({
  event,
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
  const className = [
    styles.badge,
    styles[event.color],
    !glow && styles.noGlow,
    border && styles.withBorder,
    !animate && styles.static,
    pulse && styles.pulse,
    onClick && styles.interactive,
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
        <span className={styles.rules}>{event.rules}</span>
        {event.label && <span>{event.label}</span>}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        key={event.ts}
        type="button"
        className={className}
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
      className={className}
      role="status"
      aria-live="polite"
      title={title}
    >
      {content}
    </div>
  );
}
