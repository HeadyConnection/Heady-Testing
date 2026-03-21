import Groq from 'groq-sdk';

export class GroqProvider {
  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.name = 'groq';
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
