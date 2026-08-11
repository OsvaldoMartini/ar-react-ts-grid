import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PageMappingsOcrReviewPanel from './PageMappingsOcrReviewPanel';
import type { PageMappingsOcrReviewResult } from './PageMappingsOcrReview.types';

const result = (
  requestId: string,
  clientNamed: string | null,
  ocrText: string,
): PageMappingsOcrReviewResult => ({
  contractVersion: 1,
  requestId,
  bindingEpoch: 'binding-a',
  workspaceEpoch: 4,
  homeBankingId: 2,
  botJobId: 32,
  scanId: 'scan-a',
  pageKey: 'url-v1:page-a',
  capturedAt: '2026-08-11T12:00:00Z',
  manifestSha256: 'a'.repeat(64),
  source: 'selected-capture',
  wordCount: 0,
  counts: { EXACT_CONTAIN: 1, OVERLAP: 0, PROXIMITY: 0, NONE: 0 },
  rows: [{
    elementIndex: 0,
    scannedElementId: 672,
    elementHash: 'b'.repeat(64),
    expectedLastScannedAt: '2026-08-11 11:18:23',
    expectedScanCount: 26,
    definedName: 'bancastato',
    clientNamed,
    quality: 'EXACT_CONTAIN',
    tag: 'span',
    domText: 'BancaStato',
    ocrText,
    xPath: '/html/body/span[1]',
    iFrameXPath: '',
    confidence: 98,
  }],
  words: [],
  message: 'OCR Review completed.',
});

const panel = (review: PageMappingsOcrReviewResult, onApply = jest.fn()) => (
  <PageMappingsOcrReviewPanel
    result={review}
    captureImage={null}
    busy={false}
    applying={false}
    message=""
    canRun
    onRun={jest.fn()}
    onApply={onApply}
  />
);

test('keeps a saved client name as the proposal and does not select OCR overwrite after Run again', () => {
  const view = render(panel(result('review-1', 'Banca Stato', '€ BancaStato')));

  expect(screen.getByRole('textbox', { name: 'Proposed name for bancastato' }))
    .toHaveValue('Banca Stato');
  expect(screen.getByRole('checkbox', { name: 'Use OCR name for Banca Stato' }))
    .not.toBeChecked();
  expect(screen.getByRole('button', { name: 'Apply names (0)' })).toBeDisabled();

  view.rerender(panel(result('review-2', 'Banca Stato', '€€ BancaStato')));

  expect(screen.getByRole('textbox', { name: 'Proposed name for bancastato' }))
    .toHaveValue('Banca Stato');
  expect(screen.getByRole('checkbox', { name: 'Use OCR name for Banca Stato' }))
    .not.toBeChecked();
});

test('still proposes and selects OCR text when no client name exists', () => {
  render(panel(result('review-1', null, 'Banca Stato')));

  expect(screen.getByRole('textbox', { name: 'Proposed name for bancastato' }))
    .toHaveValue('Banca Stato');
  expect(screen.getByRole('checkbox', { name: 'Use OCR name for bancastato' }))
    .toBeChecked();
  expect(screen.getByRole('button', { name: 'Apply names (1)' })).toBeEnabled();

  fireEvent.change(screen.getByRole('textbox', { name: 'Proposed name for bancastato' }), {
    target: { value: 'Banca Stato Login' },
  });
  expect(screen.getByRole('checkbox', { name: 'Use OCR name for bancastato' }))
    .toBeChecked();
});
