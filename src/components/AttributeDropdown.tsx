import React, { useState, useEffect, useRef } from "react";
import { ElementDTO } from "./instructionsMockData"; // Adjust the import path
import './attribute-dropdown.scss';

const AttributeDropdown: React.FC<{ elementDTO: ElementDTO; onChange?: (value: string) => void }> = ({
  elementDTO,
  onChange,
}) => {
  const findBestAttribute = () => {
    if (!elementDTO?.attributeData?.length) return elementDTO?.attributeValue || null;

    const attributeMap = new Map(elementDTO.attributeData.map(attr => [attr.name.toLowerCase(), attr.value]));

    return attributeMap.get("id") ||
      attributeMap.get("name") ||
      attributeMap.get("type") ||
      elementDTO.attributeData[0].value; // Default to the first available attribute
  };

  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(findBestAttribute);
  const valueRef = useRef<HTMLSpanElement>(null);
  const [overflowActive, setOverflowActive] = useState(false);

  useEffect(() => {
    setSelectedAttribute(findBestAttribute());
  }, [elementDTO.attributeData]);

  useEffect(() => {
    if (valueRef.current) {
      const element = valueRef.current;
      setOverflowActive(element.scrollWidth > element.clientWidth);
    }
  }, [selectedAttribute]);

  if (!elementDTO || !Array.isArray(elementDTO.attributeData)) {
    return <div>Error: Invalid element data</div>;
  }

  return (
    <div className="attributes-dropdown-wrapper">
      <div className="attributes-dropdown-flex-container">
        <span className="attributes-dropdown-label"># Attributes:</span>
        <select
          className="attributes-dropdown"
          value={selectedAttribute || ""}
          onChange={(e) => {
            const selectedValue = e.target.value;
            setSelectedAttribute(selectedValue);
            onChange?.(selectedValue);
          }}
        >
          {elementDTO.attributeData.length === 0 ? (
            <option value="-1">no attributes</option>
          ) : (
            elementDTO.attributeData.map((attr, idx) => (
              <option key={idx} value={attr.value} title={attr.value}>
                {attr.name}
              </option>
            ))
          )}
        </select>
        {selectedAttribute && (
          <div className="attribute-display-container">
            <span className="attribute-label">Value:</span>
            <span
              ref={valueRef}
              className={`attribute-display-value ${overflowActive ? "overflow-active" : ""}`}
            >
              {selectedAttribute}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttributeDropdown;
