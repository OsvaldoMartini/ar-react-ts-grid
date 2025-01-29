import React from 'react';

import ArticleGrid from '@root/ArticleGrid';

export const Dashboard: React.FC = () => {

  return (

    <div style={{ background: 'white', padding: '16px' }}>

      <h3>Articles</h3>

      <ArticleGrid />

    </div>

  );

};

export default Dashboard;