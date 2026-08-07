import React from 'react';
import { BlockLoopInstructionLoadDTO } from '../../instructionsMockData';
import { instructionDisplayLabel } from '../../instructionDisplay';
import setValueImage from '../../../assets/setValueBtn3.png';
import getValueImage from '../../../assets/getValueBtn3.png';
import checkImage from '../../../assets/check4.png';
import closeBrowserImage from '../../../assets/close-browser.png';
import excelImage from '../../../assets/excel.png';
import screenImage from '../../../assets/screen.png';
import waitImage from '../../../assets/wait.png';
import gotoImage from '../../../assets/goto8.png';
import excelGotoImage from '../../../assets/excel_goto2.png';
import nextRowImage from '../../../assets/excel.png';
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
import outPutImage from '../../../assets/output1.png';
import hiddenImage from '../../../assets/hidden-black.png';
import styles from './InstructionTypeBadge.module.scss';

export interface InstructionTypeBadgeProps {
  instruction: BlockLoopInstructionLoadDTO;
  findText: string;
  renderHighlighted: (text: string, query: string) => React.ReactNode;
}

/**
 * Renders an instruction's type icon + (highlightable) label, chosen from its
 * `actions`/`tagName`. Extracted verbatim from GridItem's getInstructionTypeElement.
 * `instructionDisplayLabel` is imported directly; find-highlighting is delegated
 * to the caller's `renderHighlighted` so this component owns no find state.
 */
const InstructionTypeBadge: React.FC<InstructionTypeBadgeProps> = ({
  instruction,
  findText,
  renderHighlighted,
}) => {
  let imageSrc: string | null = null;
  let text: string | null = null;
  let isActionBold = false;
  let imageClass: string = styles.operations; // Default class for images
  let hiddenField = false;

  const actionsRaw = (instruction.actions ?? '').trim();
  const tokens = actionsRaw.split(':').map(token => token.trim()).filter(Boolean);
  const baseAction = (tokens[0] ?? '').toUpperCase();
  const displayName = instructionDisplayLabel(instruction);

  if (instruction.actions.startsWith('I:')) {
    const actionParts: string[] = instruction.actions.split(':');
    imageSrc = inputImage;
    text = `(${instruction.id})${displayName}`;
    imageClass = styles.inputImage;
    if (actionParts.length === 3 && actionParts[2] === 'hidden') {
      hiddenField = true;
    }
  } else if ((instruction.tagName ?? '').toLowerCase() === 'a' || baseAction === 'A') {
    imageSrc = linkImage;
    text = `(${instruction.id})${displayName}`;
    imageClass = styles.linkImage;
  } else if (baseAction === 'O') {
    imageSrc = outPutImage;
    text = `(${instruction.id})${displayName}`;
    imageClass = styles.outputImage;
  } else if (baseAction === 'C') {
    imageSrc = clickImage;
    text = `(${instruction.id})${displayName}`;
    imageClass = styles.clickImage;
  } else {
    switch (instruction.actions) {
      case 'SET':
        imageSrc = setValueImage;
        text = displayName;
        break;
      case 'GET':
        imageSrc = getValueImage;
        text = displayName;
        break;
      case 'CK':
        imageSrc = checkImage;
        text = displayName;
        break;
      case 'CSV CHECK':
        imageSrc = excelGotoImage;
        text = displayName;
        break;
      case 'PDF CHECK':
        imageSrc = excelGotoImage;
        text = displayName;
        break;
      case 'E':
        imageSrc = excelImage;
        text = displayName;
        break;
      case 'P':
        imageSrc = screenImage;
        text = displayName;
        imageClass = styles.screenImage;
        break;
      case 'Q':
        imageSrc = closeBrowserImage;
        text = displayName;
        imageClass = styles.closeImage;
        break;
      case 'C':
        imageSrc = clickImage;
        text = `(${instruction.id})${displayName}`;
        imageClass = styles.clickImage;
        break;
      case 'H':
      case 'HOLD':
      case 'WAIT':
        imageSrc = waitImage;
        text = displayName;
        imageClass = styles.waitImage;
        break;
      case 'IF':
        imageSrc = ifElseImage;
        text = displayName;
        imageClass = styles.ifelseImage;
        break;
      case 'REFRESH':
        imageSrc = refreshOnlyImage;
        text = displayName;
        imageClass = styles.refreshImage;
        break;
      case 'LOOP':
        imageSrc = refreshOnlyImage;
        text = displayName;
        imageClass = styles.refreshImage;
        break;
      case 'NEXT_ENTER':
        imageSrc = nextEnterImage;
        text = 'NEXT/ENTER';
        imageClass = styles.refreshImage;
        break;
      case 'SWIPE_UP':
        imageSrc = swipeUpImage;
        text = 'SWIPE UP';
        imageClass = styles.refreshImage;
        break;
      case 'SWIPE_DOWN':
        imageSrc = swipeDownImage;
        text = 'SWIPE DOWN';
        imageClass = styles.refreshImage;
        break;
      case 'REFRESH_LOOP':
        imageSrc = refreshLoopImage;
        text = displayName;
        imageClass = styles.refreshImage;
        break;
      case 'GOTO':
        imageSrc = gotoImage;
        text = displayName;
        imageClass = styles.gotoImage;
        break;
      case 'EXCEL GOTO':
        imageSrc = excelGotoImage;
        text = displayName;
        break;
      case 'NEXT ROW':
        imageSrc = nextRowImage;
        text = 'Excel Data Next Row';
        break;
      case 'ELSEIF':
        imageSrc = ifElseImage;
        text = displayName;
        imageClass = styles.ifelseImage;
        break;
      case 'ELSE':
        imageSrc = elseImage;
        text = displayName;
        imageClass = styles.elseImage;
        break;
      case 'ENDIF':
        imageSrc = endIfImage;
        text = displayName;
        imageClass = styles.endifImage;
        break;
      case 'PAUSE':
        imageSrc = pauseImage;
        text = displayName;
        imageClass = styles.pauseImage;
        break;
      default:
        imageSrc = null; // No image for other types
        text = `(${instruction.id})${displayName}` || null;
        isActionBold = true; // Set bold for actions
    }
  }

  return (
    <div className={styles.instructionType}>
      {imageSrc && (
        <>
          <img src={imageSrc} alt="" className={imageClass} />
          {hiddenField && <img src={hiddenImage} alt="hidden" className={styles.hiddenImage} />}
          <span className={styles.displayName} title={text ?? undefined}>{text ? renderHighlighted(text, findText) : null}</span>
        </>
      )}
      {!imageSrc && (
        <span className={styles.displayName} title={text ?? undefined} style={{ fontWeight: isActionBold ? 'bold' : 'normal' }}>
          {text ? renderHighlighted(text, findText) : null}
        </span>
      )}
    </div>
  );
};

export default InstructionTypeBadge;
