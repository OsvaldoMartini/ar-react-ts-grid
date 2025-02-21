import React from 'react';
import MatIcon from './MatIcon'; // Import MatIcon component

const FilterComponent: React.FC = () => {
  return (
    <div
      className="avq-text-primary avq-display-flex avq-align-items-center ng-star-inserted"
      test-id="web-banking-wealth-global-filter-applied-banklet.wealth-global-filter-applied.filter-name"
    >
      <MatIcon
        icon="filter_list" // Material icon name
        testId="web-banking-wealth-global-filter-applied-banklet.icon"
      />
      Filtro
    </div>
  );
};

export default FilterComponent;
