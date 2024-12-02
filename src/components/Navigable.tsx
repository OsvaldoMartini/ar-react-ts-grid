import React, { useEffect, useState } from 'react';

interface NavigableProps {
  dataHtml: string[]; // The array of HTML strings
}

const Navigable: React.FC<NavigableProps> = ({ dataHtml }) => {
  const [elements, setElements] = useState<JSX.Element[]>([]); // State to store the parsed HTML elements

  useEffect(() => {
    // Function to parse HTML string into JSX elements
    const parseHtmlString = (htmlString: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      const elementsList = Array.from(doc.body.children);

      return elementsList.map((element, index) => {
        // Extract the attributes from the element
        const attributes: { [key: string]: any } = {};
        Array.from(element.attributes).forEach((attr) => {
          attributes[attr.name] = attr.value;
        });

        // Create a React element with the same attributes
        return React.createElement(element.tagName.toLowerCase(), {
          key: index,
          ...attributes, // Pass attributes as props
        });
      });
    };

    // Parse each HTML string in the array and merge all elements
    const parsedElements = dataHtml.flatMap((htmlString) => parseHtmlString(htmlString));

    setElements(parsedElements);
  }, [dataHtml]);

  return (
    <div className="navigable-container">
      {elements} {/* Render the parsed elements */}
    </div>
  );
};

export default Navigable;
