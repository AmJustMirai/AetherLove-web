import {describe, expect, it} from 'vitest';
import {safeColor} from './color';

const FB = 'rgb(var(--al-accent))';

describe('safeColor', () => {
    it('accepts hex colors', () => {
        for (const c of ['#fff', '#aabb', '#aabbcc', '#aabbccdd', '#FFF']) {
            expect(safeColor(c, FB)).toBe(c);
        }
    });

    it('accepts rgb/rgba/hsl/hsla literals', () => {
        for (const c of [
            'rgb(1,2,3)',
            'rgba(1, 2, 3, .5)',
            'hsl(120, 50%, 50%)',
            'hsla(0 0% 0% / 50%)',
        ]) {
            expect(safeColor(c, FB)).toBe(c);
        }
    });

    it('trims surrounding whitespace', () => {
        expect(safeColor('  #abc  ', FB)).toBe('#abc');
    });

    it('falls back on injection attempts and junk', () => {
        for (const bad of [
            'url(javascript:alert(1))',
            'red;width:9999px',
            'rgb(1,2,3); background:url(x)',
            '</style><script>alert(1)</script>',
            'expression(alert(1))',
            'red',
            '#ggg',
            '#12345',
            '',
        ]) {
            expect(safeColor(bad, FB)).toBe(FB);
        }
    });

    it('falls back on null/undefined', () => {
        expect(safeColor(null, FB)).toBe(FB);
        expect(safeColor(undefined, FB)).toBe(FB);
    });
});
