import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../../src/mcp/tool-registry.js';

describe('MCP Tool Registry', () => {
  it('should list registered tools', () => {
    const tools = toolRegistry.list();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0]).toHaveProperty('name');
    expect(tools[0]).toHaveProperty('description');
  });

  it('should get a specific tool', () => {
    const tool = toolRegistry.get('heady_chat');
    expect(tool).toBeDefined();
    expect(tool.name).toBe('heady_chat');
  });

  it('should return undefined for unknown tool', () => {
    const tool = toolRegistry.get('nonexistent');
    expect(tool).toBeUndefined();
  });
});
