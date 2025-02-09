import React, { useState } from "react";
import "./clothing_type.scss";
import { Card } from "@mui/material";

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

  return (
    <div className="app-container">
      <div className="dropdown-container">
        <div className="column">
          <Card />
        </div>

        <div className="column">
          <h3>Clothes for Horses</h3>
          <select onChange={handleHorseClothingChange} value={selectedHorseClothing}>
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

      <div className="iframe-container">
        {/* Horse Details iframe */}
        <iframe
          title="Horse Details"
          srcDoc={`<h1>Horses</h1><p>${clothingTypes.find(
            (item) => item.id === selectedHorseClothing
          )?.description} for horses.</p><p>${horseInfo}</p><input type='text' placeholder='Add more info about horses' value='${horseInfo}'  />`}
          className="iframe"
        ></iframe>

        {/* Dog Details iframe */}
        <iframe
          title="Dog Details"
          srcDoc={`<h1>Dogs</h1><p>${clothingTypes.find(
            (item) => item.id === selectedDogClothing
          )?.description} for dogs.</p><p>${dogInfo}</p><input type='text' placeholder='Add more info about dogs' value='${dogInfo}' />`}
          className="iframe"
        ></iframe>

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
