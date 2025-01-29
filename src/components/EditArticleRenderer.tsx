import React from 'react';
import { FaEye } from "react-icons/fa";
import { useHistory } from 'react-router-dom';

interface EditArticleRendererProps {
  params: any; // Define the type for `params` as per your use case
}

const EditArticleRenderer: React.FC<EditArticleRendererProps> = ({ params }) => {
  const history = useHistory();

  const handleClick = () => {
    // Assuming the userId is in params.data and you're using template literals for dynamic URLs
    history.push(`/users/${params?.data?.userId}`);
  };

  return (
    <FaEye
      aria-label="View Article"
      style={{ cursor: 'pointer' }} // Add pointer cursor to indicate it's clickable
      onClick={handleClick}
    />
  );
};

export default EditArticleRenderer;
