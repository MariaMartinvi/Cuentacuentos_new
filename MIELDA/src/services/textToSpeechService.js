const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const client = new textToSpeech.TextToSpeechClient();

const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const VOICE_CONFIGS = {
  'female': {
    languageCode: 'es-ES',
    name: 'es-ES-Standard-A',
    ssmlGender: 'FEMALE'
  },
  'male': {
    languageCode: 'es-ES',
    name: 'es-ES-Standard-B',
    ssmlGender: 'MALE'
  },
  'female-latam': {
    languageCode: 'es-MX',
    name: 'es-MX-Standard-A',
    ssmlGender: 'FEMALE'
  },
  'male-latam': {
    languageCode: 'es-MX',
    name: 'es-MX-Standard-B',
    ssmlGender: 'MALE'
  },
  'female-english': {
    languageCode: 'en-US',
    name: 'en-US-Standard-C',
    ssmlGender: 'FEMALE'
  },
  'male-english': {
    languageCode: 'en-US',
    name: 'en-US-Standard-B',
    ssmlGender: 'MALE'
  }
};

async function generateAudio(text, voiceId = 'female', speechRate = 0.8) {
  try {
    const voiceConfig = VOICE_CONFIGS[voiceId] || VOICE_CONFIGS['female'];
    
    // Construir el SSML con la velocidad configurada
    const ssml = `<speak><prosody rate="${speechRate}">${text}</prosody></speak>`;

    const request = {
      input: { ssml },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: speechRate
      },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    // Generar un nombre de archivo único
    const fileName = `audio_${uuidv4()}.mp3`;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    // Asegurarse de que el directorio temp existe
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Guardar el archivo
    await writeFile(filePath, audioContent, 'binary');

    // Programar la eliminación del archivo después de 1 hora
    setTimeout(async () => {
      try {
        await unlink(filePath);
        console.log(`Archivo temporal eliminado: ${fileName}`);
      } catch (error) {
        console.error('Error al eliminar archivo temporal:', error);
      }
    }, 3600000); // 1 hora en milisegundos

    return {
      audioUrl: `/api/audio/${fileName}`,
      fileName
    };
  } catch (error) {
    console.error('Error en textToSpeechService:', error);
    throw error;
  }
}

module.exports = {
  generateAudio
}; 