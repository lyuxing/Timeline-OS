# LLM 抽象层架构设计

## 设计原则

1. **Provider 无关** — 上层业务代码不依赖具体 LLM Provider
2. **配置驱动** — 通过配置文件切换 Provider，无需改代码
3. **统一接口** — 所有 Provider 实现相同的 Interface
4. **流式优先** — 支持流式响应，提升用户体验
5. **成本可控** — 支持Token计数、成本估算

---

## 接口定义

```typescript
// 核心接口
interface LLMProvider {
  name: string
  chat(params: ChatParams): Promise<ChatResponse>
  chatStream(params: ChatParams): AsyncGenerator<string>
  countTokens(text: string): number
  estimateCost(tokens: number): number
}

// 请求参数
interface ChatParams {
  messages: Message[]
  model?: string        // Provider 默认模型
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  stopSequences?: string[]
}

// 响应结构
interface ChatResponse {
  content: string
  tokensUsed: { input: number, output: number }
  model: string
  latencyMs: number
}

// 消息格式
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}
```

---

## Provider 实现

### 1. Claude Provider (Anthropic)

```typescript
class ClaudeProvider implements LLMProvider {
  name = 'claude'
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: params.model || 'claude-sonnet-4-6',
      max_tokens: params.maxTokens || 4096,
      messages: params.messages,
      system: params.systemPrompt,
    })
    return {
      content: response.content[0].text,
      tokensUsed: { input: response.usage.input_tokens, output: response.usage.output_tokens },
      model: response.model,
      latencyMs: 0,
    }
  }

  async *chatStream(params: ChatParams): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: params.model || 'claude-sonnet-4-6',
      max_tokens: params.maxTokens || 4096,
      messages: params.messages,
      system: params.systemPrompt,
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        yield event.delta.text
      }
    }
  }

  countTokens(text: string): number {
    // Anthropic 不提供直接计数，用近似值
    return Math.ceil(text.length / 4)
  }

  estimateCost(tokens: number): number {
    // Sonnet 4.6 价格: $3/M input, $15/M output (approx)
    return tokens * 0.003 / 1000
  }
}
```

### 2. OpenAI Provider

```typescript
class OpenAIProvider implements LLMProvider {
  name = 'openai'
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const messages = params.systemPrompt
      ? [{ role: 'system', content: params.systemPrompt }, ...params.messages]
      : params.messages

    const response = await this.client.chat.completions.create({
      model: params.model || 'gpt-4o',
      max_tokens: params.maxTokens || 4096,
      messages,
      temperature: params.temperature,
    })

    return {
      content: response.choices[0].message.content,
      tokensUsed: { input: response.usage.prompt_tokens, output: response.usage.completion_tokens },
      model: response.model,
      latencyMs: 0,
    }
  }

  async *chatStream(params: ChatParams): AsyncGenerator<string> {
    const messages = params.systemPrompt
      ? [{ role: 'system', content: params.systemPrompt }, ...params.messages]
      : params.messages

    const stream = await this.client.chat.completions.create({
      model: params.model || 'gpt-4o',
      messages,
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) yield delta
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  estimateCost(tokens: number): number {
    // GPT-4o: $2.5/M input, $10/M output
    return tokens * 0.0025 / 1000
  }
}
```

### 3. 本地模型 Provider (Ollama)

```typescript
class OllamaProvider implements LLMProvider {
  name = 'ollama'
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: params.model || 'llama3',
        messages: params.messages,
        stream: false,
      }),
    })
    const data = await response.json()
    return {
      content: data.message.content,
      tokensUsed: { input: 0, output: 0 }, // Ollama 不返回 token 数
      model: data.model,
      latencyMs: 0,
    }
  }

  async *chatStream(params: ChatParams): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      body: JSON.stringify({
        model: params.model || 'llama3',
        messages: params.messages,
        stream: true,
      }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(Boolean)
      for (const line of lines) {
        const data = JSON.parse(line)
        if (data.message?.content) yield data.message.content
      }
    }
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  estimateCost(tokens: number): number {
    return 0 // 本地模型免费
  }
}
```

