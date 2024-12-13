import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa'; // Importing the Home icon from React Icons

const Menu = () => (
  <nav style={{ position: 'relative' }}>
    <ul style={{ display: 'flex', justifyContent: 'space-around', listStyleType: 'none', padding: 0 }}>
      {/* Home Icon Positioned at the Left */}
      <li style={{ position: 'absolute', left: '10px' }}>
        <Link to="/">
          <FaHome style={{ fontSize: '24px', cursor: 'pointer' }} /> {/* Home icon */}
        </Link>
      </li>

      {/* Other Menu Items */}
      <li><Link to="/">Home</Link></li>
      <li><Link to="/page1">First Page</Link></li>
      <li><Link to="/about">About Page</Link></li>
    </ul>
  </nav>
);

export default Menu;
