import React from 'react';
import setValueImage from '../../../assets/setValueBtn3.png';
import getValueImage from '../../../assets/getValueBtn3.png';
import checkImage from '../../../assets/check4.png';
import closeBrowserImage from '../../../assets/close-browser.png';
import excelImage from '../../../assets/excel.png';
import screenImage from '../../../assets/screen.png';
import waitImage from '../../../assets/wait.png';
import gotoImage from '../../../assets/goto8.png';
import excelGotoImage from '../../../assets/excel_goto2.png';
import ifElseImage from '../../../assets/ifElse.png';
import elseImage from '../../../assets/else6.png';
import endIfImage from '../../../assets/endIf4.png';
import pauseImage from '../../../assets/pause4.png';
import refreshOnlyImage from '../../../assets/refresh-only.png';
import nextEnterImage from '../../../assets/next_enter.png';
import swipeUpImage from '../../../assets/swipe_up.png';
import swipeDownImage from '../../../assets/swipe_down.png';
import refreshLoopImage from '../../../assets/refresh-loop.png';
import clickImage from '../../../assets/click.png';
import linkImage from '../../../assets/links-icon.png';
import inputImage from '../../../assets/input_field.png';
import outputImage from '../../../assets/output1.png';
import hiddenImage from '../../../assets/hidden-black.png';
import {
  instructionCommandPresentation,
  type InstructionCommandIcon,
} from './domain/instructionCommandPresentation';
import styles from './InstructionCommandBadge.module.scss';

const COMMAND_ICON_ASSETS: Readonly<
  Partial<Record<InstructionCommandIcon, string>>
> = Object.freeze({
  CHECK: checkImage,
  CLICK: clickImage,
  CLOSE_BROWSER: closeBrowserImage,
  CONDITIONAL: ifElseImage,
  ELSE: elseImage,
  ENDIF: endIfImage,
  EXCEL: excelImage,
  EXCEL_GOTO: excelGotoImage,
  GET_VALUE: getValueImage,
  GOTO: gotoImage,
  INPUT: inputImage,
  LINK: linkImage,
  NEXT_ENTER: nextEnterImage,
  OUTPUT: outputImage,
  PAUSE: pauseImage,
  REFRESH: refreshOnlyImage,
  REFRESH_LOOP: refreshLoopImage,
  SCREENSHOT: screenImage,
  SET_VALUE: setValueImage,
  SWIPE_DOWN: swipeDownImage,
  SWIPE_UP: swipeUpImage,
  WAIT: waitImage,
});

export interface InstructionCommandBadgeProps {
  action: string | null | undefined;
  tagName?: string | null;
  className?: string;
  label?: React.ReactNode;
  title?: string;
  iconOnly?: boolean;
}

/**
 * Generic command icon + descriptive label. It accepts the small field subset
 * shared by GridItem and Variables, rather than either workspace's full DTO.
 */
const InstructionCommandBadge: React.FC<InstructionCommandBadgeProps> = ({
  action,
  tagName,
  className,
  label,
  title,
  iconOnly = false,
}) => {
  const presentation = instructionCommandPresentation(action, tagName);
  const imageSrc = COMMAND_ICON_ASSETS[presentation.icon] ?? null;
  const visibleLabel = label ?? presentation.label;

  return (
    <span
      className={[styles.badge, className].filter(Boolean).join(' ')}
      data-command-action={presentation.canonicalAction}
      data-command-known={presentation.known ? 'true' : 'false'}
      title={title ?? presentation.label}
    >
      {imageSrc && (
        <span className={styles.iconStack} aria-hidden="true">
          <img
            src={imageSrc}
            alt=""
            className={styles.icon}
            data-command-icon={presentation.icon}
          />
          {presentation.hidden && (
            <img src={hiddenImage} alt="" className={styles.hiddenIcon} />
          )}
        </span>
      )}
      {!iconOnly && <span className={styles.label}>{visibleLabel}</span>}
    </span>
  );
};

export default InstructionCommandBadge;
