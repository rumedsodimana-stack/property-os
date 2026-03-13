/**
 * AI Provider Service - Real OpenAI/Gemini Integration
 * 
 * Handles API communication with AI providers for document analysis,
 * code generation, and intelligent decision making.
 */

// Environment configuration
export interface AIConfig {
    provider: 'openai' | 'gemini' | 'anthropic' | 'ollama';
    apiKey: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string; // Standard system prompt
    ollamaUrl?: string; // Custom Ollama server URL
    /** Native message history (turn-based) */
    messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

interface RateLimitConfig {
    requestsPerMinute: number;
    tokensPerMinute: number;
    maxRetries: number;
    retryDelay: number;
}

interface TokenUsage {
    prompt: number;
    completion: number;
    total: number;
    cost: number;
}

interface AIResponse {
    content: string;
    usage: TokenUsage;
    model: string;
    timestamp: string;
}

class AIProvider {
    private config: AIConfig;
    private rateLimitConfig: RateLimitConfig;
    private requestQueue: Array<() => Promise<any>> = [];
    private processingQueue = false;
    private tokenUsageLog: TokenUsage[] = [];
    private requestCount = 0;
    private lastResetTime = Date.now();
    private readonly runtimeStorageKey = 'hs_ai_runtime_config';
    private rateLimitIntervalId: ReturnType<typeof setInterval> | null = null;
    private feedbackMemory: Array<{ proposal: any; approved: boolean; feedback?: string; timestamp: string }> = [];

    constructor(config?: Partial<AIConfig>) {
        // Safe access to environment variables (supports browser/Vite and Node/Vitest)
        const getEnv = (key: string): string => {
            try {
                const env = (import.meta as { env?: Record<string, string> }).env;
                if (env && typeof env[key] === 'string') return env[key];
            } catch (e) {
                if (e instanceof Error) console.debug('[AI Provider] getEnv import.meta:', e.message);
            }
            try {
                if (typeof process !== 'undefined' && process.env && process.env[key]) {
                    return process.env[key] as string;
                }
            } catch (e) {
                if (e instanceof Error) console.debug('[AI Provider] getEnv process:', e.message);
            }
            return '';
        };

        this.config = {
            provider: (getEnv('VITE_AI_PROVIDER') as 'openai' | 'gemini' | 'anthropic' | 'ollama') || 'anthropic',
            apiKey: getEnv('VITE_ANTHROPIC_API_KEY') || getEnv('VITE_OPENAI_API_KEY') || getEnv('VITE_GEMINI_API_KEY') || '',
            model: config?.model || 'claude-3-haiku-20240307',
            maxTokens: config?.maxTokens || 4000,
            temperature: config?.temperature || 0.7,
            ollamaUrl: getEnv('VITE_OLLAMA_URL') || 'http://localhost:11434',
            ...config
        };
        this.loadRuntimeConfig();
        if (!this.config.model) {
            this.config.model = this.getDefaultModelForProvider(this.config.provider);
        }

        this.rateLimitConfig = {
            requestsPerMinute: 60,
            tokensPerMinute: 90000,
            maxRetries: 3,
            retryDelay: 1000
        };

        // Reset counters every minute (cleared on teardown)
        this.rateLimitIntervalId = setInterval(() => {
            this.requestCount = 0;
            this.lastResetTime = Date.now();
        }, 60000);
    }

    /** Call to clear intervals and prevent memory leaks */
    destroy(): void {
        if (this.rateLimitIntervalId !== null) {
            clearInterval(this.rateLimitIntervalId);
            this.rateLimitIntervalId = null;
        }
    }

