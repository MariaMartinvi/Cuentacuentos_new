import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * BreadcrumbSchema component for structured data about page navigation
 * @param {Object} props Component props
 * @param {Array<Object>} props.items Breadcrumb items with name and url
 * @param {string} props.currentPageName Name of the current page (last item in breadcrumb)
 */
const BreadcrumbSchema = ({ items = [], currentPageName }) => {
  const siteUrl = 'https://micuentacuentos.com';
  
  // Create the breadcrumb list with proper formatting
  const breadcrumbList = items.map((item, index) => {
    return {
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`
    };
  });

  // Add the current page as the last item if provided
  if (currentPageName && !items.find(item => item.name === currentPageName)) {
    breadcrumbList.push({
      '@type': 'ListItem',
      'position': items.length + 1,
      'name': currentPageName
    });
  }

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbList
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default BreadcrumbSchema; 