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
let lastUsedApiKey = null;
let lastUsedBaseUrl = null;
let rateLimitCooldownUntil = 0;

/**
 * Helper to get sanitized AI configuration (never leaks credentials)
 */
export const getAiConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase().trim();

  // Support OPENAI_API_KEY, OPEN_API_KEY, and AI_API_KEY, with quote trimming
  let apiKey = (
    process.env.OPENAI_API_KEY ||
    process.env.OPEN_API_KEY ||
    process.env.open_api_key ||
    process.env.AI_API_KEY ||
    ''
  ).trim();

  // Strip leading and trailing quotes if user pasted them
  apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

  const isConfigured = Boolean(
    apiKey &&
    apiKey.length > 5 &&
    apiKey !== 'your_openai_api_key_here' &&
    apiKey !== 'YOUR_API_KEY_HERE'
  );

  // Auto-detect provider & model from key prefix
  let defaultModel = 'gpt-4o-mini';
  let baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || null;

  if (apiKey.startsWith('gsk_')) {
    baseURL = baseURL || 'https://api.groq.com/openai/v1';
    defaultModel = 'qwen/qwen3.8-27b';
  } else if (apiKey.startsWith('sk-or-')) {
    baseURL = baseURL || 'https://openrouter.ai/api/v1';
    defaultModel = 'meta-llama/llama-3.1-8b-instruct:free';
  }

  let model = defaultModel;
  if (process.env.AI_MODEL) {
    const envModel = process.env.AI_MODEL.trim();
    if (apiKey.startsWith('gsk_')) {
      model = envModel.toLowerCase().includes('120b') ? 'qwen/qwen3.8-27b' : envModel;
    } else {
      model = envModel;
    }
  }

  return {
    provider: isConfigured ? (apiKey.startsWith('gsk_') ? 'groq' : provider) : 'fallback',
    model,
    apiKey,
    baseURL,
    isConfigured,
  };
};

/**
 * Lazily instantiate and retrieve OpenAI client instance with auto-refresh
 */
const getOpenAiClient = () => {
  const { isConfigured, apiKey, baseURL } = getAiConfig();
  if (!isConfigured) {
    return null;
  }

  // Refresh client if key or baseURL changed
  if (!openAiClient || lastUsedApiKey !== apiKey || lastUsedBaseUrl !== baseURL) {
    const clientOptions = {
      apiKey,
      timeout: 12000, // 12-second per-call timeout prevents hanging the orchestrator
      maxRetries: 0, // Disable slow SDK backoff retries in real-time user workflows
    };
    if (baseURL) {
      clientOptions.baseURL = baseURL;
    }
    openAiClient = new OpenAI(clientOptions);
    lastUsedApiKey = apiKey;
    lastUsedBaseUrl = baseURL;
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
  const { provider, model, isConfigured, apiKey } = getAiConfig();

  // 1. Check if we should execute in development fallback mode or active rate limit cooldown
  if (!isConfigured || provider === 'fallback' || Date.now() < rateLimitCooldownUntil) {
    return {
      provider: 'fallback',
      isFallback: true,
      model: 'fallback-rules-engine',
      message: Date.now() < rateLimitCooldownUntil
        ? 'AI provider temporarily rate limited; using high-speed deterministic engine.'
        : 'No active AI API key configured. Operating in development fallback mode.',
      data: fallbackData || {
        status: 'fallback_mode_active',
        note: 'Operating with deterministic travel intelligence.',
      },
    };
  }

  // 2. Provider: OpenAI / Groq / OpenAI-compatible
  if (provider === 'openai' || provider === 'groq' || isConfigured) {
    const client = getOpenAiClient();
    if (!client) {
      return {
        provider: 'fallback',
        isFallback: true,
        message: 'AI client could not be initialized. Operating in fallback mode.',
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

      // Candidate models for auto-fallback (e.g. Groq qwen/20b/120b)
      const modelsToTry = [model];
      if (apiKey && apiKey.startsWith('gsk_')) {
        ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'].forEach((alt) => {
          if (!modelsToTry.includes(alt)) modelsToTry.push(alt);
        });
      }

      let completion = null;
      let usedModel = model;
      let lastAttemptError = null;

      for (const candidateModel of modelsToTry) {
        try {
          try {
            completion = await client.chat.completions.create({
              model: candidateModel,
              messages,
              response_format: { type: 'json_object' },
              temperature: 0.3,
            });
          } catch (paramErr) {
            const errText = (paramErr?.message || '').toLowerCase();
            if (
              errText.includes('response_format') ||
              errText.includes('unsupported parameter') ||
              errText.includes('extra fields') ||
              errText.includes('schema') ||
              errText.includes('validate json') ||
              paramErr.status === 400
            ) {
              completion = await client.chat.completions.create({
                model: candidateModel,
                messages,
                temperature: 0.3,
              });
            } else {
              throw paramErr;
            }
          }
          if (completion) {
            usedModel = candidateModel;
            break;
          }
        } catch (candidateErr) {
          lastAttemptError = candidateErr;
          console.warn(`[aiService] Model ${candidateModel} failed (${candidateErr.message}), trying next model...`);
          if (modelsToTry.indexOf(candidateModel) < modelsToTry.length - 1) {
            continue;
          }
          throw candidateErr;
        }
      }

      if (!completion) {
        throw lastAttemptError || new Error('All candidate AI models failed to return a completion');
      }

      const responseContent = completion.choices?.[0]?.message?.content;

      if (!responseContent) {
        throw new Error('AI provider returned an empty response content');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseContent);
      } catch (_) {
        const cleanJson = responseContent.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const start = cleanJson.indexOf('{');
        const end = cleanJson.lastIndexOf('}');
        const startArr = cleanJson.indexOf('[');
        const endArr = cleanJson.lastIndexOf(']');

        if (startArr !== -1 && (start === -1 || startArr < start) && endArr > startArr) {
          parsedData = JSON.parse(cleanJson.slice(startArr, endArr + 1));
        } else if (start !== -1 && end !== -1) {
          parsedData = JSON.parse(cleanJson.slice(start, end + 1));
        } else {
          throw new Error('Failed to parse AI output as structured JSON');
        }
      }

      return {
        provider: provider || 'openai',
        model: usedModel,
        isFallback: false,
        data: parsedData,
        usage: completion.usage || null,
      };
    } catch (err) {
      // If rate limited or quota exceeded across all models, trigger temporary 10-second cooldown
      if (
        err.status === 429 ||
        err.statusCode === 429 ||
        (err.message && err.message.toLowerCase().includes('rate limit')) ||
        (err.message && err.message.toLowerCase().includes('quota'))
      ) {
        rateLimitCooldownUntil = Date.now() + 10000;
      }

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
