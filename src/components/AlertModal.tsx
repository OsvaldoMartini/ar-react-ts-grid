import React from 'react';
import './alert-modal.scss';

interface AlertModalProps {
  message: string;
  onClose: () => void;
  imageSrc: string;           // Pass the image source from outside
  imageClass?: string;        // Optional: pass a CSS class for the image
}

const AlertModal: React.FC<AlertModalProps> = ({ message, onClose, imageSrc, imageClass }) => {
  return (
    <div className="alert-modal">
      <div className="alert-content">
        {/* Use the passed image class if provided; otherwise, default */}
        <img src={imageSrc} alt="Alert Image" className={imageClass || 'default-image-class'} />
        <p>{message}</p>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default AlertModal;
