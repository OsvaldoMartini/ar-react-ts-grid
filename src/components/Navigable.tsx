import React, { useState, useEffect } from 'react';
import './navigable.scss';

// Utility function to generate random names
const getRandomName = (): string => {
  const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  return names[Math.floor(Math.random() * names.length)];
};

// Type for the generated random item (each item is JSX.Element)
type RandomItem = JSX.Element;

const generateRandomItem = (index: number): RandomItem => {
  // Randomly choose between a button, select, label, div, or span
  const itemType = ['button', 'select', 'label', 'div', 'span'][Math.floor(Math.random() * 5)];

  switch (itemType) {
    case 'button':
      return (
        <button key={index} className="navigable">
          Button {getRandomName()}
        </button>
      );
    case 'select':
      return (
        <select key={index} className="navigable">
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
      );
    case 'label':
      return (
        <label key={index} className="navigable">
          Label {getRandomName()}
        </label>
      );
    case 'div':
      return (
        <div key={index} className="navigable">
          Div {getRandomName()}
        </div>
      );
    case 'span':
      return (
        <span key={index} className="navigable">
          Span {getRandomName()}
        </span>
      );
    default:
      return <div key={index}>Unknown item type</div>;
  }
};

const Navigable: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [items, setItems] = useState<RandomItem[]>([]); // State to store random items

  // Function to navigate elements by index
  const navigateElement = (index: number): void => {
    const elements = document.querySelectorAll('.navigable');
    if (elements.length > 0) {
      // Remove highlight class from the previous element
      const previousElement = elements[currentIndex] as HTMLElement;
      previousElement.classList.remove('highlight');

      // Ensure the index is within bounds
      index = Math.max(0, Math.min(index, elements.length - 1));

      // Scroll to the new element and add highlight class
      const element = elements[index] as HTMLElement;
      element.scrollIntoView({ behavior: 'smooth' });
      element.classList.add('highlight');
    }
  };

  // Navigate to the previous item
  const goToPreviousItem = (): void => {
    setCurrentIndex((prevIndex) => {
      const newIndex = Math.max(prevIndex - 1, 0); // Prevent going below 0
      navigateElement(newIndex);
      return newIndex;
    });
  };

  // Navigate to the next item
  const goToNextItem = (): void => {
    setCurrentIndex((prevIndex) => {
      const newIndex = Math.min(prevIndex + 1, document.querySelectorAll('.navigable').length - 1); // Prevent exceeding bounds
      navigateElement(newIndex);
      return newIndex;
    });
  };

  // Generate random items only on first render
  useEffect(() => {
    const randomItems = [...Array(20)].map((_, index) => generateRandomItem(index)); // Generate 20 random items
    setItems(randomItems);
  }, []); // Empty dependency array ensures this effect runs only once when the component mounts

  return (
    <div className="grid-container">
      {/* Fixed Navigation Buttons */}
      <div className="navigation-buttons">
        <button onClick={goToPreviousItem}>Previous</button>
        <button onClick={goToNextItem}>Next</button>
      </div>

      {/* Scrollable Container */}
      <div className="scrollable-container">
        {/* Render generated random items */}
        {items}
      </div>
    </div>
  );
};

export default Navigable;
