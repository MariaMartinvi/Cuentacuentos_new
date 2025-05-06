// utils/helpers.js
exports.constructPrompt = (params) => {
    const { topic, length, storyType, creativityLevel, ageGroup, childNames, englishLevel } = params;
    
    let lengthDescription;
    switch (length) {
      case 'corto': 
        lengthDescription = 'muy corta (exactamente 100 palabras)';
        break;
      case 'medio': 
        lengthDescription = 'de longitud media (exactamente 300 palabras)';
        break;
      case 'largo': 
        lengthDescription = 'larga (exactamente 600 palabras)';
        break;
      default: 
        lengthDescription = 'de longitud media (300 palabras)';
    }
    
    let ageDescription;
    switch (ageGroup) {
      case '3-6': ageDescription = 'niños de 3 a 6 años'; break;
      case '7-13': ageDescription = 'niños de 7 a 13 años'; break;
      case '13-20': ageDescription = 'adolescentes de 13 a 20 años'; break;
      case '21-35': ageDescription = 'adultos jóvenes'; break;
      case '35+': ageDescription = 'adultos'; break;
      default: ageDescription = 'todo público'; break;
    }

    let namesInstruction = '';
    if (childNames && childNames.trim()) {
      const namesList = childNames.split(',').map(name => name.trim()).filter(name => name);
      if (namesList.length > 0) {
        namesInstruction = `\nLos personajes principales deben llamarse: ${namesList.join(', ')}.`;
      }
    }

    let englishLevelInstruction = '';
    switch (englishLevel) {
      case 'basic':
        englishLevelInstruction = `
IMPORTANTE: Usa SOLO estas palabras en inglés:
- Verbos: be, have, do, say, get, make, go, know, take, see, come, think, look, want, give, use, find, tell, ask, work, seem, feel, try, leave, call
- Pronombres: I, you, he, she, it, we, they
- Artículos: a, an, the

REGLAS ESTRICTAS:
1. Usa SOLO el presente simple (I go, you see, he likes)
2. Máximo 3 palabras por frase
3. No uses contracciones (usa "do not" no "don't")
4. No uses adjetivos ni adverbios
5. No uses modismos ni expresiones
6. No uses pasado ni futuro
7. No uses preguntas
8. No uses oraciones complejas

Ejemplo de cómo debe ser:
"I see a cat. The cat is big. I like the cat. The cat likes me."

NO uses frases como:
"I was walking in the park (pasado)
The beautiful cat runs quickly (adjetivos y adverbios)
I don't like cats (contracción)
What do you see? (pregunta)
The cat that I like is big (oración compleja)"`;
        break;
      case 'intermediate':
        englishLevelInstruction = `
Usa un vocabulario intermedio (nivel B1-B2) con estas características:
- Puedes usar todos los tiempos verbales básicos (presente, pasado, futuro)
- Puedes usar adverbios comunes (quickly, slowly, well, badly)
- Puedes usar algunas expresiones idiomáticas comunes
- Puedes usar frases más largas (hasta 10 palabras)
- Puedes usar contracciones (I'm, don't, can't)
- Puedes usar adjetivos más descriptivos

Ejemplo de nivel intermedio:
"I was walking in the park when I saw a beautiful butterfly. It was flying quickly from flower to flower. I wanted to take a picture, but my phone was at home."`;
        break;
      case 'advanced':
        englishLevelInstruction = `
Usa un vocabulario avanzado (nivel C1-C2) con estas características:
- Usa todos los tiempos verbales, incluyendo perfectos y continuos
- Usa expresiones idiomáticas y modismos
- Usa frases complejas y subordinadas
- Usa vocabulario sofisticado y específico
- Usa lenguaje figurativo y metáforas
- Usa diferentes estilos de lenguaje según el contexto

Ejemplo de nivel avanzado:
"As the golden rays of the setting sun cast long shadows across the meadow, a kaleidoscope of butterflies danced in the crisp autumn air, their delicate wings creating a mesmerizing spectacle of color and motion."`;
        break;
      default:
        englishLevelInstruction = '\nUsa un vocabulario intermedio en inglés.';
    }
    
    return `Escribe una historia ${lengthDescription} de género ${storyType} sobre "${topic}". 
  La historia debe ser apropiada para ${ageDescription}.${namesInstruction}${englishLevelInstruction}
  Usa un estilo narrativo atractivo, con personajes interesantes y un desarrollo coherente de la trama.
  Incluye diálogos y descripciones donde sea apropiado.
  La historia debe tener un inicio, desarrollo y conclusión claros.
  IMPORTANTE: La historia debe tener exactamente ${length === 'corto' ? '100' : length === 'medio' ? '300' : '600'} palabras.`;
  };
  
  exports.extractTitle = (content, fallbackTopic) => {
    // Try to extract title from the first line if it looks like a title
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // If first line is short enough and doesn't end with punctuation, use as title
    if (firstLine.length < 60 && !firstLine.match(/[.,:;?!]$/)) {
      return firstLine;
    }
    
    // Otherwise generate a title based on the topic
    return `Historia de ${fallbackTopic}`;
  };