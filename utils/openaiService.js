// utils/openaiService.js
const axios = require('axios');

exports.generateCompletion = async (prompt, storyParams) => {
  try {
    const maxTokens = getMaxTokens(storyParams.length);
    const temperature = getTemperature(storyParams.creativityLevel);
    
    console.log('storyParams recibidos:', JSON.stringify(storyParams));

    // Construir el mensaje del sistema basado en el idioma y nivel de inglés
    let systemMessage;
    if (storyParams.language === 'en') {
      switch (storyParams.englishLevel) {
        case 'basic':
          systemMessage = `You are a story writer for absolute beginners in English (A1 level). Follow these strict rules:
1. Use ONLY these words: be, have, do, say, get, make, go, know, take, see, come, think, look, want, give, use, find, tell, ask, work, seem, feel, try, leave, call.
2. Use ONLY simple present tense (I go, you see, he likes).
3. Maximum 3 words per sentence.
4. No contractions (use "do not" not "don't").
5. No adjectives or adverbs.
6. No idioms or expressions.
7. No past tense or future tense.
8. No questions.
9. No complex sentences.
10. No pronouns except I, you, he, she, it, we, they.

Example of correct sentences:
- I see a cat.
- The cat is big.
- I like the cat.
- The cat likes me.

Example of incorrect sentences (DO NOT USE):
- I was walking in the park (past tense)
- The beautiful cat runs quickly (adjectives and adverbs)
- I don't like cats (contraction)
- What do you see? (question)
- The cat that I like is big (complex sentence)`;
          break;
        case 'intermediate':
          systemMessage = `You are a story writer for intermediate English learners (B1-B2 level). Follow these rules:

1. Vocabulary:
   - Use common everyday words
   - Can use basic adjectives (big, small, happy, sad)
   - Can use basic adverbs (quickly, slowly, well)
   - Can use common phrasal verbs
   - Can use basic idioms and expressions

2. Grammar:
   - Use all basic tenses (present, past, future)
   - Can use continuous tenses
   - Can use basic modal verbs (can, should, must)
   - Can use basic conditionals
   - Can use relative clauses

3. Structure:
   - Maximum 10 words per sentence
   - Can use compound sentences
   - Can use basic linking words (and, but, because)
   - Can use basic discourse markers

Example of correct sentences:
- I was walking in the park when I saw a beautiful butterfly.
- The children were playing happily in the garden.
- If it rains tomorrow, we will stay at home.
- She can speak three languages fluently.

Example of incorrect sentences (DO NOT USE):
- The scintillating luminescence of the fireflies created an ethereal ambiance (too advanced)
- Having been informed of the situation, I proceeded to take immediate action (too complex)
- The cat, which was sitting on the windowsill, meowed loudly (too complex for intermediate)`;
          break;
        case 'advanced':
          systemMessage = `You are a story writer for advanced English learners (C1-C2 level). You can use:

1. Vocabulary:
   - Sophisticated and precise vocabulary
   - Advanced adjectives and adverbs
   - Complex phrasal verbs
   - Idioms and expressions
   - Figurative language and metaphors
   - Technical and specialized terms when appropriate

2. Grammar:
   - All verb tenses, including perfect and continuous forms
   - Complex modal structures
   - Advanced conditionals
   - Passive voice
   - Inversion
   - Cleft sentences
   - Advanced relative clauses

3. Structure:
   - Complex and compound-complex sentences
   - Advanced linking words and discourse markers
   - Parallel structures
   - Rhetorical devices
   - Varied sentence length and structure

Example of correct sentences:
- As the golden rays of the setting sun cast long shadows across the meadow, a kaleidoscope of butterflies danced in the crisp autumn air.
- Having been informed of the situation, I proceeded to take immediate action to mitigate the potential consequences.
- Not only did she excel in her studies, but she also demonstrated exceptional leadership skills.
- The intricate tapestry of human emotions was woven with threads of joy, sorrow, and everything in between.

Example of incorrect sentences (DO NOT USE):
- I see cat. Cat big. (too basic)
- I was walking in park. I saw butterfly. (too simple)
- The children were playing in the garden and they were happy. (too intermediate)`;
          break;
        default:
          systemMessage = 'You are a creative story writer in English. Create original, coherent and captivating stories.';
      }
    } else {
      systemMessage = 'Eres un creativo escritor de cuentos en español. Crea historias originales, coherentes y cautivadoras.';
    }
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: 1,
      frequency_penalty: 0.2,
      presence_penalty: 0.6
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    
    // Enhanced error handling
    if (error.response?.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication error with OpenAI API. Check your API key.');
    } else {
      throw new Error('Failed to generate story with OpenAI: ' + (error.response?.data?.error?.message || error.message));
    }
  }
};

// Helper functions to determine parameters based on user selections
function getMaxTokens(length) {
  // Manejar tanto valores en español como en inglés
  switch (length?.toLowerCase()) {
    case 'short': 
    case 'corto': 
      return 400;
    case 'medium': 
    case 'medio': 
      return 800;
    case 'long': 
    case 'largo': 
      return 1600;
    default: 
      return 800;
  }
}

function getTemperature(creativityLevel) {
  // Manejar tanto valores en español como en inglés
  switch (creativityLevel?.toLowerCase()) {
    case 'conservative':
    case 'conservador': 
      return 0.5;
    case 'innovative':
    case 'innovador': 
      return 0.7;
    case 'imaginative':
    case 'imaginativo': 
      return 0.8;
    case 'visionary':
    case 'visionario': 
      return 0.9;
    case 'inspired':
    case 'inspirado': 
      return 1.0;
    default: 
      return 0.7;
  }
}