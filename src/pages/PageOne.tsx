import React, { useState } from 'react';

const PageOne = () => {
  const [formData, setFormData] = useState({ name: '', surname: '' });

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

  return (
    <div>
      <h1>Page One</h1>
      <form>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {/* First Name Field */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '250px', width: '100%' }}>
            <span>First Name</span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              style={{ width: '100%', maxWidth: '250px' }}
            />
          </div>

          {/* Surname Field */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '250px', width: '100%' }}>
            <span>Surname</span>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              style={{ width: '100%', maxWidth: '250px' }}
            />
          </div>

          {/* Address Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '250px', width: '100%' }}>
            <span>Address</span>
            <select
              name="address"
              defaultValue=""
              style={{ width: '100%', maxWidth: '250px' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '250px', width: '100%' }}>
            <span>Name and Surname</span>
            <select
              name="names"
              defaultValue=""
              onChange={handleNameChange}
              style={{ width: '100%', maxWidth: '250px' }}
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '250px',
              width: '100%',
              marginTop: '20px',
              justifyContent: 'center', // Center the button horizontally
              alignItems: 'center', // Center horizontally within the div
            }}
          >
            <button
              type="button"
              onClick={handleClean}
              style={{
                backgroundColor: '#007BFF',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                maxWidth: '250px',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007BFF'}
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
