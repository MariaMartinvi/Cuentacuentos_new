const { generateAudio } = require('../services/textToSpeechService');
const path = require('path');
const fs = require('fs');

exports.generateAudio = async (req, res) => {
  try {
    const { text, voiceId, speechRate } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'El texto es requerido' });
    }

    const result = await generateAudio(text, voiceId, speechRate);
    res.json(result);
  } catch (error) {
    console.error('Error en generateAudio controller:', error);
    res.status(500).json({ error: 'Error al generar el audio' });
  }
};

exports.getAudio = (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo de audio no encontrado' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error en getAudio controller:', error);
    res.status(500).json({ error: 'Error al obtener el archivo de audio' });
  }
}; 