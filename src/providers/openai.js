import OpenAI from 'openai';

export class OpenaiProvider {
  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.name = 'openai';
  }

  async chat(messages, options = {}) {
    // Provider-specific chat implementation
    throw new Error('Not yet implemented — replace stub');
  }

  async embed(text) {
    // Provider-specific embedding implementation
    throw new Error('Not yet implemented — replace stub');
  }

  health() {
    return { provider: this.name, status: 'configured' };
  }
}
