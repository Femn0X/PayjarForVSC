// Imports from VS Code API and your custom language logic
import * as vscode from 'vscode';
import { Lexer, Parser, Interpreter, MainDefinitionNode } from './payjar'; // Import your logic

// Define the file extension for your language (e.g., .payjar)
const PAYJAR_LANGUAGE_ID = 'payjar';

/**
 * Main activation function called when the extension is loaded.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
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

            // Keep a reference to the original console.log so we can restore it later
            const originalConsoleLog = console.log;

            try {
                // 1. Lexing
                const lexer = new Lexer(code);
                const tokens = lexer.tokenize();

                // 2. Parsing
                const parser = new Parser(tokens);
                const ast = parser.parse() as MainDefinitionNode;

                // 3. Interpretation
                const interpreter = new Interpreter();

                // IMPORTANT: Redirect console.log from the interpreter to the VS Code output channel
                console.log = (...args: any[]) => {
                    outputChannel.appendLine(args.map(String).join(' '));
                };

                interpreter.interpret(ast);

                outputChannel.appendLine(`--- Execution Finished Successfully ---`);

            } catch (error: any) {
                outputChannel.appendLine(`--- Execution FAILED ---`);
                outputChannel.appendLine(`Error: ${error?.message ?? String(error)}`);
            } finally {
                // Always restore the original console implementation
                console.log = originalConsoleLog;
            }
        }
    });

    context.subscriptions.push(runCommand);


    // --- 2. Basic Diagnostics (Error Checking) ---
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('payjar');
    context.subscriptions.push(diagnosticCollection);

    // Initial check on activation
    checkDiagnostics(vscode.window.activeTextEditor?.document, diagnosticCollection);

    // Check diagnostics on file save or content change
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => checkDiagnostics(event.document, diagnosticCollection)),
        vscode.window.onDidChangeActiveTextEditor(editor => checkDiagnostics(editor?.document, diagnosticCollection))
    );
}

/**
 * Runs the PayJar Lexer and Parser on a document to find errors.
 * This is a highly simplified way to generate diagnostics.
 */
function checkDiagnostics(document: vscode.TextDocument | undefined, diagnosticCollection: vscode.DiagnosticCollection) {
    if (!document || document.languageId !== PAYJAR_LANGUAGE_ID) {
        diagnosticCollection.clear();
        return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const code = document.getText();

    try {
        // Run Lexer and Parser
        const lexer = new Lexer(code);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        parser.parse();

        // If no error, clear old diagnostics for this file
        diagnosticCollection.set(document.uri, []);

    } catch (e: any) {
        // Your Lexer and Parser throw an Error with a message like:
        // "Syntax Error: Expected IDENTIFIER, but got LPAREN. Index: 5"
        
        // This is where you would map the error message back to line/column.
        // Since your current Parser/Lexer throws an error but doesn't expose 
        // the exact line/column, we make a big assumption for now:
        
        let line = 0;
        let char = 0;
        
        // A more advanced parser would include line/column information in the exception.
        
        const range = new vscode.Range(line, char, line, document.lineAt(line).text.length);

        const diagnostic = new vscode.Diagnostic(
            range,
            e.message || "Unknown PayJar Syntax Error",
            vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
        diagnosticCollection.set(document.uri, diagnostics);
    }
}


/**
 * Deactivation function.
 */
export function deactivate() {
    console.log('Your extension "payjar-lang" is now deactivated.');
}
