import React from 'react';
import './alert-modal.scss';
import { ComplexMessage } from './instructionsMockData'; // Assuming your file for ComplexMessage

interface AlertModalProps {
  header: string;             // Header message
  body: string | ComplexMessage[];    // Body message, can be string or array of ComplexMessage
  extraMsg: string;             // Footer message
  onClose: () => void;        // Close function
  onConfirm?: () => void;     // Optional: confirm function (shows Confirm + Cancel buttons)
  imageSrc: string;           // Pass the image source from outside
  imageClass?: string;        // Optional: pass a CSS class for the image
  error: boolean;             // Determines if the footer is red (error) or blue (success)
}

const AlertModal: React.FC<AlertModalProps> = ({ header, body, extraMsg, onClose, onConfirm, imageSrc, imageClass, error }) => {
  const renderBody = () => {
    if (Array.isArray(body)) {
      return (
        <div className="alert-body is-array">
          <table className="complex-message-table">
            <tbody>
              {body.map((item, index) => (
                <tr key={index} className="complex-message-row">
                  <td>{item.parentNameWithId}</td>
                  <td>{item.connectionLabel}</td>
                  <td>{item.actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <p className={`alert-body ${error ? 'error' : 'success'}`}>{body}</p>;
  };

  return (
    <div className="alert-modal">
      <div className="alert-content">
        {/* Use the passed image class if provided; otherwise, default */}
        <img src={imageSrc} alt="Alert Image" className={imageClass || 'default-image-class'} />

        {/* Display message header */}
        <h3 className="alert-header">{header}</h3>

        {/* Display message body */}
        {renderBody()}

        {/* Display message footer */}
        <div className={`alert-footer ${error ? 'error' : 'success'}`}>
          <p>{extraMsg}</p>
        </div>

        {/* Buttons */}
        {onConfirm ? (
          <div className="alert-buttons">
            <button onClick={onConfirm} className="confirm-btn">Confirm</button>
            <button onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        ) : (
          <button onClick={onClose} className="close-btn">Close</button>
        )}
      </div>
    </div>
  );
};

export default AlertModal;
