import React from 'react';
import { productsConfig } from '../components/productsConfig';
export default function Card() {
  return (
    <div className="card-container">
      {productsConfig.map((productConf) => (
        <div className="card">
          <div className="content">
            <div className="contentBx">
              <h2>{productConf.name}</h2>
              <p>{productConf.longDescription}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
