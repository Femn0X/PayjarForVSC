"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// Imports from VS Code API and your custom language logic
const vscode = __importStar(require("vscode"));
const payjar_1 = require("./payjar"); // Import your logic
const esolang_1 = require("./esolang");
// Define the file extension for your language (e.g., .payjar)
const PAYJAR_LANGUAGE_ID = 'payjar';
/**
 * Main activation function called when the extension is loaded.
 * @param context The extension context.
 */
function activate(context) {
    console.log('Congratulations, your extension "payjar-lang" is now active!');
    // --- 1. Register "Run Code" Command ---
    const runCommand = vscode.commands.registerCommand('payjar.runCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            if (document.languageId !== PAYJAR_LANGUAGE_ID) {
                vscode.window.showWarningMessage('The active file is not a PayJar file.');
                return;
            }
            const code = document.getText();
            // Use the VS Code Output Channel to display results
            const outputChannel = vscode.window.createOutputChannel('PayJar Output');
            outputChannel.clear();
            outputChannel.show(true);
            outputChannel.appendLine(`--- Running PayJar Code ---`);
            try {
                // 1. Lexing
                const lexer = new payjar_1.Lexer(code);
                const tokens = lexer.tokenize();
                // 2. Parsing
                const parser = new payjar_1.Parser(tokens);
                const ast = parser.parse();
                // 3. Interpretation
                const interpreter = new payjar_1.Interpreter();
                // IMPORTANT: Redirect console.log from the interpreter to the VS Code output channel
                const originalConsoleLog = console.log;
                console.log = (...args) => {
                    outputChannel.appendLine(args.map(String).join(' '));
                };
                interpreter.interpret(ast);
                // Restore original console.log
                console.log = originalConsoleLog;
                outputChannel.appendLine(`--- Execution Finished Successfully ---`);
            }
            catch (error) {
                outputChannel.appendLine(`--- Execution FAILED ---`);
                outputChannel.appendLine(`Error: ${error.message}`);
                // Restore original console.log in case of error
                console.log = originalConsoleLog;
            }
        }
    });
    context.subscriptions.push(runCommand);
    // --- 3. Register "Run Esolang Code" Command ---
    const runEsolangCmd = vscode.commands.registerCommand('esolangs.runCode', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        // Accept .bf files or files with language id 'brainfuck'
        if (!document.fileName.endsWith('.bf') && document.languageId !== 'brainfuck') {
            vscode.window.showWarningMessage('The active file is not a Brainfuck (.bf) file.');
            return;
        }
        const code = document.getText();
        const outputChannel = vscode.window.createOutputChannel('Esolangs Output');
        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`--- Running Brainfuck Code ---`);
        try {
            const runner = new esolang_1.EsolangRunner({ code, language: 'brainfuck' });
            const result = runner.run();
            if (result.length === 0) {
                outputChannel.appendLine('(No output)');
            }
            else {
                outputChannel.appendLine(result);
            }
            outputChannel.appendLine(`--- Execution Finished Successfully ---`);
        }
        catch (e) {
            outputChannel.appendLine(`--- Execution FAILED ---`);
            outputChannel.appendLine(e.message || String(e));
        }
    });
    context.subscriptions.push(runEsolangCmd);
    // --- 2. Basic Diagnostics (Error Checking) ---
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('payjar');
    context.subscriptions.push(diagnosticCollection);
    // Initial check on activation
    checkDiagnostics(vscode.window.activeTextEditor?.document, diagnosticCollection);
    // Check diagnostics on file save or content change
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => checkDiagnostics(event.document, diagnosticCollection)), vscode.window.onDidChangeActiveTextEditor(editor => checkDiagnostics(editor?.document, diagnosticCollection)));
}
/**
 * Runs the PayJar Lexer and Parser on a document to find errors.
 * This is a highly simplified way to generate diagnostics.
 */
function checkDiagnostics(document, diagnosticCollection) {
    if (!document || document.languageId !== PAYJAR_LANGUAGE_ID) {
        diagnosticCollection.clear();
        return;
    }
    const diagnostics = [];
    const code = document.getText();
    try {
        // Run Lexer and Parser
        const lexer = new payjar_1.Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new payjar_1.Parser(tokens);
        parser.parse();
        // If no error, clear old diagnostics for this file
        diagnosticCollection.set(document.uri, []);
    }
    catch (e) {
        // Your Lexer and Parser throw an Error with a message like:
        // "Syntax Error: Expected IDENTIFIER, but got LPAREN. Index: 5"
        // This is where you would map the error message back to line/column.
        // Since your current Parser/Lexer throws an error but doesn't expose 
        // the exact line/column, we make a big assumption for now:
        let line = 0;
        let char = 0;
        // A more advanced parser would include line/column information in the exception.
        const range = new vscode.Range(line, char, line, document.lineAt(line).text.length);
        const diagnostic = new vscode.Diagnostic(range, e.message || "Unknown PayJar Syntax Error", vscode.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic);
        diagnosticCollection.set(document.uri, diagnostics);
    }
}
/**
 * Deactivation function.
 */
function deactivate() {
    console.log('Your extension "payjar-lang" is now deactivated.');
}
//# sourceMappingURL=extension.js.map