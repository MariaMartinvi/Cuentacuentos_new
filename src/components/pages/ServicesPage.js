import React from 'react';
import '../../styles/services.css';
import { useTranslation } from 'react-i18next'
import SEO from '../SEO';

function ServicesPage() {
  const { t, i18n } = useTranslation();

  return (
    <div className="page services-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Servicios - AudioGretel' : 
          'Services - AudioGretel'}
        description={i18n.language === 'es' ? 
          'Descubre todos los servicios que ofrece AudioGretel: generador de historias, contenido educativo y asistente de escritura.' : 
          'Discover all the services offered by AudioGretel: story generator, educational content and writing assistant.'}
        keywords={['servicios', 'generador de cuentos', 'contenido educativo', 'asistente de escritura', 'herramientas creativas']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <div className="container">
          <h1>1. {t('services.introductiontitle')}</h1>
          <p>{t('services.introduction')}</p>
        </div>
      </div>

  
      <div className="services-grid">
        <div className="service-card">
          <div className="service-icon">📚</div>
          <h3>Generador de Cuentos</h3>
          <p>Crea historias personalizadas en español con diferentes géneros, longitudes y estilos.</p>
          <ul className="service-features">
            <li>Múltiples géneros literarios</li>
            <li>Personalización por edad</li>
            <li>Diferentes niveles de creatividad</li>
            <li>Conversión a audio</li>
          </ul>
          <button
            className="btn-service"
            onClick={() => (window.location.href = '/')}
        >
             Probar Ahora
           </button>
        </div>

        <div className="service-card">
          <div className="service-icon">🎓</div>
          <h3>Contenido Educativo</h3>
          <p>Generación de material didáctico personalizado para educadores y estudiantes.</p>
          <ul className="service-features">
            <li>Adaptado a diferentes niveles educativos</li>
            <li>Enfoque en temas específicos</li>
            <li>Ejercicios y actividades</li>
            <li>Material complementario</li>
          </ul>
          <span className="coming-soon">Próximamente</span>
        </div>

        <div className="service-card">
          <div className="service-icon">✍️</div>
          <h3>Asistente de Escritura</h3>
          <p>Herramientas para ayudar a escritores a superar el bloqueo creativo y desarrollar ideas.</p>
          <ul className="service-features">
            <li>Generación de ideas</li>
            <li>Desarrollo de personajes</li>
            <li>Construcción de escenarios</li>
            <li>Sugerencias de diálogo</li>
          </ul>
          <span className="coming-soon">Próximamente</span>
        </div>
      </div>
    </div>
  );
}

export default ServicesPage;