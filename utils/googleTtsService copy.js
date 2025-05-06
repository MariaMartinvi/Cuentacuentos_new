// utils/googleTtsService.js
const axios = require('axios');

exports.synthesizeSpeech = async (text, voiceId, speechRate) => {
  try {
    console.log("Llamando a Google TTS con la clave:", process.env.GOOGLE_TTS_API_KEY);
    console.log("Texto a sintetizar (primeros 50 caracteres):", text.substring(0, 50));
    console.log("Configuración completa:", {
  languageCode,
  voiceName,
  gender: voiceId.startsWith('male') ? 'MALE' : 'FEMALE',
  speechRate
});
    // Map our voice IDs to Google's voice names
    const voiceName = getGoogleVoiceName(voiceId);
    const languageCode = voiceId.includes('latam') ? 'es-419' : 'es-ES';
    // Al principio de synthesizeSpeech
    console.log("Google TTS API Key:", process.env.GOOGLE_TTS_API_KEY ? "Configurada (primeros caracteres: " + process.env.GOOGLE_TTS_API_KEY.substring(0, 5) + "...)" : "No configurada");
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
      {
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender: voiceId.startsWith('male') ? 'MALE' : 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: speechRate,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.audioContent; // Base64 encoded audio
  } catch (error) {
    console.error('Google TTS API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      throw new Error('Authentication error with Google TTS API. Check your API key.');
    } else {
      throw new Error('Failed to generate audio: ' + (error.response?.data?.error?.message || error.message));
    }
  }
};

// Helper function to map our voice IDs to Google's voice names
function getGoogleVoiceName(voiceId) {
  switch (voiceId) {
    case 'female':
      return 'es-ES-Standard-A';
    case 'male':
      return 'es-ES-Standard-B';
    case 'female-latam':
      return 'es-US-Standard-A';
    case 'female-english':
      return 'en-US-Standard-A';
    case 'male-english':
      return 'en-US-Standard-B';
    case 'male-latam':
      return 'es-US-Standard-B';
    default:
      return 'es-ES-Standard-A';
  }
}