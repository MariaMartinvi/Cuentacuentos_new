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
    case 'female':
      return {
        name: 'es-ES-Neural2-H',
        languageCode: 'es-ES',
        gender: 'FEMALE'
      };
    case 'male':
      return {
        name: 'es-ES-Standard-B',
        languageCode: 'es-ES',
        gender: 'MALE'
      };
    case 'female-latam':
      return {
        name: 'es-US-Neural2-A',
        languageCode: 'es-US',
        gender: 'FEMALE'
      };
    case 'female-english':
      return {
        name: 'en-US-Neural2-F',
        languageCode: 'en-US',
        gender: 'FEMALE'
      };
    case 'male-english':
      return {
        name: 'en-US-Standard-B',
        languageCode: 'en-US',
        gender: 'MALE'
      };
    case 'male-latam':
      return {
        name: 'es-US-Standard-B',
        languageCode: 'es-US',
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