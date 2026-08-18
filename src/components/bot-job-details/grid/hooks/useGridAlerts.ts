import { useCallback, useState } from 'react';
import { ComplexMessage } from '../../../instructionsMockData';
import constructionImage from '../../../../assets/construction.png';
import type { AlertAlternateAction } from '../../../AlertModal';

export interface UseGridAlerts {
  errorFlag: boolean;
  setErrorFlag: React.Dispatch<React.SetStateAction<boolean>>;
  alertImage: string;
  setAlertImage: React.Dispatch<React.SetStateAction<string>>;
  alertClass: string;
  setAlertClass: React.Dispatch<React.SetStateAction<string>>;
  alertMessageHeader: string | null;
  setAlertMessageHeader: React.Dispatch<React.SetStateAction<string | null>>;
  alertMessageBody: string | ComplexMessage[];
  setAlertMessageBody: React.Dispatch<React.SetStateAction<string | ComplexMessage[]>>;
  alertMessageFooter: string | null;
  setAlertMessageFooter: React.Dispatch<React.SetStateAction<string | null>>;
  alertDismissed: boolean;
  setAlertDismissed: React.Dispatch<React.SetStateAction<boolean>>;
  pendingDeleteBlockId: number | null;
  setPendingDeleteBlockId: React.Dispatch<React.SetStateAction<number | null>>;
  alertOnConfirm: (() => void) | undefined;
  setAlertOnConfirm: React.Dispatch<React.SetStateAction<(() => void) | undefined>>;
  alertAlternateAction: AlertAlternateAction | undefined;
  setAlertAlternateAction: React.Dispatch<
    React.SetStateAction<AlertAlternateAction | undefined>
  >;
  /** Dismiss the alert / confirmation modal and reset its transient fields. */
  handleClose: () => void;
}

/**
 * Phase 6, step 3 — the Bot Job Details grid alert / confirmation modal state.
 * Owns every alert field, the delete-confirmation flow (pendingDeleteBlockId,
 * alertOnConfirm), and `handleClose`. Extracted verbatim from GridItem; returning
 * the individual setters keeps all ~40 GridItem call sites unchanged.
 */
export function useGridAlerts(): UseGridAlerts {
  const [errorFlag, setErrorFlag] = useState<boolean>(false);
  const [alertImage, setAlertImage] = useState<string>(constructionImage);
  const [alertClass, setAlertClass] = useState<string>('construction-image');
  const [alertMessageHeader, setAlertMessageHeaderState] = useState<string | null>(null);
  const [alertMessageBody, setAlertMessageBody] = useState<string | ComplexMessage[]>([]);
  const [alertMessageFooter, setAlertMessageFooter] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState<boolean>(false);
  const [pendingDeleteBlockId, setPendingDeleteBlockId] = useState<number | null>(null);
  const [alertOnConfirm, setAlertOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [alertAlternateAction, setAlertAlternateAction] = useState<
    AlertAlternateAction | undefined
  >(undefined);

  /**
   * Starting a new modal always invalidates actions owned by the previous
   * modal. Confirmation producers set their fresh callbacks after the header
   * in the same React batch.
   */
  const setAlertMessageHeader = useCallback<
    React.Dispatch<React.SetStateAction<string | null>>
  >((nextHeader) => {
    setAlertOnConfirm(undefined);
    setAlertAlternateAction(undefined);
    setAlertMessageHeaderState(nextHeader);
  }, []);

  const handleClose = useCallback(() => {
    setAlertDismissed(true); // Trigger re-execution of the effect
    setErrorFlag(false); // Reset error flag
    setAlertMessageHeader('');
    setAlertMessageBody('');
    setPendingDeleteBlockId(null);
    setAlertOnConfirm(undefined);
    setAlertAlternateAction(undefined);
  }, [setAlertMessageHeader]);

  return {
    errorFlag,
    setErrorFlag,
    alertImage,
    setAlertImage,
    alertClass,
    setAlertClass,
    alertMessageHeader,
    setAlertMessageHeader,
    alertMessageBody,
    setAlertMessageBody,
    alertMessageFooter,
    setAlertMessageFooter,
    alertDismissed,
    setAlertDismissed,
    pendingDeleteBlockId,
    setPendingDeleteBlockId,
    alertOnConfirm,
    setAlertOnConfirm,
    alertAlternateAction,
    setAlertAlternateAction,
    handleClose,
  };
}
