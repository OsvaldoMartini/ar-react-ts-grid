import React, { useState } from 'react';
import './pageone.scss';  // Import the SCSS file

const PageOne = () => {
  const [formData, setFormData] = useState({ name: '', surname: '' });
  const [isClicked, setIsClicked] = useState(false); // Track button clicked state

  const handleNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const [name, surname] = event.target.value.split(' ');
    setFormData({ name, surname });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  // Function to clear all fields and reset dropdowns
  const handleClean = () => {
    setFormData({ name: '', surname: '' });
    // Reset dropdowns by setting default value to empty string
    const addressSelect = document.querySelector('select[name="address"]') as HTMLSelectElement;
    const namesSelect = document.querySelector('select[name="names"]') as HTMLSelectElement;

    if (addressSelect && namesSelect) {
      addressSelect.selectedIndex = 0; // Reset to the first option
      namesSelect.selectedIndex = 0; // Reset to the first option
    }
  };

  const handleButtonMouseDown = () => {
    setIsClicked(true); // Set clicked state to true
  };

  const handleButtonMouseUp = () => {
    setTimeout(() => {
      setIsClicked(false); // Set clicked state back to false after 2 seconds
    }, 2000); // Delay 2 seconds before returning to original style
  };

  console.log("Loading...PAGE ONE")

  return (
    <div className="page-container">
      <h1>Page One</h1>
      <form>
        <div className="form-container">
          {/* First Name Field */}
          <div className="input-field">
            <span>First Name</span>
            <input
              id="firstName"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
          </div>

          {/* Surname Field */}
          <div className="input-field">
            <span>Surname</span>
            <input
              id="surName"
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
            />
          </div>

          {/* Address Dropdown */}
          <div className="select-field">
            <span>Address</span>
            <select
              id="seletAddress"
              name="address"
              defaultValue=""
            >
              <option value="" disabled>Select an address</option>
              <option value="address1">123 Main St</option>
              <option value="address2">456 Maple Ave</option>
              <option value="address3">789 Oak Dr</option>
              <option value="address4">101 Pine Rd</option>
              <option value="address5">202 Birch Ln</option>
            </select>
          </div>

          {/* Name and Surname Dropdown */}
          <div className="select-field">
            <span>Name and Surname</span>
            <select
              id="selectName"
              name="names"
              defaultValue=""
              onChange={handleNameChange}
            >
              <option value="" disabled>Select a name</option>
              <option value="John Doe">John Doe</option>
              <option value="Jane Smith">Jane Smith</option>
              <option value="Alice Johnson">Alice Johnson</option>
              <option value="Robert Brown">Robert Brown</option>
              <option value="Michael Davis">Michael Davis</option>
              <option value="Emily Wilson">Emily Wilson</option>
              <option value="William Taylor">William Taylor</option>
              <option value="Sophia Martinez">Sophia Martinez</option>
              <option value="James Anderson">James Anderson</option>
              <option value="Olivia Thomas">Olivia Thomas</option>
            </select>
          </div>

          {/* Clean button below Name and Surname combo */}
          <div className="clean-button-container">
            <button
              id="btnClean"
              type="button"
              onClick={handleClean}
              className={`clean-button ${isClicked ? 'clicked' : ''}`}
              onMouseDown={handleButtonMouseDown}
              onMouseUp={handleButtonMouseUp}
            >
              Clean
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PageOne;
