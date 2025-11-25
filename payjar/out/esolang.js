"use strict";
// Esolang Interpreter(s) - Brainfuck implementation
// Designed as a simple interpreter to integrate into the Payjar extension
// This file introduces a Brainfuck interpreter and a small wrapper runner to use in the extension
Object.defineProperty(exports, "__esModule", { value: true });
exports.EsolangRunner = exports.BrainfuckInterpreter = void 0;
class BrainfuckInterpreter {
    cells;
    pointer;
    code;
    input;
    inputPointer;
    output;
    constructor(code, input = '', cellCount = 30000) {
        this.code = code.replace(/[^\[\]<>+\-.,]/g, ''); // strip non-brainfuck characters
        this.cells = new Array(cellCount).fill(0);
        this.pointer = 0;
        this.input = input;
        this.inputPointer = 0;
        this.output = '';
    }
    run() {
        const code = this.code;
        const matchingBrackets = this.buildBracketMap(code);
        for (let i = 0; i < code.length; i++) {
            const cmd = code[i];
            switch (cmd) {
                case '>':
                    this.pointer++;
                    if (this.pointer >= this.cells.length) {
                        // Expand cells if needed (dynamic)
                        this.cells.push(0);
                    }
                    break;
                case '<':
                    if (this.pointer === 0) {
                        throw new Error('Runtime Error: Data pointer moved left of tape start.');
                    }
                    this.pointer--;
                    break;
                case '+':
                    this.cells[this.pointer] = (this.cells[this.pointer] + 1) % 256;
                    break;
                case '-':
                    this.cells[this.pointer] = (this.cells[this.pointer] - 1 + 256) % 256;
                    break;
                case '.':
                    this.output += String.fromCharCode(this.cells[this.pointer]);
                    break;
                case ',':
                    if (this.inputPointer < this.input.length) {
                        this.cells[this.pointer] = this.input.charCodeAt(this.inputPointer++);
                    }
                    else {
                        this.cells[this.pointer] = 0; // EOF behavior: set 0
                    }
                    break;
                case '[':
                    if (this.cells[this.pointer] === 0) {
                        // Jump to matching bracket
                        i = matchingBrackets[i];
                    }
                    break;
                case ']':
                    if (this.cells[this.pointer] !== 0) {
                        i = matchingBrackets[i];
                    }
                    break;
                default:
                    break; // Should not happen after sanitization
            }
        }
        return this.output;
    }
    buildBracketMap(code) {
        const stack = [];
        const map = {};
        for (let i = 0; i < code.length; i++) {
            const chr = code[i];
            if (chr === '[') {
                stack.push(i);
            }
            else if (chr === ']') {
                const start = stack.pop();
                if (start === undefined) {
                    throw new Error(`Syntax Error: Unmatched ']' at position ${i}`);
                }
                map[start] = i;
                map[i] = start;
            }
        }
        if (stack.length > 0) {
            throw new Error(`Syntax Error: Unmatched '[' at position ${stack[stack.length - 1]}`);
        }
        return map;
    }
}
exports.BrainfuckInterpreter = BrainfuckInterpreter;
class EsolangRunner {
    options;
    constructor(options) {
        this.options = options;
    }
    run() {
        if (!this.options.language || this.options.language === 'brainfuck') {
            const bf = new BrainfuckInterpreter(this.options.code, this.options.input ?? '');
            return bf.run();
        }
        throw new Error(`Unsupported esoteric language: ${this.options.language}`);
    }
}
exports.EsolangRunner = EsolangRunner;
//# sourceMappingURL=esolang.js.map