import React from 'react';
import './dom-review-modal.scss';

export interface DomReviewData {
  url: string;
  title: string;
  pcName: string;
  email: string;
  htmlSizeKb: number;
}

export type DomReviewAction = 'send' | 'save' | 'cancel';

interface DomReviewModalProps {
  data: DomReviewData;
  onAction: (action: DomReviewAction) => void;
}

const DomReviewModal: React.FC<DomReviewModalProps> = ({ data, onAction }) => {
  return (
    <div className="dom-review-overlay" onClick={() => onAction('cancel')}>
      <div className="dom-review-modal" onClick={e => e.stopPropagation()}>

        <div className="dom-review-header">
          <div className="dom-review-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="dom-review-titles">
            <h3>Send Pure HTML for Review</h3>
            <p>All personal data will be replaced with synthetic test data</p>
          </div>
        </div>

        <div className="dom-review-body">
          <div className="dom-review-details">
            <div className="dom-review-row">
              <span className="dom-review-label">PC</span>
              <span className="dom-review-value">{data.pcName}</span>
            </div>
            <div className="dom-review-row">
              <span className="dom-review-label">Email</span>
              <span className="dom-review-value">{data.email}</span>
            </div>
            <div className="dom-review-row">
              <span className="dom-review-label">URL</span>
              <span className="dom-review-value">{data.url}</span>
            </div>
            <div className="dom-review-row">
              <span className="dom-review-label">Title</span>
              <span className="dom-review-value">{data.title || '-'}</span>
            </div>
            <div className="dom-review-row">
              <span className="dom-review-label">Size</span>
              <span className="dom-review-value">{data.htmlSizeKb} KB</span>
            </div>
          </div>

          <div className="dom-review-info">
            <p className="dom-review-info-title">What happens</p>
            <p className="dom-review-info-text">
              The HTML is extracted and all personal data (names, IBANs, account numbers,
              amounts) is replaced with synthetic test data. Only the sanitized page
              structure is sent or saved — no real customer data leaves this machine.
            </p>
          </div>

          <div className="dom-review-divider" />

          <div className="dom-review-options">
            <div className="dom-review-option" onClick={() => onAction('send')}>
              <div className="dom-review-option-icon dom-review-option-icon-send">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div className="dom-review-option-body">
                <p className="dom-review-option-title">Send To Support</p>
                <p className="dom-review-option-desc">
                  Sanitize and send directly to the MultiPlugins support portal for review.
                </p>
              </div>
            </div>

            <div className="dom-review-option" onClick={() => onAction('save')}>
              <div className="dom-review-option-icon dom-review-option-icon-save">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="dom-review-option-body">
                <p className="dom-review-option-title">Create Local File</p>
                <p className="dom-review-option-desc">
                  Sanitize and save to local disk. You can review the file and send it
                  via email or drag &amp; drop on the Support Portal.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="dom-review-footer">
          <button className="dom-review-cancel" onClick={() => onAction('cancel')}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default DomReviewModal;
