import React, { useState } from 'react';

interface ToggleItemProps {
  name: string;
  isActive: boolean;
  onToggle: (name: string) => void;
}

interface ToggleActiveProps {
  items: string[]; // List of items to toggle
}

const ToggleItem: React.FC<ToggleItemProps> = ({ name, isActive, onToggle }) => {
  return (
    <div
      onClick={() => onToggle(name)}
      style={{
        padding: "10px 20px",
        margin: "5px 0",
        border: "1px solid #ccc",
        borderRadius: "5px",
        cursor: "pointer",
        backgroundColor: isActive ? "#4CAF50" : "#f44336",
        color: "white",
        textAlign: "center",
      }}
    >
      {name} - {isActive ? "Active" : "Inactive"}
    </div>
  );
};

const ToggleActive: React.FC<ToggleActiveProps> = ({ items }) => {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const handleToggle = (name: string) => {
    setActiveItem((prev) => (prev === name ? null : name)); // Toggle active/inactive
  };

  return (
    <div>
      <h3>Toggle Active/Inactive</h3>
      {items.map((item) => (
        <ToggleItem
          key={item}
          name={item}
          isActive={activeItem === item}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
};

export default ToggleActive;
