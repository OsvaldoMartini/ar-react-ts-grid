import React, { useState } from "react";

const InputPage: React.FC = () => {
  const [inputValue, setInputValue] = useState<string>("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <div>
      <h1>Enter Details</h1>
      <input
        name="inputDetails"
        type="text"
        placeholder="Type here..."
        value={inputValue}
        onChange={handleInputChange}
      />
      <p>{inputValue && `You typed: ${inputValue}`}</p>
    </div>
  );
};

export default InputPage;
