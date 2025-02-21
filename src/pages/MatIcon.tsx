import React from 'react';

interface MatIconProps {
  icon: string;
  testId: string;
  className?: string;
}

const MatIcon: React.FC<MatIconProps> = ({ icon, testId, className = '' }) => {
  return (
    <span
      role="img"
      aria-hidden="true"
      className={`material-icons ${className}`}
      data-testid={testId}
    >
      {icon}
    </span>
  );
};

export default MatIcon;
