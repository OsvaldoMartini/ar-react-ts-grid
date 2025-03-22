import React, { useState, useEffect, useRef } from "react";
import './attribute-dropdown.scss';

interface Names {
  name: string;
  value: string;
}

interface NameDropdownProps {
  dataArray: Names[];
  onChange?: (value: string) => void;
}

const AttributeDropdown: React.FC<NameDropdownProps> = ({ dataArray, onChange }) => {
  const findBestAttribute = () => {
    if (!dataArray?.length) return null;

    const attributeMap = new Map(dataArray.map(attr => [attr.name.toLowerCase(), attr.value]));

    return attributeMap.get("id") ||
      attributeMap.get("name") ||
      attributeMap.get("type") ||
      dataArray[0].value; // Default to the first available attribute
  };

  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(findBestAttribute);
  const valueRef = useRef<HTMLSpanElement>(null);
  const [overflowActive, setOverflowActive] = useState(false);

  useEffect(() => {
    setSelectedAttribute(findBestAttribute());
  }, [dataArray]);

  useEffect(() => {
    if (valueRef.current) {
      const element = valueRef.current;
      setOverflowActive(element.scrollWidth > element.clientWidth);
    }
  }, [selectedAttribute]);

  if (!Array.isArray(dataArray)) {
    return <div>Error: Invalid data array</div>;
  }

  return (
    <div className="attributes-dropdown-wrapper">
      <div className="attributes-dropdown-flex-container">
        <select
          className="attributes-dropdown"
          value={selectedAttribute || ""}
          onChange={(e) => {
            const selectedValue = e.target.value;
            setSelectedAttribute(selectedValue);
            onChange?.(selectedValue);
          }}
        >
          {dataArray.length === 0 ? (
            <option value="-1">no names</option>
          ) : (
            dataArray.map((attr, idx) => (
              <option key={idx} value={attr.value} title={attr.value}>
                {attr.name}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
};

export default AttributeDropdown;
