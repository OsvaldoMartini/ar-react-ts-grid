import React, { useState } from 'react';
import './alert-modal.scss';
import constructionImage from '../assets/construction.png';

interface AlertModalProps {
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => {
  return (
    <div className="alert-modal">
      <div className="alert-content">
        <img src={constructionImage} alt="Under Construction" className="construction-image" />

        <p>{message}</p>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default AlertModal;
