import OpenAI from 'openai';

/**
 * AI Provider & Service Abstraction Layer
 * 
 * Provides an environment-configured, provider-agnostic interface for generating
 * structured JSON responses. Supports OpenAI SDK with automatic, development-friendly
 * fallback mode when no API key is configured.
 */

// Global client instance cache
let openAiClient = null;

/**
 * Helper to get sanitized AI configuration (never leaks credentials)
 */
export const getAiConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase().trim();
  const model = process.env.AI_MODEL || (provider === 'openai' ? 'gpt-4o-mini' : 'default');
  const apiKey = process.env.OPENAI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim() && apiKey !== 'your_openai_api_key_here');

  return {
    provider,
    model,
    isConfigured,
  };
};

/**
 * Lazily instantiate and retrieve OpenAI client instance
 */
const getOpenAiClient = () => {
  const { isConfigured } = getAiConfig();
  if (!isConfigured) {
    return null;
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openAiClient;
};

/**
 * Sanitize error messages to ensure API keys, authorization tokens, or internal URLs
 * are never leaked to callers or logs.
 */
const sanitizeErrorMessage = (error) => {
  if (!error) return 'Unknown AI service error';

  let msg = typeof error === 'string' ? error : error.message || 'Internal AI provider error';

  // Redact potential API keys (e.g. sk-..., Bearer ...)
  msg = msg.replace(/sk-[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]');
  msg = msg.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');

  // Common OpenAI specific error hints without raw stack leaks
  if (error.status === 401) {
    return 'AI Authentication failed: The configured API key is invalid or expired.';
  }
  if (error.status === 429) {
    return 'AI Rate Limit or Quota exceeded. Please check your AI provider plan or credits.';
  }
  if (error.status === 500 || error.status === 503) {
    return 'AI Provider service is temporarily unavailable. Please retry shortly.';
  }

  return msg;
};

/**
 * Main structured response generator function.
 * 
 * @param {Object} params
 * @param {string} params.systemPrompt - Instructions defining persona, constraints, and format
 * @param {string} params.userPrompt - User input or requirement payload
 * @param {Object} [params.schema] - Optional JSON schema definition or guide for the output structure
 * @param {Object} [params.fallbackData] - Data to return when running in development fallback mode
 * @returns {Promise<{ provider: string, model?: string, isFallback: boolean, data: any, message?: string }>}
 */
export async function generateStructuredResponse({
  systemPrompt = '',
  userPrompt = '',
  schema = null,
  fallbackData = null,
}) {
  const { provider, model, isConfigured } = getAiConfig();

  // 1. Check if we should execute in development fallback mode
  if (!isConfigured || provider === 'fallback') {
    return {
      provider: 'fallback',
      isFallback: true,
      model: 'fallback-rules-engine',
      message: 'No active AI API key configured. Operating in development fallback mode.',
      data: fallbackData || {
        status: 'fallback_mode_active',
        note: 'Configure AI_PROVIDER and OPENAI_API_KEY in server/.env to enable live AI responses.',
      },
    };
  }

  // 2. Provider: OpenAI
  if (provider === 'openai') {
    const client = getOpenAiClient();
    if (!client) {
      return {
        provider: 'fallback',
        isFallback: true,
        message: 'OpenAI client could not be initialized. Operating in fallback mode.',
        data: fallbackData || {},
      };
    }

    try {
      const messages = [];

      // System instruction with JSON enforcement
      let systemContent = systemPrompt ? `${systemPrompt}\n\n` : '';
      systemContent += 'You MUST respond strictly with valid JSON. Do not include markdown formatting like ```json or surrounding text.';
      
      if (schema) {
        systemContent += `\nExpected JSON Schema or structure:\n${JSON.stringify(schema, null, 2)}`;
      }

      messages.push({ role: 'system', content: systemContent });
      messages.push({ role: 'user', content: userPrompt });

      const completion = await client.chat.completions.create({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for structured accuracy
      });

      const responseContent = completion.choices?.[0]?.message?.content;

      if (!responseContent) {
        throw new Error('AI provider returned an empty response content');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseContent);
      } catch (parseErr) {
        throw new Error(`Failed to parse AI output as structured JSON: ${parseErr.message}`);
      }

      return {
        provider: 'openai',
        model,
        isFallback: false,
        data: parsedData,
        usage: completion.usage || null,
      };
    } catch (err) {
      const sanitized = sanitizeErrorMessage(err);
      console.error('[aiService Error]:', sanitized);

      // Create descriptive error without leaking secret tokens
      const errorObj = new Error(sanitized);
      errorObj.provider = 'openai';
      errorObj.statusCode = err.status || 502;
      throw errorObj;
    }
  }

  // Unsupported provider configured
  const unsupportedMsg = `Unsupported AI_PROVIDER: '${provider}'. Supported options: 'openai' or 'fallback'.`;
  console.warn(`[aiService] ${unsupportedMsg}`);
  return {
    provider: 'fallback',
    isFallback: true,
    message: unsupportedMsg,
    data: fallbackData || {},
  };
}

/**
 * Health and status inspector for the AI service.
 * Safely inspects configuration status without exposing sensitive credentials.
 * 
 * @returns {{ provider: string, model: string, isConfigured: boolean, isFallback: boolean }}
 */
export function getAiServiceStatus() {
  const { provider, model, isConfigured } = getAiConfig();
  return {
    provider: isConfigured ? provider : 'fallback',
    model,
    isConfigured,
    isFallback: !isConfigured || provider === 'fallback',
  };
}

export default {
  generateStructuredResponse,
  getAiServiceStatus,
  getAiConfig,
};
