import React, { useState } from 'react';
import { ElementDTO } from './instructionsMockData'; // Adjust the import path

const AttributeData: React.FC<{ elementDTO: ElementDTO; onChange?: (value: string) => void }> = ({
  elementDTO,
  onChange,
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState(elementDTO.attributeValue || null);

  if (!elementDTO || !elementDTO.attributeData) {
    return <div>Error: Invalid elementDTO</div>;
  }

  return (
    <div className="attributes-dropdown-wrapper">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ color: "#b163ff", marginRight: '5px' }}># Attributes:</span>
        <select
          className="attributes-dropdown"
          value={selectedAttribute || ""}
          onChange={(e) => {
            const selectedValue = e.target.value;
            setSelectedAttribute(selectedValue);
            if (onChange) {
              onChange(selectedValue);
            }
          }}
        >
          {elementDTO.attributeData.length === 0 ? (
            <option value="-1">no attributes</option>
          ) : (
            elementDTO.attributeData.map((attr, idx) => (
              <option key={idx} value={attr.value}>
                {attr.name}
              </option>
            ))
          )}
        </select>
        {selectedAttribute && (
          <div style={{ marginLeft: '10px' }}>
            <span>Value:</span>
            <span style={{ color: "#ffffff", backgroundColor: "#b163ff", padding: "5px", borderRadius: "5px", marginLeft: '5px' }}>
              {selectedAttribute}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeData;