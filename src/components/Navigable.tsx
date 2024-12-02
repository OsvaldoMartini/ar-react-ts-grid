import React, { useEffect, useState } from 'react';
import './navigable.scss';

interface NavigableProps {
  dataHtml: string[]; // The array of HTML strings
}

const Navigable: React.FC<NavigableProps> = ({ dataHtml }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [elements, setElements] = useState<JSX.Element[]>([]); // State to store the parsed HTML elements

  useEffect(() => {
    // Function to parse HTML string into JSX elements
    const parseHtmlString = (htmlString: string, htmlStringIndex: number) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      const elementsList = Array.from(doc.body.children);

      // Function to convert HTML attributes to React-compatible names
      const convertToReactAttributes = (attributes: { [key: string]: string }) => {
        const convertedAttributes: { [key: string]: string } = {};
        for (const [key, value] of Object.entries(attributes)) {
          switch (key) {
            case 'class':
              convertedAttributes['className'] = value; // Convert 'class' to 'className'
              break;
            case 'autocapitalize':
              convertedAttributes['autoCapitalize'] = value; // Convert 'autocapitalize' to 'autoCapitalize'
              break;
            case 'spellcheck':
              convertedAttributes['spellCheck'] = value; // Convert 'spellcheck' to 'spellCheck'
              break;
            default:
              convertedAttributes[key] = value; // Keep other attributes as they are
          }
        }

        // Ensure className includes "navigable"
        convertedAttributes['className'] = convertedAttributes['className']
          ? `${convertedAttributes['className']} navigable`
          : 'navigable';

        return convertedAttributes;
      };

      return elementsList.map((element, index) => {
        // Extract the attributes from the element
        const attributes: { [key: string]: any } = {};
        Array.from(element.attributes).forEach((attr) => {
          attributes[attr.name] = attr.value;
        });

        // Convert attributes to React-compatible attributes
        const reactAttributes = convertToReactAttributes(attributes);

        // Create a unique key by combining the htmlStringIndex and element's index
        const uniqueKey = `${htmlStringIndex}-${index}`;

        // Create a React element with the converted attributes
        return React.createElement(element.tagName.toLowerCase(), {
          key: uniqueKey,
          ...reactAttributes, // Pass converted attributes as props
        });
      });
    };

    // Parse each HTML string in the array and merge all elements
    const parsedElements = dataHtml.flatMap((htmlString, htmlStringIndex) =>
      parseHtmlString(htmlString, htmlStringIndex)
    );

    setElements(parsedElements);

    // Highlight the first item on initial render with a slight delay to allow rendering
    setTimeout(() => {
      navigateElement(0); // Highlight the first item (index 0)
    }, 0);

  }, [dataHtml]);

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

  return (
    <div className="grid-container">
      {/* Fixed Navigation Buttons */}
      <div className="navigation-buttons">
        <button onClick={goToPreviousItem}>Previous</button>
        <button onClick={goToNextItem}>Next</button>

        {/* Display TagName + (Id or Name) */}
        <span className="element-info">
          {elements.length > 0 ? (
            (() => {
              const currentElement = elements[currentIndex];
              const tagName = currentElement.type;
              const id = currentElement.props.id || null;
              const name = currentElement.props.name || null;

              return `${tagName} (${id || name || 'No Id/Name'})`;
            })()
          ) : (
            'No Elements'
          )}
        </span>
      </div>

      {/* Scrollable Container */}
      <div className="scrollable-container">
        {elements} {/* Render the parsed elements */}
      </div>
    </div>
  );
};

export default Navigable;