    /**
     * Runtime config bridge for UI controls.
     * Changes are persisted and immediately applied to all AI calls.
     */
    updateRuntimeConfig(updates: Partial<AIConfig>): void {
        const nextProvider = updates.provider || this.config.provider;
        const providerChanged = typeof updates.provider === 'string' && updates.provider !== this.config.provider;
        const currentModel = this.config.model || '';
        const modelChanged = typeof updates.model === 'string' && updates.model.trim().length > 0;

        this.config = {
            ...this.config,
            ...updates,
            provider: nextProvider,
            model: modelChanged
                ? updates.model
                : providerChanged
                    ? this.getDefaultModelForProvider(nextProvider)
                    : currentModel || this.getDefaultModelForProvider(nextProvider),
        };

        this.persistRuntimeConfig();
    }

    getRuntimeConfig(): AIConfig {
        return { ...this.config };
    }

    /**
     * Analyze brand document with AI
     */
    async analyzeDocument(
        documentText: string,
        documentType: string,
        analysisType: 'full' | 'colors' | 'policies' | 'workflows' = 'full'
    ): Promise<AIResponse> {
        const prompt = this.buildAnalysisPrompt(documentText, documentType, analysisType);
        return this.makeRequest(prompt, {
            temperature: 0.3 // Lower temperature for factual extraction
        });
    }

    /**
     * Generate code based on brand requirements
     */
    async generateCode(
        requirement: string,
        targetFile: string,
        context: string
    ): Promise<AIResponse> {
        const prompt = this.buildCodeGenPrompt(requirement, targetFile, context);
        return this.makeRequest(prompt, {
            temperature: 0.2 // Very low for code generation
        });
    }

    /**
     * Explain proposed changes to admin
     */
    async explainChange(
        change: any,
        context: string
    ): Promise<AIResponse> {
        const prompt = `Explain the following system change in simple terms for a hotel manager:

Change: ${JSON.stringify(change, null, 2)}
Context: ${context}

Provide:
1. What will change
2. Why it's recommended
3. Potential impact
4. Risk level

Keep it concise and non-technical.`;

        return this.makeRequest(prompt, {
            temperature: 0.5
        });
    }

    /**
     * Learn from admin feedback
     */
    async learnFromFeedback(
        proposal: any,
        approved: boolean,
        feedback?: string
    ): Promise<void> {
        const learningData = {
            proposal,
            approved,
            feedback,
            timestamp: new Date().toISOString()
        };

        // Persist locally so feedback is not lost between sessions.
        try {
            const key = 'hs_ai_feedback_log';
            const existingRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            const next = Array.isArray(existing) ? [...existing, learningData].slice(-500) : [learningData];
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(next));
            }
            this.feedbackMemory = next;
        } catch (err) {
            // Fall back to in-memory buffer so data is still usable in-process
            this.feedbackMemory = [...this.feedbackMemory, learningData].slice(-500);
            console.warn('[AI Learning] Persisting feedback locally failed; stored in memory only.', err);
        }

