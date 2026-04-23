import React from 'react';
import activeImage from '../assets/active3.png';
import inactiveImage from '../assets/inactive2.png';
import styles from './CompForce.module.scss';

/**
 * Canonical ordering of force_coordinates bits. Applied on every toggle so the
 * stored string is deterministic regardless of the click order. Must match the
 * backend's InputFlags canonical order (F → E → T → N → S — same bit layout
 * used by the Java engine migrated in 2026-04-26).
 */
export type ForceCoordFlag = "F" | "E" | "T" | "N" | "S";
const FORCE_COORD_ORDER: ForceCoordFlag[] = ["F", "E", "T", "N", "S"];

const hasFlag = (raw: string | null | undefined, flag: ForceCoordFlag) =>
  (raw ?? "").toUpperCase().includes(flag);

/** Toggle one bit and re-normalise to canonical order. */
const toggleFlag = (raw: string | null | undefined, flag: ForceCoordFlag): string => {
  const current = (raw ?? "").toUpperCase();
  const has = current.includes(flag);
  const next = has ? current.replace(flag, "") : current + flag;
  return FORCE_COORD_ORDER.filter(c => next.includes(c)).join("");
};

/**
 * Minimum shape the wrapped item must expose. All three real callers satisfy
 * it structurally — {@link BlockLoopInstructionLoadDTO} (GridItem),
 * {@link ComponentsInstructionsDTO} (GridItemComp), {@link ElementDTO}
 * (GridItemScann).
 */
export interface ForceCoordsItemLike {
  id: number;
  forceCoordinates?: string | null;
}

interface CompForceProps {
  item: ForceCoordsItemLike;
  /**
   * Fired when the user toggles a bit. The parent decides whether to persist
   * via WebSocket (GridItem / GridItemComp send FORCE_COORDINATES_UPDATE) or
   * only update local state (GridItemScann — the element isn't persisted yet).
   *
   * @param itemId                    the id field from the clicked row
   * @param nextForceCoordinates      the full re-normalised flag string
   * @param flag                      the bit that was just flipped
   */
  onChange: (itemId: number, nextForceCoordinates: string, flag: ForceCoordFlag) => void;
}

const ENTRIES: Array<{ flag: ForceCoordFlag; label: string; title: string; alt: string }> = [
  { flag: "S", label: "Scroll", title: "Scroll into view before type/click", alt: "scroll toggle" },
  { flag: "N", label: "Next (mobile)", title: "Next field (mobile)", alt: "next toggle" },
  { flag: "T", label: "Tab", title: "Tab after input", alt: "tab toggle" },
  { flag: "E", label: "Enter", title: "Enter after input", alt: "enter toggle" },
  { flag: "F", label: "Force Coordinates", title: "Force coordinates", alt: "force coord toggle" },
];

/**
 * Compact horizontal strip of five on/off badges representing the
 * {@code force_coordinates} bitstring on an instruction / scanned element.
 * Designed to sit inside the existing {@code .options-column} so the badges
 * render alongside the other row controls rather than on a second line.
 */
const CompForce: React.FC<CompForceProps> = ({ item, onChange }) => {
  const fc = item.forceCoordinates ?? "";

  return (
    <div className={styles.compForceRow}>
      {ENTRIES.map(({ flag, label, title, alt }) => {
        const on = hasFlag(fc, flag);
        return (
          <div
            key={flag}
            className={`${styles.toggle} ${on ? styles.active : styles.inactive}`}
            onClick={() => onChange(item.id, toggleFlag(fc, flag), flag)}
            role="button"
            tabIndex={0}
            title={title}
          >
            <span className={styles.label}>{label}</span>
            <img
              src={on ? activeImage : inactiveImage}
              alt={alt}
              className={styles.icon}
            />
          </div>
        );
      })}
    </div>
  );
};

export default CompForce;
