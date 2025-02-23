import React, { useState } from "react";
import "./clothing_type.scss";
import { Card } from "@mui/material";
import FilterComponent from "./FilterComponent"; // Import FilterComponent
import FilterButton from "./FilterButton";

// Define the ClothingType interface
interface ClothingType {
  id: string;
  name: string;
  description: string;
}

const ClothingType: React.FC = () => {
  // Clothing options
  const clothingTypes: ClothingType[] = [
    { id: "1", name: "Winter Coat", description: "Warm and cozy for winter days." },
    { id: "2", name: "Rain Jacket", description: "Waterproof jacket for rainy weather." },
    { id: "3", name: "Summer Blanket", description: "Lightweight and breathable for summer." },
    { id: "4", name: "Competition Dress", description: "Stylish outfit for competitions." },
    { id: "5", name: "Casual Cover", description: "Everyday comfortable wear." },
  ];

  // State to track selected clothing and additional information for horses and dogs
  const [selectedHorseClothing, setSelectedHorseClothing] = useState<string>(clothingTypes[0].id);
  const [selectedDogClothing, setSelectedDogClothing] = useState<string>(clothingTypes[0].id);
  const [horseInfo, setHorseInfo] = useState<string>("");
  const [dogInfo, setDogInfo] = useState<string>("");

  const handleHorseClothingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHorseClothing(event.target.value);
  };

  const handleDogClothingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDogClothing(event.target.value);
  };

  const handleHorseInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHorseInfo(event.target.value);
  };

  const handleDogInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDogInfo(event.target.value);
  };

  // A reusable iframe component to reduce redundancy
  const ClothingDetailsIframe = ({
    title,
    selectedClothingId,
    clothingTypes,
    additionalInfo,
    onInfoChange,
  }: {
    title: string;
    selectedClothingId: string;
    clothingTypes: ClothingType[];
    additionalInfo: string;
    onInfoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const selectedClothing = clothingTypes.find((item) => item.id === selectedClothingId);
    return (
      <iframe
        title={title}
        srcDoc={`<h1>${title}</h1><p>${selectedClothing?.description}</p><p>${additionalInfo}</p><input type='text' placeholder='Add more info' value='${additionalInfo}' oninput='this.value=${additionalInfo}' />`}
        className="iframe"
      ></iframe>
    );
  };

  return (
    <div className="app-container">
      <div className="dropdown-container">
        {/* <div className="column">
          <Card />
        </div> */}
        <div className="column">
          <h3>Clothes for Horses</h3>
          <select
            id="horse-clothing-select" // Added id attribute
            name="horseClothing" // Added name attribute
            onChange={handleHorseClothingChange}
            value={selectedHorseClothing}
          >
            {clothingTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="column">
          <h3>Clothes for Dogs</h3>
          <select onChange={handleDogClothingChange} value={selectedDogClothing}>
            {clothingTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Additional dog info"
            value={dogInfo}
            onChange={handleDogInfoChange}
          />
        </div>
      </div>

      <FilterButton onClick={function (): void {
        throw new Error("Function not implemented.");
      }} />

      {/* Use FilterComponent */}
      <FilterComponent />

      <div className="iframe-container">
        {/* Reuse the ClothingDetailsIframe for horse and dog */}
        <ClothingDetailsIframe
          title="Horse Details"
          selectedClothingId={selectedHorseClothing}
          clothingTypes={clothingTypes}
          additionalInfo={horseInfo}
          onInfoChange={handleHorseInfoChange}
        />

        <ClothingDetailsIframe
          title="Dog Details"
          selectedClothingId={selectedDogClothing}
          clothingTypes={clothingTypes}
          additionalInfo={dogInfo}
          onInfoChange={handleDogInfoChange}
        />

        {/* Input Page iframe */}
        <iframe
          title="Input Page"
          src="/input_page.html" // Update this path to the actual location of your HTML file in the `public` folder
          className="iframe"
        ></iframe>
      </div>
    </div>
  );
};

export default ClothingType;