        // Hook point: vector DB or analytics pipeline can consume feedbackMemory later.
    }

    /**
     * Make API request with rate limiting and retries
     */
    private async makeRequest(
        prompt: string,
        options?: Partial<AIConfig>
    ): Promise<AIResponse> {
        return new Promise((resolve, reject) => {
            const requestFn = async () => {
                try {
                    const response = await this.executeRequest(prompt, options);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            };

            this.requestQueue.push(requestFn);
            this.processQueue();
        });
    }

    /**
     * Process request queue with rate limiting
     */
    private async processQueue() {
        if (this.processingQueue || this.requestQueue.length === 0) {
            return;
        }

        this.processingQueue = true;

        while (this.requestQueue.length > 0) {
            // Check rate limits
            if (this.requestCount >= this.rateLimitConfig.requestsPerMinute) {
                console.warn('[AI Provider] Rate limit reached, waiting...');
                await this.sleep(60000 - (Date.now() - this.lastResetTime));
                continue;
            }

            const requestFn = this.requestQueue.shift();
            if (requestFn) {
                this.requestCount++;
                await requestFn();

                // Small delay between requests
                await this.sleep(100);
            }
        }

        this.processingQueue = false;
    }

    /**
     * Execute actual API call
     */
    public async executeRequest(
        prompt: string,
        options?: Partial<AIConfig>
    ): Promise<AIResponse> {
        const config = { ...this.config, ...options };

        if (!config.apiKey && config.provider !== 'ollama') {
            throw new Error('AI API key not configured. Set VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, or VITE_ANTHROPIC_API_KEY');
        }

        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < this.rateLimitConfig.maxRetries) {
            try {
                if (config.provider === 'openai') {
                    return await this.callOpenAI(prompt, config);
                } else if (config.provider === 'anthropic') {
                    return await this.callAnthropic(prompt, config);
                } else if (config.provider === 'ollama') {
                    return await this.callOllama(prompt, config);
                } else {
                    return await this.callGemini(prompt, config);
                }
            } catch (error: any) {
                lastError = error;
                attempt++;

                // Exponential backoff
                if (attempt < this.rateLimitConfig.maxRetries) {
                    const delay = this.rateLimitConfig.retryDelay * Math.pow(2, attempt - 1);
                    console.warn(`[AI Provider] Retry ${attempt}/${this.rateLimitConfig.maxRetries} after ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }

        throw new Error(`AI request failed after ${this.rateLimitConfig.maxRetries} retries: ${lastError?.message}`);
    }

    /**
     * Streaming request — emits tokens via onToken callback while building the full response.
     * Falls back to non-streaming if the provider/transport does not support streaming.
     */
    public async streamRequest(
        prompt: string,
        options: Partial<AIConfig> = {},
        onToken?: (token: string) => void
    ): Promise<AIResponse> {
        const config = { ...this.config, ...options };

        if (!config.apiKey && config.provider !== 'ollama') {
            throw new Error('AI API key not configured. Set VITE_OPENAI_API_KEY, VITE_GEMINI_API_KEY, or VITE_ANTHROPIC_API_KEY');
        }

        try {
            if (config.provider === 'openai') {
                return await this.streamOpenAI(prompt, config, onToken);
            }
            if (config.provider === 'anthropic') {
                return await this.streamAnthropic(prompt, config, onToken);
            }
            // Providers without streaming support: simulate fast streaming by chunking the final response
            const fallback = await this.executeRequest(prompt, options);
            if (onToken) {
                const chunks = fallback.content.match(/.{1,80}/g) || [fallback.content];
                for (const chunk of chunks) {
                    onToken(chunk);
                    await this.sleep(10);
                }
            }
            return fallback;
        } catch (error) {
            console.error('[AI Provider] Streaming failed, falling back to standard request:', error);
            const fallback = await this.executeRequest(prompt, options);
            if (onToken) {
                const chunks = fallback.content.match(/.{1,80}/g) || [fallback.content];
                for (const chunk of chunks) {
                    onToken(chunk);
                    await this.sleep(10);
                }
            }
            return fallback;
        }
    }

    /**
     * Call OpenAI API
     */
    private async callOpenAI(prompt: string, config: AIConfig): Promise<AIResponse> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model || 'gpt-4',
                messages: config.messages || [
                    {
                        role: 'system',
                        content: config.systemPrompt || 'You are an expert AI assistant for hotel property management systems, specializing in brand standards and operational optimization.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: config.maxTokens,
                temperature: config.temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const usage: TokenUsage = {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
            cost: this.calculateCost(data.usage, config.model || 'gpt-4')
        };

        this.tokenUsageLog.push(usage);

        return {
            content: data.choices[0].message.content,
            usage,
            model: data.model,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Call Ollama (Local AI)
     */
    private async callOllama(prompt: string, config: AIConfig): Promise<AIResponse> {
        const ollamaUrl = config.ollamaUrl || 'http://localhost:11434';
        const model = config.model || 'llama3.2';

        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: config.temperature || 0.7,
                    num_predict: config.maxTokens || 4000
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${errorText || response.statusText}`);
        }

        const data = await response.json();

        // Estimate token usage (Ollama doesn't provide exact counts)
        const estimatedPromptTokens = Math.ceil(prompt.length / 4);
        const estimatedCompletionTokens = Math.ceil((data.response?.length || 0) / 4);

        const usage: TokenUsage = {
            prompt: estimatedPromptTokens,
            completion: estimatedCompletionTokens,
            total: estimatedPromptTokens + estimatedCompletionTokens,
            cost: 0 // Ollama is completely free!
        };

        this.tokenUsageLog.push(usage);

        return {
            content: data.response,
            usage,
            model: model,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Call Anthropic Claude API
     * NOTE: Calls go through the Vite proxy (/api/anthropic → https://api.anthropic.com)
     * to avoid CORS issues in the browser. The proxy injects the API key header.
     */
    private async callAnthropic(prompt: string, config: AIConfig): Promise<AIResponse> {
        const model = config.model || 'claude-3-haiku-20240307';

        // Use Vite dev proxy to avoid CORS. In production, use a Firebase Function or similar.
        const url = '/api/anthropic/v1/messages';

        const anthropicMessages = config.messages
            ? config.messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content }))
            : [{ role: 'user', content: prompt }];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // x-api-key and anthropic-version are injected by the Vite proxy
            },
            body: JSON.stringify({
                model,
                system: config.systemPrompt, // Anthropic uses a separate 'system' parameter
                max_tokens: config.maxTokens || 4000,
                temperature: config.temperature || 0.7,
                messages: anthropicMessages
            })
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch { /* ignore JSON parse errors */ }
            throw new Error(`Anthropic API error (${response.status}): ${errorMessage}`);
        }

        const data = await response.json();
        const usage: TokenUsage = {
            prompt: data.usage.input_tokens,
            completion: data.usage.output_tokens,
            total: data.usage.input_tokens + data.usage.output_tokens,
            cost: this.calculateAnthropicCost(data.usage, model)
        };

        this.tokenUsageLog.push(usage);

        return {
            content: data.content[0].text,
            usage,
            model: data.model,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Call Google Gemini API
     */
    private async callGemini(prompt: string, config: AIConfig): Promise<AIResponse> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${config.model || 'gemini-pro'}:generateContent?key=${config.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    system_instruction: config.systemPrompt ? {
                        parts: [{ text: config.systemPrompt }]
                    } : undefined
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Estimate token usage (Gemini doesn't provide exact counts yet)
        const estimatedTokens = Math.ceil(prompt.length / 4);
        const usage: TokenUsage = {
            prompt: estimatedTokens,
            completion: estimatedTokens,
            total: estimatedTokens * 2,
            cost: 0 // Gemini pricing varies
        };

        this.tokenUsageLog.push(usage);

        return {
            content: data.candidates[0].content.parts[0].text,
            usage,
            model: config.model || 'gemini-pro',
            timestamp: new Date().toISOString()
        };
    }

    /**
    * Stream OpenAI responses via SSE
    */
    private async streamOpenAI(
        prompt: string,
        config: AIConfig,
        onToken?: (token: string) => void
    ): Promise<AIResponse> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model || 'gpt-4',
                messages: config.messages || [
                    {
                        role: 'system',
                        content: config.systemPrompt || 'You are an expert AI assistant for hotel property management systems, specializing in brand standards and operational optimization.'
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: config.maxTokens,
                temperature: config.temperature,
                stream: true
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenAI streaming error: ${error.error?.message || response.statusText}`);
        }

        if (!response.body) {
            throw new Error('OpenAI streaming not supported in this environment');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const dataStr = line.replace(/^data:\s*/, '').trim();
                if (!dataStr || dataStr === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(dataStr);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                        fullContent += delta;
                        onToken?.(delta);
                    }
                } catch {
                    // Ignore malformed chunks
                }
            }
        }

        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(fullContent.length / 4);
        const usage: TokenUsage = {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
            cost: this.calculateCost(
                { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens },
                config.model || 'gpt-4'
            )
        };

        this.tokenUsageLog.push(usage);

        return {
            content: fullContent,
            usage,
            model: config.model || 'gpt-4',
            timestamp: new Date().toISOString()
        };
    }

    /**
    * Stream Anthropic Claude responses via SSE
    */
    private async streamAnthropic(
        prompt: string,
        config: AIConfig,
        onToken?: (token: string) => void
    ): Promise<AIResponse> {
        const model = config.model || 'claude-3-haiku-20240307';
        const url = '/api/anthropic/v1/messages';

        const anthropicMessages = config.messages
            ? config.messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content }))
            : [{ role: 'user', content: prompt }];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // Proxy injects auth headers
            },
            body: JSON.stringify({
                model,
                system: config.systemPrompt,
                max_tokens: config.maxTokens || 4000,
                temperature: config.temperature || 0.7,
                messages: anthropicMessages,
                stream: true
            })
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch { /* ignore JSON parse errors */ }
            throw new Error(`Anthropic streaming error (${response.status}): ${errorMessage}`);
        }

        if (!response.body) {
            throw new Error('Anthropic streaming not supported in this environment');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line.startsWith('data:')) continue;
                const dataStr = line.replace(/^data:\s*/, '').trim();
                if (!dataStr || dataStr === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(dataStr);
                    const deltaText = parsed?.delta?.text || parsed?.content_block_delta?.delta?.text || parsed?.delta?.text;
                    if (deltaText) {
                        fullContent += deltaText;
                        onToken?.(deltaText);
                    }
                } catch {
                    // Ignore malformed SSE chunk
                }
            }
        }

        const promptTokens = Math.ceil(prompt.length / 4);
        const completionTokens = Math.ceil(fullContent.length / 4);
        const usage: TokenUsage = {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
            cost: this.calculateAnthropicCost(
                {
                    input_tokens: promptTokens,
                    output_tokens: completionTokens
                },
                model
            )
        };

        this.tokenUsageLog.push(usage);

        return {
            content: fullContent,
            usage,
            model,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Build analysis prompt
     */
    private buildAnalysisPrompt(
        documentText: string,
        documentType: string,
        analysisType: string
    ): string {
        const basePrompt = `Analyze this ${documentType} brand document and extract structured data.

Document Content:
${documentText.substring(0, 8000)} ${documentText.length > 8000 ? '...(truncated)' : ''}

Extract and return JSON with the following structure:`;

        if (analysisType === 'colors') {
            return `${basePrompt}
{
  "colors": {
    "primary": "#XXXXXX",
    "accent": "#XXXXXX",
    "error": "#XXXXXX",
    "warning": "#XXXXXX"
  },
  "confidence": 0.0-1.0
}`;
        }

        if (analysisType === 'policies') {
            return `${basePrompt}
{
  "policies": [
    {
      "category": "operational|service|compliance",
      "requirement": "description",
      "mandatory": true/false,
      "affectedAreas": ["front_desk", "housekeeping", etc]
    }
  ],
  "confidence": 0.0-1.0
}`;
        }

        if (analysisType === 'workflows') {
            return `${basePrompt}
{
  "workflows": [
    {
      "name": "workflow_name",
      "steps": ["step1", "step2"],
      "requirements": ["requirement1"],
      "timing": "duration or time"
    }
  ],
  "confidence": 0.0-1.0
}`;
        }

        // Full analysis
        return `${basePrompt}
{
  "colors": {...},
  "policies": [...],
  "workflows": [...],
  "permissions": [...],
  "times": {...},
  "contacts": [...],
  "confidence": 0.0-1.0
}

Be thorough and accurate. Return ONLY valid JSON.`;
    }

    /**
     * Build code generation prompt
     */
    private buildCodeGenPrompt(
        requirement: string,
        targetFile: string,
        context: string
    ): string {
        return `Generate TypeScript/React code to implement the following requirement:

Requirement: ${requirement}
Target File: ${targetFile}
Context: ${context}

Return the code modification in this JSON format:
{
  "modification": {
    "type": "replace" | "insert" | "update",
    "target": "line number or selector",
    "code": "the actual code",
    "imports": ["any new imports needed"]
  },
  "explanation": "why this change is needed",
  "risks": ["potential issues"],
  "tests": ["suggested test cases"]
}

Ensure type safety and follow existing code style.`;
    }

    /**
     * Calculate API cost
     */
    private calculateCost(usage: any, model: string): number {
        // OpenAI pricing (as of 2024)
        const pricing: Record<string, { prompt: number; completion: number }> = {
            'gpt-4': { prompt: 0.03, completion: 0.06 }, // per 1K tokens
            'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
            'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 }
        };

        const rates = pricing[model] || pricing['gpt-4'];
        return (
            (usage.prompt_tokens / 1000) * rates.prompt +
            (usage.completion_tokens / 1000) * rates.completion
        );
    }

    /**
     * Calculate Anthropic API cost
     */
    private calculateAnthropicCost(usage: any, model: string): number {
        // Anthropic pricing
        const pricing: Record<string, { prompt: number; completion: number }> = {
            'claude-3-5-sonnet-20241022': { prompt: 0.003, completion: 0.015 },
            'claude-3-5-haiku-20241022': { prompt: 0.00025, completion: 0.00125 },
            'claude-3-opus-20240229': { prompt: 0.015, completion: 0.075 },
            'claude-3-sonnet-20240229': { prompt: 0.003, completion: 0.015 },
            'claude-3-haiku-20240307': { prompt: 0.00025, completion: 0.00125 },
        };

        const rates = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
        return (
            (usage.input_tokens / 1000) * rates.prompt +
            (usage.output_tokens / 1000) * rates.completion
        );
    }

    /**
     * Get usage statistics
     */
    getUsageStats(): {
        totalRequests: number;
        totalTokens: number;
        totalCost: number;
        averageTokensPerRequest: number;
    } {
        const totalTokens = this.tokenUsageLog.reduce((sum, usage) => sum + usage.total, 0);
        const totalCost = this.tokenUsageLog.reduce((sum, usage) => sum + usage.cost, 0);

        return {
            totalRequests: this.tokenUsageLog.length,
            totalTokens,
            totalCost,
            averageTokensPerRequest: this.tokenUsageLog.length > 0
                ? totalTokens / this.tokenUsageLog.length
                : 0
        };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getDefaultModelForProvider(provider: AIConfig['provider']): string {
        const defaults: Record<AIConfig['provider'], string> = {
            anthropic: 'claude-3-haiku-20240307',
            openai: 'gpt-4o-mini',
            gemini: 'gemini-1.5-flash',
            ollama: 'llama3.2'
        };
        return defaults[provider];
    }

    private loadRuntimeConfig(): void {
        try {
            const raw = localStorage.getItem(this.runtimeStorageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Partial<AIConfig>;
            const { apiKey: _drop, ...safe } = parsed;
            this.config = { ...this.config, ...safe };
        } catch (error) {
            console.warn('[AI Provider] Failed to load runtime config:', error);
        }
    }

    private persistRuntimeConfig(): void {
        try {
            // Never persist apiKey to localStorage (XSS exposure risk)
            const payload: Partial<AIConfig> = {
                provider: this.config.provider,
                model: this.config.model,
                maxTokens: this.config.maxTokens,
                temperature: this.config.temperature,
                systemPrompt: this.config.systemPrompt,
                ollamaUrl: this.config.ollamaUrl,
            };
            localStorage.setItem(this.runtimeStorageKey, JSON.stringify(payload));
        } catch (error) {
            console.warn('[AI Provider] Failed to persist runtime config:', error);
        }
    }
}

// Export singleton
export const aiProvider = new AIProvider();

// Export class for testing and named imports
export { AIProvider };
export default AIProvider;
