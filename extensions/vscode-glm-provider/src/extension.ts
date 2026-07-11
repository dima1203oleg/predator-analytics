import * as vscode from 'vscode';
import fetch from 'node-fetch';

export function activate(_context: vscode.ExtensionContext) {
  console.log('[Multi-LLM Provider] Activating...');
  console.log('[Multi-LLM Provider] VS Code version:', vscode.version);

  try {
    if ('lm' in vscode && 'registerLanguageModelChatProvider' in vscode.lm) {
      console.log('[Multi-LLM Provider] Registering Multi-LLM provider (GLM + Gemini)...');
      vscode.lm.registerLanguageModelChatProvider('multi-llm', new MultiLLMProvider());
      console.log('[Multi-LLM Provider] Multi-LLM Provider registered successfully with ID: multi-llm');
    } else {
      console.error('[Multi-LLM Provider] Language Model Chat Provider API not available in this VS Code version');
    }
  } catch (error) {
    console.error('[Multi-LLM Provider] Failed to register Multi-LLM Provider:', error);
  }

  console.log('[Multi-LLM Provider] Ready');
}

class MultiLLMProvider {
  private getProvider(modelId: string): 'glm' | 'gemini' {
    if (modelId.startsWith('glm-')) return 'glm';
    if (modelId.startsWith('gemini-')) return 'gemini';
    console.warn('[Multi-LLM Provider] Unknown model provider, defaulting to GLM');
    return 'glm';
  }

  private async getApiKey(provider: 'glm' | 'gemini'): Promise<string | undefined> {
    if (provider === 'glm') {
      const envKey = process.env.ZAI_API_KEY;
      if (envKey) {
        console.log('[Multi-LLM Provider] Using ZAI_API_KEY from environment');
        return envKey;
      }

      const config = vscode.workspace.getConfiguration('zai');
      const configKey = config.get<string>('apiKey');
      if (configKey) {
        console.log('[Multi-LLM Provider] Using ZAI_API_KEY from workspace config');
        return configKey;
      }

      console.warn('[Multi-LLM Provider] No ZAI_API_KEY found');
      return undefined;
    } else {
      const envKey = process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY;
      if (envKey) {
        console.log('[Multi-LLM Provider] Using GEMINI_API_KEY from environment');
        return envKey;
      }

      const config = vscode.workspace.getConfiguration('gemini');
      const configKey = config.get<string>('apiKey');
      if (configKey) {
        console.log('[Multi-LLM Provider] Using GEMINI_API_KEY from workspace config');
        return configKey;
      }

      console.warn('[Multi-LLM Provider] No GEMINI_API_KEY found');
      return undefined;
    }
  }

  private getModelName(modelId: string): string {
    console.log('[Multi-LLM Provider] Getting model name for:', modelId);
    switch (modelId) {
      case 'glm-5.1':
        return 'glm-5.1';
      case 'glm-5':
        return 'glm-5';
      case 'glm-4.7':
        return 'glm-4-plus';
      case 'glm-4-plus':
        return 'glm-4-plus';
      case 'gemini-2.5-flash':
        return 'gemini-2.5-flash';
      case 'gemini-flash-latest':
        return 'gemini-flash-latest';
      case 'gemini-3.5-flash':
        return 'gemini-3.5-flash';
      case 'gemini-2.5-flash-lite':
        return 'gemini-2.5-flash-lite';
      default:
        console.log('[Multi-LLM Provider] Unknown model ID, using gemini-2.5-flash as fallback');
        return 'gemini-2.5-flash';
    }
  }

