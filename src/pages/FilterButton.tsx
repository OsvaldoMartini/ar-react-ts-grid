import React from 'react';
import { Button, Icon } from '@mui/material';

interface FilterButtonProps {
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      color="primary"
      variant="text"
      className="avq-text-primary mdc-button mat-mdc-button mat-unthemed mat-mdc-button-base"
      aria-expanded="false"
      aria-haspopup="dialog"
      aria-controls="avq-global-filter-dialog"
      test-id="web-banking-portal.app-bar.global-filter.button"
    >
      {/* Material Icon inside Button */}
      <Icon className="mat-icon notranslate material-icons mat-ligature-font mat-icon-inline" aria-hidden="true">
        filter_list
      </Icon>
      Filtro
    </Button>
  );
};

export default FilterButton;
