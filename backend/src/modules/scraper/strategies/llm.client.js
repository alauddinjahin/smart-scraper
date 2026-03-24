const { OPENROUTER_API_KEY, OPENAI_API_KEY, OPENROUTER_BASE_URL, CLIENT_ORIGIN } = require('../../../shared/config/env');

class LLMDetection {

    makeLlmClient() {
      const { OpenAI } = require('openai');
      const openRouterKey = (OPENROUTER_API_KEY || '').trim();
      const openAiKey     = (OPENAI_API_KEY     || '').trim();
      const useOpenRouter = openRouterKey.length > 10;
      if (!useOpenRouter && openAiKey.length < 10) {
        throw new Error('No valid LLM API key — set OPENROUTER_API_KEY or OPENAI_API_KEY in .env');
      }
    
      return {
        client: new OpenAI({
          apiKey: useOpenRouter ? openRouterKey : openAiKey,
          ...(useOpenRouter && {
            baseURL: (OPENROUTER_BASE_URL).trim(),
            defaultHeaders: {
              'HTTP-Referer': CLIENT_ORIGIN || 'http://localhost:3000',
              'X-Title':      'UniScraper',
            },
          }),
        }),
        model: useOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      };
    }

}

module.exports = new LLMDetection();