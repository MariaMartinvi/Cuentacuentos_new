const axios = require('axios');
// In your function files


exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const audioParams = JSON.parse(event.body);
    const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;
    
    const { text, voiceId, speechRate } = audioParams;
    const voiceDetails = getGoogleVoiceDetails(voiceId);
    
    // Limit text length to avoid errors
    const maxTextLength = 4950; // Google has a 5000 character limit
    const truncatedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '...'
      : text;
    
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        input: { text: truncatedText },
        voice: {
          languageCode: voiceDetails.languageCode,
          name: voiceDetails.name,
          ssmlGender: voiceDetails.gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speechRate || 1.0,
          pitch: 0.0
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        audioContent: response.data.audioContent,
        parameters: audioParams
      })
    };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate audio',
        message: error.message
      })
    };
  }
};

// Helper function
function getGoogleVoiceDetails(voiceId) {
  switch (voiceId) {
    // Español
    case 'female':
      return {
        name: 'es-ES-Neural2-H',
        languageCode: 'es-ES',
        gender: 'FEMALE'
      };
    case 'male':
      return {
        name: 'es-ES-Neural2-B',
        languageCode: 'es-ES',
        gender: 'MALE'
      };
    case 'female-latam':
      return {
        name: 'es-US-Neural2-A',
        languageCode: 'es-US',
        gender: 'FEMALE'
      };
    case 'male-latam':
      return {
        name: 'es-US-Neural2-B',
        languageCode: 'es-US',
        gender: 'MALE'
      };
    
    // Inglés
    case 'female-english':
      return {
        name: 'en-US-Neural2-F',
        languageCode: 'en-US',
        gender: 'FEMALE'
      };
    case 'male-english':
      return {
        name: 'en-US-Neural2-D',
        languageCode: 'en-US',
        gender: 'MALE'
      };
    
    // Catalán
    case 'female-catalan':
      return {
        name: 'ca-ES-Neural2-A',
        languageCode: 'ca-ES',
        gender: 'FEMALE'
      };
    case 'male-catalan':
      return {
        name: 'ca-ES-Neural2-B',
        languageCode: 'ca-ES',
        gender: 'MALE'
      };
    
    // Gallego
    case 'female-galician':
      return {
        name: 'gl-ES-Neural2-A',
        languageCode: 'gl-ES',
        gender: 'FEMALE'
      };
    case 'male-galician':
      return {
        name: 'gl-ES-Neural2-B',
        languageCode: 'gl-ES',
        gender: 'MALE'
      };
    
    // Euskera
    case 'female-basque':
      return {
        name: 'eu-ES-Neural2-A',
        languageCode: 'eu-ES',
        gender: 'FEMALE'
      };
    case 'male-basque':
      return {
        name: 'eu-ES-Neural2-B',
        languageCode: 'eu-ES',
        gender: 'MALE'
      };
    
    // Alemán
    case 'female-german':
      return {
        name: 'de-DE-Neural2-A',
        languageCode: 'de-DE',
        gender: 'FEMALE'
      };
    case 'male-german':
      return {
        name: 'de-DE-Neural2-B',
        languageCode: 'de-DE',
        gender: 'MALE'
      };
    
    // Italiano
    case 'female-italian':
      return {
        name: 'it-IT-Neural2-A',
        languageCode: 'it-IT',
        gender: 'FEMALE'
      };
    case 'male-italian':
      return {
        name: 'it-IT-Neural2-B',
        languageCode: 'it-IT',
        gender: 'MALE'
      };
    
    // Francés
    case 'female-french':
      return {
        name: 'fr-FR-Neural2-A',
        languageCode: 'fr-FR',
        gender: 'FEMALE'
      };
    case 'male-french':
      return {
        name: 'fr-FR-Neural2-B',
        languageCode: 'fr-FR',
        gender: 'MALE'
      };
    
    // Portugués
    case 'female-portuguese':
      return {
        name: 'pt-PT-Neural2-A',
        languageCode: 'pt-PT',
        gender: 'FEMALE'
      };
    case 'male-portuguese':
      return {
        name: 'pt-PT-Neural2-B',
        languageCode: 'pt-PT',
        gender: 'MALE'
      };
    
    // Portugués de Portugal
    case 'female-portuguese-pt':
      return {
        name: 'pt-PT-Neural2-A',
        languageCode: 'pt-PT',
        gender: 'FEMALE'
      };
    case 'male-portuguese-pt':
      return {
        name: 'pt-PT-Neural2-B',
        languageCode: 'pt-PT',
        gender: 'MALE'
      };
    
    // Portugués de Brasil
    case 'female-portuguese-br':
      return {
        name: 'pt-BR-Neural2-A',
        languageCode: 'pt-BR',
        gender: 'FEMALE'
      };
    case 'male-portuguese-br':
      return {
        name: 'pt-BR-Neural2-B',
        languageCode: 'pt-BR',
        gender: 'MALE'
      };
    
    default:
      return {
        name: 'es-ES-Neural2-A',
        languageCode: 'es-ES',
        gender: 'FEMALE'
      };
  }
}