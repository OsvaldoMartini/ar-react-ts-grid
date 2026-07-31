import { instructionCommandPresentation } from './instructionCommandPresentation';

describe('instructionCommandPresentation', () => {
  test.each([
    ['I:text:hidden', null, 'I', 'Input Field', 'INPUT', true],
    ['C', null, 'C', 'Click', 'CLICK', false],
    ['CLICK', null, 'CLICK', 'Click', 'CLICK', false],
    ['O', null, 'O', 'OutPut', 'OUTPUT', false],
    ['SET', null, 'SET', 'SetValue', 'SET_VALUE', false],
    ['GET', null, 'GET', 'GetValue', 'GET_VALUE', false],
    ['CK', null, 'CK', 'CheckValue', 'CHECK', false],
    ['E', null, 'E', 'ExcelWrite', 'EXCEL', false],
    ['H', null, 'H', 'Wait', 'WAIT', false],
    ['HOLD', null, 'H', 'Wait', 'WAIT', false],
    ['WAIT', null, 'WAIT', 'Wait', 'WAIT', false],
    ['P', null, 'P', 'Screenshot', 'SCREENSHOT', false],
    ['SCREEN', null, 'P', 'Screenshot', 'SCREENSHOT', false],
    ['Q', null, 'Q', 'Close Browser', 'CLOSE_BROWSER', false],
    ['QUIT', null, 'Q', 'Close Browser', 'CLOSE_BROWSER', false],
    ['IF', null, 'IF', 'IF', 'CONDITIONAL', false],
    ['ELSEIF', null, 'ELSEIF', 'Else If', 'CONDITIONAL', false],
    ['ELSE', null, 'ELSE', 'Else', 'ELSE', false],
    ['ENDIF', null, 'ENDIF', 'End If', 'ENDIF', false],
    ['LOOP', null, 'LOOP', 'Loop', 'REFRESH', false],
    ['REFRESH_LOOP', null, 'REFRESH_LOOP', 'Refresh Loop', 'REFRESH_LOOP', false],
    ['REFRESH', null, 'REFRESH', 'Refresh', 'REFRESH', false],
    ['GOTO', null, 'GOTO', 'GOTO', 'GOTO', false],
    ['EXCEL GOTO', null, 'EXCEL GOTO', 'Excel GOTO', 'EXCEL_GOTO', false],
    ['NEXT ROW', null, 'NEXT ROW', 'Excel Data Next Row', 'EXCEL', false],
    ['NEXT_ENTER', null, 'NEXT_ENTER', 'Next / Enter', 'NEXT_ENTER', false],
    ['SWIPE_UP', null, 'SWIPE_UP', 'Swipe Up', 'SWIPE_UP', false],
    ['SWIPE_DOWN', null, 'SWIPE_DOWN', 'Swipe Down', 'SWIPE_DOWN', false],
    ['PAUSE', null, 'PAUSE', 'Pause', 'PAUSE', false],
    ['CSV CHECK', null, 'CSV CHECK', 'CSV Check', 'EXCEL_GOTO', false],
    ['PDF CHECK', null, 'PDF CHECK', 'PDF Check', 'EXCEL_GOTO', false],
    ['BACK', null, 'BACK', 'Back', 'NONE', false],
    ['C', 'a', 'A', 'Link', 'LINK', false],
  ])(
    'maps %s with tag %s',
    (
      action,
      tagName,
      canonicalAction,
      label,
      icon,
      hidden,
    ) => {
      expect(instructionCommandPresentation(action, tagName)).toEqual({
        canonicalAction,
        label,
        icon,
        hidden,
        known: true,
      });
    },
  );

  test('normalizes command casing and preserves an unknown command safely', () => {
    expect(instructionCommandPresentation('  get  ')).toMatchObject({
      canonicalAction: 'GET',
      label: 'GetValue',
      icon: 'GET_VALUE',
      known: true,
    });
    expect(instructionCommandPresentation('custom command')).toEqual({
      canonicalAction: 'CUSTOM COMMAND',
      label: 'CUSTOM COMMAND',
      icon: 'NONE',
      hidden: false,
      known: false,
    });
  });
});
