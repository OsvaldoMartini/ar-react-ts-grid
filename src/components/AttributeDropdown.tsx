import React, { useState, useEffect } from "react";
import { ElementDTO } from "./instructionsMockData"; // Adjust the import path

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

  useEffect(() => {
    setSelectedAttribute(findBestAttribute());
  }, [elementDTO.attributeData]);

  if (!elementDTO || !Array.isArray(elementDTO.attributeData)) {
    return <div>Error: Invalid element data</div>;
  }

  return (
    <div className="attributes-dropdown-wrapper">
      <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}> {/* Added whiteSpace: "nowrap" */}
        <span style={{ color: "#0b5394", marginRight: "5px" }}># Attributes:</span>
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
              <option key={idx} value={attr.value}>
                {attr.name}
              </option>
            ))
          )}
        </select>
        {selectedAttribute && (
          <div style={{ marginLeft: "10px", maxWidth: "200px", overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap" }}>
            <span>Value:</span>
            <span
              style={{
                color: "#0b5394",
                backgroundColor: "#c3d3d9",
                padding: "5px",
                borderRadius: "5px",
                marginLeft: "5px",
              }}
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
