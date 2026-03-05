/**
 * LLM API 客户端
 * 使用硅基流动 (SiliconFlow) API
 * 
 * 配置方式：
 * - 环境变量 SILICONFLOW_API_KEY: API 密钥
 * - 环境变量 SILICONFLOW_MODEL: 模型名称（可选，默认 deepseek-ai/DeepSeek-V3.2）
 * 
 * Cloudflare Pages 配置：
 * Dashboard -> Settings -> Environment variables -> 添加以下变量
 * - SILICONFLOW_API_KEY
 * - SILICONFLOW_MODEL
 */

// ============================================
// 环境变量获取（兼容多运行时）
// ============================================

interface EnvVars {
  SILICONFLOW_API_KEY?: string;
  SILICONFLOW_MODEL?: string;
}

/**
 * 获取环境变量
 * 兼容 Cloudflare Workers 和 Node.js 环境
 */
function getEnv(): EnvVars {
  // Cloudflare Workers / Pages 环境
  if (typeof globalThis !== 'undefined') {
    const g = globalThis as any;
    if (g.SILICONFLOW_API_KEY) {
      return {
        SILICONFLOW_API_KEY: g.SILICONFLOW_API_KEY,
        SILICONFLOW_MODEL: g.SILICONFLOW_MODEL,
      };
    }
  }
  
  // Node.js 环境
  if (typeof process !== 'undefined' && process.env) {
    return {
      SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY,
      SILICONFLOW_MODEL: process.env.SILICONFLOW_MODEL,
    };
  }
  
  return {};
}

// ============================================
// API 配置
// ============================================

// 硅基流动 API 端点
const API_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions';

// 默认模型
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3.2';

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
  const apiKey = env.SILICONFLOW_API_KEY;
  
  if (!apiKey) {
    throw new Error('请配置 SILICONFLOW_API_KEY 环境变量');
  }
  
  return apiKey;
}

/**
 * 获取模型名称
 */
function getModel(): string {
  const env = getEnv();
  return env.SILICONFLOW_MODEL || DEFAULT_MODEL;
}

/**
 * 调用硅基流动 API
 * 文档：https://docs.siliconflow.cn/api-reference/chat-completions
 */
export async function callSiliconFlowLLM(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResponse> {
  const apiKey = getApiKey();
  const model = getModel();

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
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('硅基流动 API 错误:', response.status, errorText);
    throw new Error(`硅基流动 API 请求失败: ${response.status} - ${errorText}`);
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
}

/**
 * 流式调用硅基流动 API
 */
export async function* streamSiliconFlowLLM(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const apiKey = getApiKey();
  const model = getModel();

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
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`硅基流动 API 请求失败: ${response.status} - ${errorText}`);
  }

  if (!response.body) {
    throw new Error('响应体为空');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
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
  } finally {
    reader.releaseLock();
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
  return callSiliconFlowLLM(systemPrompt, userContent, options);
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
  yield* streamSiliconFlowLLM(systemPrompt, userContent, options);
}