### 4. DeepSeek Provider（高性价比选择）

```typescript
class DeepSeekProvider implements LLMProvider {
  name = 'deepseek'
  private apiKey: string
  private baseUrl = 'https://api.deepseek.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    // DeepSeek API 与 OpenAI 格式兼容
    const messages = params.systemPrompt
      ? [{ role: 'system', content: params.systemPrompt }, ...params.messages]
      : params.messages

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'deepseek-chat',
        messages,
        max_tokens: params.maxTokens || 4096,
      }),
    })
    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      tokensUsed: { input: data.usage.prompt_tokens, output: data.usage.completion_tokens },
      model: data.model,
      latencyMs: 0,
    }
  }

  // stream 实现类似 OpenAI...

  countTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  estimateCost(tokens: number): number {
    // DeepSeek: $0.14/M input, $0.28/M output (极低)
    return tokens * 0.00014 / 1000
  }
}
```

---

## Provider 工厂

```typescript
// config/llm.yaml
provider: claude      # 当前使用的 Provider
model: claude-sonnet-4-6

providers:
  claude:
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-sonnet-4-6
  openai:
    apiKey: ${OPENAI_API_KEY}
    model: gpt-4o
  ollama:
    baseUrl: http://localhost:11434
    model: llama3
  deepseek:
    apiKey: ${DEEPSEEK_API_KEY}
    model: deepseek-chat
```

```typescript
// Provider 工厂
class LLMFactory {
  private providers: Map<string, LLMProvider> = new Map()
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    this.initProviders()
  }

  private initProviders() {
    const { providers } = this.config

    if (providers.claude?.apiKey) {
      this.providers.set('claude', new ClaudeProvider(providers.claude.apiKey))
    }
    if (providers.openai?.apiKey) {
      this.providers.set('openai', new OpenAIProvider(providers.openai.apiKey))
    }
    if (providers.ollama?.baseUrl) {
      this.providers.set('ollama', new OllamaProvider(providers.ollama.baseUrl))
    }
    if (providers.deepseek?.apiKey) {
      this.providers.set('deepseek', new DeepSeekProvider(providers.deepseek.apiKey))
    }
  }

  getProvider(name?: string): LLMProvider {
    const providerName = name || this.config.provider
    const provider = this.providers.get(providerName)
    if (!provider) throw new Error(`Provider ${providerName} not configured`)
    return provider
  }

  // 切换 Provider
  switchProvider(name: string) {
    if (!this.providers.has(name)) throw new Error(`Provider ${name} not available`)
    this.config.provider = name
  }

  // 获取所有可用 Provider
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}
```

---

## 使用示例

```typescript
// 初始化
const llmFactory = new LLMFactory(loadConfig('config/llm.yaml'))
const llm = llmFactory.getProvider()

// 基础调用
const response = await llm.chat({
  messages: [{ role: 'user', content: '帮我拆解这个任务...' }],
  systemPrompt: '你是项目助手...',
})

// 流式调用
for await (const chunk of llm.chatStream({
  messages: [{ role: 'user', content: '分析项目进度...' }],
})) {
  process.stdout.write(chunk)
}

// 切换 Provider
llmFactory.switchProvider('deepseek')  // 成本更低
const cheapLLM = llmFactory.getProvider()
```

---

## 成本对比参考

| Provider      | Input ($/M) | Output ($/M) | 备注              |
|---------------|-------------|--------------|-------------------|
| Claude Sonnet | $3          | $15          | 高质量、长上下文   |
| Claude Haiku  | $0.25       | $1.25        | 快速、低成本       |
| GPT-4o        | $2.5        | $10          | 综合能力强        |
| GPT-4o-mini   | $0.15       | $0.6         | ���成本            |
| DeepSeek      | $0.14       | $0.28        | 极低成本          |
| Ollama (本地) | $0          | $0           | 免费、需本地硬件   |

建议策略：
- 复杂分析用 Claude/GPT-4
- 简单建议用 DeepSeek/Haiku/GPT-mini
- 开发调试用本地 Ollama