/**
 * LLM API 客户端
 * 使用扣子 (Coze) API
 * 
 * 配置方式：
 * - 环境变量 COZE_API_KEY: API 密钥
 * - 环境变量 COZE_MODEL: 模型名称（可选，默认 doubao-pro-1.5）
 * 
 * Vercel 配置：
 * Settings -> Environment Variables -> 添加以下变量
 * - COZE_API_KEY
 * - COZE_MODEL
 */

// ============================================
// 环境变量获取（兼容多运行时）
// ============================================

interface EnvVars {
  COZE_API_KEY?: string;
  COZE_MODEL?: string;
}

/**
 * 获取环境变量
 * 兼容 Vercel Edge Runtime 和 Node.js 环境
 */
function getEnv(): EnvVars {
  // Vercel Edge Runtime 环境
  if (typeof process !== 'undefined' && process.env) {
    return {
      COZE_API_KEY: process.env.COZE_API_KEY,
      COZE_MODEL: process.env.COZE_MODEL,
    };
  }
  
  // 浏览器环境（仅用于开发）
  if (typeof window !== 'undefined' && (window as any).COZE_API_KEY) {
    return {
      COZE_API_KEY: (window as any).COZE_API_KEY,
      COZE_MODEL: (window as any).COZE_MODEL,
    };
  }
  
  return {};
}

// ============================================
// API 配置
// ============================================

// 扣子 API 端点
const API_ENDPOINT = 'https://api.coze.cn/v1/chat/completions';

// 默认模型
const DEFAULT_MODEL = 'doubao-pro-1.5';

// LLM 响应类型
export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 获取 API Key
 */
function getApiKey(): string {
  const env = getEnv();
  const apiKey = env.COZE_API_KEY;
  
  if (!apiKey) {
    throw new Error('请配置 COZE_API_KEY 环境变量');
  }
  
  return apiKey;
}

/**
 * 获取模型名称
 */
function getModel(): string {
  const env = getEnv();
  return env.COZE_MODEL || DEFAULT_MODEL;
}

/**
 * 调用扣子 API
 * 文档：https://docs.coze.cn/api-reference/chat-completions
 */
export async function callCozeLLM(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse> {
  const apiKey = getApiKey();
  const model = getModel();

  // 设置超时时间（120秒）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('扣子 API 错误:', response.status, errorText);
      throw new Error(`扣子 API 请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        };
      }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API 请求超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 流式调用扣子 API
 */
export async function* streamCozeLLM(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const apiKey = getApiKey();
  const model = getModel();

  // 设置超时时间（120秒）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`扣子 API 请求失败: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // 解析 SSE 数据
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{
                delta?: {
                  content?: string;
                };
              }>;
            };
            
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API 请求超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 统一的 LLM 调用接口
 */
export async function callLLM(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse> {
  return callCozeLLM(systemPrompt, userContent, options);
}

/**
 * 流式 LLM 调用接口
 */
export async function* streamLLM(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string, void, unknown> {
  yield* streamCozeLLM(systemPrompt, userContent, options);
}
