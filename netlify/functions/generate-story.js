import axios from 'axios';

export async function handler(event, context) {
  // Allow only POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const storyParams = JSON.parse(event.body);

    // Get the OpenAI API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key is not configured' }),
      };
    }

    // Validate required parameters
    if (!storyParams.topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic is required' }),
      };
    }

    // Determine the language (default to Spanish)
    const language = storyParams.language || 'es';
    const systemMessage = getSystemMessage(language);

    // Construct the prompt based on parameters
    const prompt = constructPrompt(storyParams, language);

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: getMaxTokens(storyParams.length),
        temperature: getTemperature(storyParams.creativityLevel),
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract the story content from the response
    const storyContent = response.data.choices[0].message.content.trim();

    // Extract or generate a title
    const title = extractTitle(storyContent, storyParams.topic, language);

    // Return the story data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content: storyContent,
        parameters: storyParams,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);

    let errorMessage = 'Failed to generate story';
    let statusCode = 500;

    // Handle specific error cases
    if (error.response?.status === 401) {
      errorMessage = 'Invalid API key';
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded';
      statusCode = 429;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message || errorMessage;
    }

    return {
      statusCode,
      body: JSON.stringify({ error: errorMessage }),
    };
  }
}

// Helper functions (constructPrompt, getSystemMessage, getMaxTokens, getTemperature, extractTitle)
// Mantén estas funciones como están, pero asegúrate de que no usen `require`.