import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StoryExamplesSection from '../StoryExamplesSection.js';

const StoryExamplesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const storyId = searchParams.get('storyId');
  const autoPlay = searchParams.get('autoPlay');

  // Clean up URL after component mounts to avoid keeping the storyId in the URL
  useEffect(() => {
    if (storyId) {
      // Remove storyId and autoPlay from URL after a short delay to allow the component to process it
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('storyId');
        newSearchParams.delete('autoPlay');
        const newSearch = newSearchParams.toString();
        navigate({
          pathname: '/story-examples',
          search: newSearch ? `?${newSearch}` : ''
        }, { replace: true });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [storyId, searchParams, navigate]);

  return <StoryExamplesSection autoOpenStoryId={storyId} autoPlayMode={autoPlay} />;
};

export default StoryExamplesPage; 