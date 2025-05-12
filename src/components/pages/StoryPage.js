import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/story.css';

function StoryPage({ story }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div>
      <h1>Historia Generada</h1>
      <p>{story}</p>
      <button onClick={handleBack}>Volver al inicio</button>
      <Link to="/services">Ver servicios</Link>
    </div>
  );
}

export default StoryPage;