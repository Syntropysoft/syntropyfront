const { describe, it, expect } = require('@jest/globals');
const { DataMaskingManager, MaskingStrategy } = require('../src/utils/DataMaskingManager.js');

describe('DataMaskingManager', () => {
    const manager = new DataMaskingManager();

    describe('General Processing', () => {
        it('should handle null and undefined', () => {
            expect(manager.process(null)).toBeNull();
            expect(manager.process(undefined)).toBeUndefined();
        });

        it('should remove ANSI escape codes from strings', () => {
            const input = '\u001b[31mRed Text\u001b[0m';
            expect(manager.process(input)).toBe('Red Text');
        });

        it('should process arrays recursively', () => {
            const input = ['plain', '\u001b[31mANSI\u001b[0m', { email: 'test@example.com' }];
            const expected = ['plain', 'ANSI', { email: 't***@example.com' }];
            expect(manager.process(input)).toEqual(expected);
        });

        it('should not corrupt special object instances', () => {
            const date = new Date();
            expect(manager.process(date)).toBe(date);
        });
    });

    describe('Masking Strategies', () => {
        it('should mask emails', () => {
            const input = { email: 'john.doe@example.com' };
            const result = manager.process(input);
            expect(result.email).toBe('j*******@example.com');
        });

        it('should mask passwords and tokens', () => {
            const input = { password: 'my-secret-pass', api_key: '1234-5678-90' };
            const result = manager.process(input);
            expect(result.password).toBe('**************');
            expect(result.api_key).toBe('************');
        });

        it('should mask credit cards', () => {
            const input = { card_number: '1234-5678-9012-3456' };
            const result = manager.process(input);
            expect(result.card_number).toBe('****-****-****-3456');
        });

        it('should mask SSN', () => {
            const input = { ssn: '123-45-6789' };
            const result = manager.process(input);
            expect(result.ssn).toBe('***-**-6789');
        });

        it('should mask phone numbers', () => {
            const input = { phone: '+1 555-0123-4567' };
            const result = manager.process(input);
            expect(result.phone).toBe('+* ***-****-4567');
        });
    });

    describe('Custom Rules', () => {
        it('should support custom masking rules', () => {
            const customManager = new DataMaskingManager({
                enableDefaultRules: false,
                rules: [
                    {
                        pattern: /secret_id/i,
                        strategy: MaskingStrategy.CUSTOM,
                        customMask: (val) => val.substring(0, 2) + '...'
                    }
                ]
            });
            const input = { secret_id: 'ID123456' };
            expect(customManager.process(input).secret_id).toBe('ID...');
        });
    });

    describe('Preserve Length', () => {
        it('should support fixed length masking', () => {
            const fixedManager = new DataMaskingManager({
                preserveLength: false
            });
            const input = { password: 'short' };
            expect(fixedManager.process(input).password).toBe('********'); // Default fixed 8
        });
    });
});