  async provideLanguageModelChatInformation() {
    console.log('[Multi-LLM Provider] provideLanguageModelChatInformation called');
    const models = [
      // GLM Models (Z.ai)
      {
        id: 'glm-5.1',
        name: 'GLM-5.1 (Coding Plan)',
        family: 'glm-5.1',
        version: '1.0',
        maxInputTokens: 128000,
        maxOutputTokens: 4096,
        capabilities: {
          imageInput: false,
          toolCalling: false
        }
      },
      {
        id: 'glm-5',
        name: 'GLM-5',
        family: 'glm-5',
        version: '1.0',
        maxInputTokens: 128000,
        maxOutputTokens: 4096,
        capabilities: {
          imageInput: false,
          toolCalling: false
        }
      },
      {
        id: 'glm-4.7',
        name: 'GLM-4.7',
        family: 'glm-4.7',
        version: '1.0',
        maxInputTokens: 128000,
        maxOutputTokens: 4096,
        capabilities: {
          imageInput: false,
          toolCalling: false
        }
      },
      // Gemini Models (Google AI Studio) - Only Working Models
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        family: 'gemini-2.5',
        version: '1.0',
        maxInputTokens: 1000000,
        maxOutputTokens: 65536,
        capabilities: {
          imageInput: true,
          toolCalling: true
        }
      },
      {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash Latest',
        family: 'gemini-flash',
        version: '1.0',
        maxInputTokens: 1000000,
        maxOutputTokens: 65536,
        capabilities: {
          imageInput: true,
          toolCalling: true
        }
      },
      {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        family: 'gemini-3.5',
        version: '1.0',
        maxInputTokens: 1000000,
        maxOutputTokens: 65536,
        capabilities: {
          imageInput: true,
          toolCalling: true
        }
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        family: 'gemini-2.5',
        version: '1.0',
        maxInputTokens: 1000000,
        maxOutputTokens: 65536,
        capabilities: {
          imageInput: true,
          toolCalling: true
        }
      }
    ];
    console.log('[Multi-LLM Provider] Returning', models.length, 'models');
    return models;
  }

  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    _token: vscode.CancellationToken
  ): Promise<void> {
    console.log('[Multi-LLM Provider] provideLanguageModelChatResponse called for model:', model.id);
    console.log('[Multi-LLM Provider] Messages count:', messages.length);

    const provider = this.getProvider(model.id);
    const apiKey = await this.getApiKey(provider);

    if (!apiKey) {
      console.error('[Multi-LLM Provider] API key not configured for provider:', provider);
      return Promise.resolve();
    }

    const modelName = this.getModelName(model.id);

    // Convert messages to API format
    const apiMessages = messages.map((msg) => ({
      role: msg.role === vscode.LanguageModelChatMessageRole.User ? 'user' : 
            msg.role === vscode.LanguageModelChatMessageRole.Assistant ? 'assistant' : 'system',
      content: msg.content
    }));

    if (provider === 'glm') {
      console.log('[Multi-LLM Provider] Sending request to Z.ai API:', modelName);
      await this.callGLMApi(apiKey, modelName, apiMessages, progress);
    } else {
      console.log('[Multi-LLM Provider] Sending request to Gemini API:', modelName);
      await this.callGeminiApi(apiKey, modelName, apiMessages, progress);
    }

    return Promise.resolve();
  }

  private async callGLMApi(
    apiKey: string,
    modelName: string,
    messages: any[],
    progress: vscode.Progress<vscode.LanguageModelResponsePart>
  ): Promise<void> {
    try {
      const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Multi-LLM Provider] Z.ai API error:', response.status, errorText);
        return;
      }

      const data = await response.json();
      const content = (data as unknown as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content || '';

      console.log('[Multi-LLM Provider] Received response from Z.ai API');
      progress.report(new vscode.LanguageModelTextPart(content));
      console.log('[Multi-LLM Provider] Response sent to chat');

    } catch (error) {
      console.error('[Multi-LLM Provider] Error calling Z.ai API:', error);
    }
  }

  private async callGeminiApi(
    apiKey: string,
    modelName: string,
    messages: any[],
    progress: vscode.Progress<vscode.LanguageModelResponsePart>
  ): Promise<void> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages.map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Multi-LLM Provider] Gemini API error:', response.status, errorText);
        return;
      }

      const rawData = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = (rawData as any).candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('[Multi-LLM Provider] Received response from Gemini API');
      progress.report(new vscode.LanguageModelTextPart(content));
      console.log('[Multi-LLM Provider] Response sent to chat');

    } catch (error) {
      console.error('[Multi-LLM Provider] Error calling Gemini API:', error);
    }
  }

  async provideTokenCount() {
    return 0;
  }
}

export function deactivate() {
  console.log('[GLM Provider] Deactivating...');
}
