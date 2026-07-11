import * as vscode from 'vscode';
import fetch from 'node-fetch';

export function activate(_context: vscode.ExtensionContext) {
  console.log('[Gemini Provider] Activating...');
  console.log('[Gemini Provider] VS Code version:', vscode.version);

  try {
    if ('lm' in vscode && 'registerLanguageModelChatProvider' in vscode.lm) {
      console.log('[Gemini Provider] Registering Gemini provider...');
      vscode.lm.registerLanguageModelChatProvider('gemini', new GeminiProvider());
      console.log('[Gemini Provider] Gemini Provider registered successfully with ID: gemini');
    } else {
      console.error('[Gemini Provider] Language Model Chat Provider API not available in this VS Code version');
    }
  } catch (error) {
    console.error('[Gemini Provider] Failed to register Gemini Provider:', error);
  }

  console.log('[Gemini Provider] Ready');
}

class GeminiProvider {
  private async getApiKey(): Promise<string | undefined> {
    const envKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_PRO_API_KEY;
    if (envKey) {
      console.log('[Gemini Provider] Using API key from environment');
      return envKey;
    }

    const config = vscode.workspace.getConfiguration('openrouter');
    const configKey = config.get<string>('apiKey');
    if (configKey) {
      console.log('[Gemini Provider] Using API key from workspace config');
      return configKey;
    }

    console.warn('[Gemini Provider] No API key found');
    return undefined;
  }

  private getModelName(modelId: string): string {
    console.log('[Gemini Provider] Getting model name for:', modelId);
    switch (modelId) {
      case 'gemini-2.5-flash':
        return 'google/gemini-2.5-flash';
      case 'gemini-flash-latest':
        return 'google/gemini-flash-1.5';
      case 'gemini-3.5-flash':
        return 'google/gemini-2.5-flash-exp';
      case 'gemini-2.5-flash-lite':
        return 'google/gemini-2.5-flash-lite';
      default:
        console.log('[Gemini Provider] Unknown model ID, using google/gemini-2.5-flash as fallback');
        return 'google/gemini-2.5-flash';
    }
  }

  async provideLanguageModelChatInformation() {
    console.log('[Gemini Provider] provideLanguageModelChatInformation called');
    const models = [
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
    console.log('[Gemini Provider] Returning', models.length, 'models');
    return models;
  }

  async provideLanguageModelChatResponse(
    model: vscode.LanguageModelChatInformation,
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    _token: vscode.CancellationToken
  ): Promise<void> {
    console.log('[Gemini Provider] provideLanguageModelChatResponse called for model:', model.id);
    console.log('[Gemini Provider] Messages count:', messages.length);

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      console.error('[Gemini Provider] GEMINI_API_KEY not configured');
      return Promise.resolve();
    }

    const modelName = this.getModelName(model.id);

    // Convert messages to OpenAI/OpenRouter format
    const apiMessages = messages.map((msg) => ({
      role: msg.role === vscode.LanguageModelChatMessageRole.User ? 'user' :
            msg.role === vscode.LanguageModelChatMessageRole.Assistant ? 'assistant' : 'system',
      content: msg.content
    }));

    console.log('[Gemini Provider] Sending request to OpenRouter API:', modelName);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://vscode-gemini-provider',
          'X-Title': 'VSCode Gemini Provider'
        },
        body: JSON.stringify({
          model: modelName,
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 8192,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Gemini Provider] OpenRouter API error:', response.status, errorText);
        return Promise.resolve();
      }

      const rawData = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = (rawData as any).choices?.[0]?.message?.content || '';

      console.log('[Gemini Provider] Received response from OpenRouter API');
      progress.report(new vscode.LanguageModelTextPart(content));
      console.log('[Gemini Provider] Response sent to chat');

      return Promise.resolve();

    } catch (error) {
      console.error('[Gemini Provider] Error calling OpenRouter API:', error);
      return Promise.resolve();
    }
  }

  async provideTokenCount() {
    return 0;
  }
}

export function deactivate() {
  console.log('[Gemini Provider] Deactivating...');
}
