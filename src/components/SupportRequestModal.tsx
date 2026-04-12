import React, { useState } from 'react';
import './support-request-modal.scss';

export interface SupportRequestData {
  url: string;
  pcName: string;
  email: string;
}

export type SupportRequestAction = 'send' | 'save' | 'cancel';

interface SupportRequestModalProps {
  data: SupportRequestData;
  onAction: (action: SupportRequestAction, message: string) => void;
}

const MAX_CHARS = 1000;

const SupportRequestModal: React.FC<SupportRequestModalProps> = ({ data, onAction }) => {
  const [message, setMessage] = useState('');
  const remaining = MAX_CHARS - message.length;
  const isEmpty = message.trim().length === 0;

  return (
    <div className="support-req-overlay" onClick={() => onAction('cancel', '')}>
      <div className="support-req-modal" onClick={e => e.stopPropagation()}>

        <div className="support-req-header">
          <div className="support-req-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="support-req-titles">
            <h3>Request Support</h3>
            <p>Describe your issue — the support team will review it</p>
          </div>
        </div>

        <div className="support-req-body">
          <div className="support-req-details">
            <div className="support-req-stripe" />
            <div className="support-req-details-body">
              <div className="support-req-row">
                <span className="support-req-label">PC</span>
                <span className="support-req-value">{data.pcName}</span>
              </div>
              <div className="support-req-row">
                <span className="support-req-label">Email</span>
                <span className="support-req-value">{data.email}</span>
              </div>
              <div className="support-req-row">
                <span className="support-req-label">URL</span>
                <span className="support-req-value">{data.url}</span>
              </div>
            </div>
          </div>

          <textarea
            className="support-req-textarea"
            placeholder="Describe your issue here... What happened? What did you expect?"
            value={message}
            onChange={e => {
              if (e.target.value.length <= MAX_CHARS) setMessage(e.target.value);
            }}
            maxLength={MAX_CHARS}
            autoFocus
          />
          <div className={`support-req-charcount${remaining <= 100 ? ' support-req-charcount-warn' : ''}${remaining <= 0 ? ' support-req-charcount-limit' : ''}`}>
            {remaining} / {MAX_CHARS}
          </div>

          <div className="support-req-options">
            <div
              className={`support-req-option support-req-option-send${isEmpty ? ' support-req-option-disabled' : ''}`}
              onClick={() => !isEmpty && onAction('send', message.trim())}
            >
              <div className="support-req-option-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
              <div className="support-req-option-body">
                <p className="support-req-option-title">Send To Support</p>
                <p className="support-req-option-desc">
                  Send your request directly to the MultiPlugins support team.
                </p>
              </div>
            </div>

            <div
              className={`support-req-option support-req-option-save${isEmpty ? ' support-req-option-disabled' : ''}`}
              onClick={() => !isEmpty && onAction('save', message.trim())}
            >
              <div className="support-req-option-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="support-req-option-body">
                <p className="support-req-option-title">Create Local File</p>
                <p className="support-req-option-desc">
                  Save as .support file. You can drag &amp; drop it on the Support Portal or send by email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="support-req-footer">
          <button className="support-req-cancel" onClick={() => onAction('cancel', '')}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default SupportRequestModal;
