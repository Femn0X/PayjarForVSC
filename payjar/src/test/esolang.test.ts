import * as assert from 'assert';
import { BrainfuckInterpreter } from '../esolang';

suite('Esolang (Brainfuck) Interpreter Tests', () => {
    test('Simple A output', () => {
        const code = '+'.repeat(65) + '.'; // 65 -> 'A'
        const bf = new BrainfuckInterpreter(code);
        const out = bf.run();
        assert.strictEqual(out, 'A');
    });

    test('Echo input', () => {
        const code = ',.'; // read a char, output it
        const bf = new BrainfuckInterpreter(code, 'Z');
        const out = bf.run();
        assert.strictEqual(out, 'Z');
    });

    test('Simple loop (increment to 3, print) ', () => {
        // Build cell value 3 using loop: +++[>+<-]>.
        // Explanation: cell0=3; [>+<-] moves 3 increments to cell1 -> cell0=0, cell1=3; >. prints cell1
        const code = '+++[>+<-]>.';
        const bf = new BrainfuckInterpreter(code);
        const out = bf.run();
        assert.strictEqual(out, String.fromCharCode(3));
    });
});
