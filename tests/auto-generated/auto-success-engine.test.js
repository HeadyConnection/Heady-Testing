/**
 * Auto-generated tests for auto-success-engine
 * Generated: 2026-03-07T12:28:37.563687
 * Updated:   2026-03-18 — Fixed import path and test structure
 */

const { AutoSuccessEngine, createEngine } = require('../../src/engines/auto-success-engine');

describe('auto-success-engine', () => {
    describe('Module Loading', () => {
        it('should load AutoSuccessEngine class', () => {
            expect(AutoSuccessEngine).toBeDefined();
            expect(typeof AutoSuccessEngine).toBe('function');
        });

        it('should export createEngine factory', () => {
            expect(createEngine).toBeDefined();
            expect(typeof createEngine).toBe('function');
        });
    });

    describe('Constructor', () => {
        it('should create an instance with default config', () => {
            const engine = new AutoSuccessEngine();
            expect(engine).toBeInstanceOf(AutoSuccessEngine);
        });

        it('should accept custom config', () => {
            const engine = new AutoSuccessEngine({
                verbose: true,
                enableMonteCarlo: true,
                enableLiquidScaling: true,
            });
            expect(engine).toBeInstanceOf(AutoSuccessEngine);
        });

        it('should accept disabledCategories config', () => {
            const engine = new AutoSuccessEngine({
                disabledCategories: ['INFRASTRUCTURE'],
            });
            expect(engine).toBeInstanceOf(AutoSuccessEngine);
        });
    });

    describe('Factory Function', () => {
        it('should create engine via createEngine()', () => {
            const engine = createEngine();
            expect(engine).toBeInstanceOf(AutoSuccessEngine);
        });

        it('should create engine with config via createEngine(config)', () => {
            const engine = createEngine({ verbose: true });
            expect(engine).toBeInstanceOf(AutoSuccessEngine);
        });
    });

    describe('Lifecycle', () => {
        it('should report zero cumulative failures before any cycle', () => {
            const engine = new AutoSuccessEngine();
            expect(engine.getCumulativeFailures()).toBe(0);
        });

        it('should return empty results before any cycle', () => {
            const engine = new AutoSuccessEngine();
            expect(engine.getLastCycleResults()).toEqual([]);
        });

        it('should stop cleanly even if never started', () => {
            const engine = new AutoSuccessEngine();
            expect(() => engine.stop()).not.toThrow();
        });
    });

    describe('Async Behavior', () => {
        it('should resolve AutoSuccessEngine via Promise', async () => {
            const result = await Promise.resolve(AutoSuccessEngine);
            expect(result).toBeDefined();
        });
    });
});
