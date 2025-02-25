import React, { useState, useEffect } from 'react';
import { ComplexMessage, ElementDTO } from './instructionsMockData';
import './griditem.scss';

import crossImage from '../assets/cross.png';
import saveImage from "../assets/save.png";
import constructionImage from '../assets/construction.png';

import AlertModal from './AlertModal';
import { useWebSocket } from './useWebSocket';
import AttributeDropdown from './AttributeDropdown';

interface GridItemScannProps {
  dataDTO: ElementDTO[];
  socketPort: number;
  sessionId: string;
  operationId: string;
}

const groupByTypeElement = (data: ElementDTO[]) => {
  return data.reduce((result, item) => {
    const { tagName } = item;
    if (!result[tagName]) {
      result[tagName] = { tagName, elements: [] };
    }
    result[tagName].elements.push(item);
    return result;
  }, {} as Record<string, { tagName: string; elements: ElementDTO[] }>);
};

const GridItemScann: React.FC<GridItemScannProps> = ({ dataDTO, socketPort, sessionId }) => {
  const { webSocket, messages } = useWebSocket(socketPort, sessionId);

  const [elementDTO, setElementDTO] = useState<ElementDTO[]>(dataDTO);
  const [elementGrouped, setElementGrouped] = useState<Record<string, { tagName: string; elements: ElementDTO[] }>>({});
  const [isElementGrouped, setIsElementGrouped] = useState<boolean>(false);

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (!isElementGrouped && elementDTO.length > 0) {
      setElementGrouped(groupByTypeElement(elementDTO));
      setIsElementGrouped(true);
    }
  }, [elementDTO, isElementGrouped]);

  const totalPages = Math.ceil(Object.keys(elementGrouped).length / rowsPerPage);
  const paginatedData = Object.entries(elementGrouped).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleCreateElementDTO = (elementDTO: ElementDTO) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
    webSocket.send(JSON.stringify({ type: "NEW_ELEMENT_DTO", sessionId: "unknown", details: [elementDTO] }));
  };

  const handleRemoveElementDTO = (elementDTO: ElementDTO) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) return;
    webSocket.send(JSON.stringify({ type: "DEL_ELEMENT_DTO", sessionId: "unknown", details: [elementDTO] }));
  };

  return (
    <div className="grid-container">
      {paginatedData.length === 0 ? (
        <div className="block">
          <div className="block-header">Scanned Web Elements</div>
          <div className="no-data-message">No data found</div>
        </div>
      ) : (
        <>
          <div className="pagination-controls">
            <label>Rows per page: </label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          {paginatedData.map(([typeElement, elementData], index) => (
            <div key={typeElement} className="block">
              <div className="block-header">
                <span className="block-order-number">#{index + 1}</span>
                <span className="block-name">{typeElement}</span>
                <span className="block-count">({elementData.elements.length})</span>
              </div>
              <div className="instructions-list">
                {elementData.elements.map((elementDTO, i) => (
                  <div key={i} className="instruction-item">
                    <span className="instruction-line">{elementDTO.tagName}</span>
                    <div>
                      <AttributeDropdown elementDTO={elementDTO} onChange={() => { }} />
                    </div>
                    <div className="options-column">
                      <img
                        src={saveImage}
                        alt="save"
                        className="save-button"
                        onClick={() => handleCreateElementDTO(elementDTO)}
                      />
                      <img
                        src={crossImage}
                        alt=""
                        className="cross-button"
                        onClick={() => handleRemoveElementDTO(elementDTO)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Prev
            </button>
            <span>
              {" "}
              Page {currentPage} of {totalPages}{" "}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );

};

export default GridItemScann;
