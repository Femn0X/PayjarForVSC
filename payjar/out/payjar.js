"use strict";
// ====================================================================
// 1. Core Structures (Token and AST Node Definitions)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.PJS = exports.PJRT = exports.Interpreter = exports.PayJarObject = exports.FunctionReturn = exports.Parser = exports.Lexer = exports.Token = void 0;
class Token {
    type;
    value;
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
    toString() {
        return `Token(${this.type}, ${this.value})`;
    }
}
exports.Token = Token;
// ====================================================================
// 2. Lexer
// ====================================================================
class Lexer {
    text;
    pos = 0;
    current_char;
    constructor(text) {
        // The Python implementation included re.sub for comments, which we implement here.
        this.text = this.removeComments(text);
        this.current_char = this.text.length > 0 ? this.text[0] : null;
    }
    removeComments(text) {
        // Single-line (//)
        let cleaned = text.replace(/\/\/.*$/gm, '');
        // Multi-line (/* ... */)
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
        return cleaned;
    }
    advance() {
        this.pos += 1;
        if (this.pos < this.text.length) {
            this.current_char = this.text[this.pos];
        }
        else {
            this.current_char = null;
        }
    }
    skipWhitespace() {
        while (this.current_char !== null && /\s/.test(this.current_char)) {
            this.advance();
        }
    }
    peek(offset = 1) {
        const peekPos = this.pos + offset;
        if (peekPos < this.text.length) {
            return this.text[peekPos];
        }
        return null;
    }
    identifier() {
        let result = '';
        while (this.current_char !== null && (/[a-zA-Z0-9_]/.test(this.current_char))) {
            result += this.current_char;
            this.advance();
        }
        return result;
    }
    stringLiteral(quoteChar) {
        let result = '';
        this.advance(); // Consume the opening quote
        while (this.current_char !== null && this.current_char !== quoteChar) {
            result += this.current_char;
            this.advance();
        }
        if (this.current_char === quoteChar) {
            this.advance();
            return result;
        }
        else {
            throw new Error("Lexer Error: Unterminated string literal");
        }
    }
    backtickStringLiteral() {
        return this.stringLiteral('`');
    }
    getNextToken() {
        while (this.current_char !== null) {
            this.skipWhitespace();
            if (this.current_char === null)
                return null;
            // Identifiers and Keywords
            if (/[a-zA-Z_]/.test(this.current_char)) {
                const id = this.identifier();
                const keywords = {
                    'public': 'PUBLIC', 'private': 'PRIVATE', 'class': 'CLASS',
                    'main': 'MAIN', 'self': 'SELF', 'inner_self': 'INNERSELF', 'innerSelf': 'INNERSELF',
                    'func': 'DEF', 'println': 'PRINT', 'pass': 'PASS', 'let': 'LET',
                    'const': 'CONST', 'var': 'VAR', 'NEW': 'NEW', 'readln': 'READLN', 'return': 'RETURN'
                };
                const type = keywords[id] || 'IDENTIFIER';
                return new Token(type, id);
            }
            // Numbers
            if (/[0-9]/.test(this.current_char)) {
                let number = '';
                while (this.current_char !== null && /[0-9]/.test(this.current_char)) {
                    number += this.current_char;
                    this.advance();
                }
                return new Token('NUMBER', number);
            }
            // Operators and Punctuation (Single and Double Character)
            if (this.current_char === '=') {
                if (this.peek() === '=') {
                    this.advance();
                    this.advance();
                    return new Token('EQUAL_EQUAL', '==');
                }
                this.advance();
                return new Token('EQUAL', '=');
            }
            if (this.current_char === '!') {
                if (this.peek() === '=') {
                    this.advance();
                    this.advance();
                    return new Token('NOT_EQUAL', '!=');
                }
                throw new Error(`Lexer Error: Invalid character: ${this.current_char}`);
            }
            if (this.current_char === '<') {
                if (this.peek() === '=') {
                    this.advance();
                    this.advance();
                    return new Token('LESS_EQUAL', '<=');
                }
                this.advance();
                return new Token('LESS_THAN', '<');
            }
            if (this.current_char === '>') {
                if (this.peek() === '=') {
                    this.advance();
                    this.advance();
                    return new Token('GREATER_EQUAL', '>=');
                }
                this.advance();
                return new Token('GREATER_THAN', '>');
            }
            if (this.current_char === '+') {
                this.advance();
                return new Token('PLUS', '+');
            }
            if (this.current_char === '-') {
                this.advance();
                return new Token('MINUS', '-');
            }
            if (this.current_char === '*') {
                this.advance();
                return new Token('MULTIPLY', '*');
            }
            if (this.current_char === '/') {
                this.advance();
                return new Token('DIVIDE', '/');
            }
            if (this.current_char === '%') {
                this.advance();
                return new Token('MODULO', '%');
            }
            if (this.current_char === '(') {
                this.advance();
                return new Token('LPAREN', '(');
            }
            if (this.current_char === ')') {
                this.advance();
                return new Token('RPAREN', ')');
            }
            if (this.current_char === '{') {
                this.advance();
                return new Token('LBRACE', '{');
            }
            if (this.current_char === '}') {
                this.advance();
                return new Token('RBRACE', '}');
            }
            if (this.current_char === ';') {
                this.advance();
                return new Token('SEMICOLON', ';');
            }
            if (this.current_char === ',') {
                this.advance();
                return new Token('COMMA', ',');
            }
            if (this.current_char === '.') {
                this.advance();
                return new Token('DOT', '.');
            }
            if (this.current_char === '@') {
                this.advance();
                return new Token('AT', "@");
            }
            // String and Backtick Literals
            if (this.current_char === '"' || this.current_char === "'") {
                return new Token('STRING_LITERAL', this.stringLiteral(this.current_char));
            }
            if (this.current_char === '`') {
                return new Token('BACKTICK_STRING', this.backtickStringLiteral());
            }
            throw new Error(`Lexer Error: Invalid character: ${this.current_char}`);
        }
        return null; // EOF
    }
    tokenize() {
        const tokens = [];
        let token = this.getNextToken();
        while (token) {
            tokens.push(token);
            token = this.getNextToken();
        }
        return tokens;
    }
}
exports.Lexer = Lexer;
// ====================================================================
// 3. Parser
// ====================================================================
class Parser {
    tokens;
    current_token = null;
    token_index = -1;
    constructor(tokens) {
        this.tokens = tokens;
        this.advance();
    }
    advance() {
        this.token_index += 1;
        this.current_token = this.token_index < this.tokens.length ? this.tokens[this.token_index] : null;
    }
    eat(token_type) {
        if (this.current_token && this.current_token.type === token_type) {
            this.advance();
        }
        else {
            throw new Error(`Syntax Error: Expected ${token_type}, but got ${this.current_token?.type ?? 'EOF'}. Index: ${this.token_index}`);
        }
    }
    // --- Main Parsing Logic ---
    parse() {
        return this.parseMain();
    }
    parseMain() {
        this.eat('PUBLIC');
        this.eat('CLASS');
        const className = this.current_token.value;
        this.eat('MAIN');
        this.eat('LPAREN');
        this.eat('AT');
        this.eat('SELF');
        this.eat('RPAREN');
        this.eat('LBRACE');
        const mainBody = this.parseMainBody();
        this.eat('RBRACE');
        return { type: "main_definition", name: className, body: mainBody };
    }
    parseMainBody() {
        const statements = [];
        while (this.current_token && this.current_token.type !== 'RBRACE') {
            if (this.current_token.type === 'PRINT') {
                statements.push(this.parsePrintStatement());
            }
            else if (['VAR', 'CONST', 'LET'].includes(this.current_token.type)) {
                statements.push(this.parseVariableDeclaration());
            }
            else if (this.current_token.type === 'DEF') {
                statements.push(this.parseFunctionDefinition());
            }
            else if (this.current_token.type === 'PUBLIC' || this.current_token.type === 'CLASS') {
                statements.push(this.parseClassDefinition());
            }
            else if (this.current_token.type === 'IDENTIFIER') {
                const nextToken = this.tokens[this.token_index + 1];
                if (nextToken?.type === 'EQUAL') {
                    statements.push(this.parseAssignmentStatement());
                }
                else if (nextToken?.type === 'DOT') {
                    const objName = this.current_token.value;
                    this.eat('IDENTIFIER');
                    const objExpr = { type: "variable_access", name: objName };
                    const expr = this.parseMemberAccess(objExpr);
                    statements.push(expr);
                    if (expr.type === "member_access" && expr.is_call) {
                        this.eat('SEMICOLON');
                    }
                }
                else if (nextToken?.type === 'LPAREN') {
                    const expr = this.parseFunctionCallExpression();
                    statements.push(expr);
                    this.eat('SEMICOLON');
                }
                else {
                    throw new Error(`Syntax Error: Unexpected token in main body: ${this.current_token.type}`);
                }
            }
            else {
                throw new Error(`Syntax Error: Unexpected token in main body: ${this.current_token.type}`);
            }
        }
        return statements;
    }
    // --- Utility Parsing Functions ---
    parsePrintStatement() {
        this.eat('PRINT');
        this.eat('LPAREN');
        const expression = this.parseExpression();
        this.eat('RPAREN');
        this.eat('SEMICOLON');
        return { type: "print_statement", expression };
    }
    parseInputStatement() {
        this.eat('READLN');
        this.eat('LPAREN');
        // In the parser, we just capture the prompt expression structure
        const promptExpr = this.parseExpression();
        this.eat('RPAREN');
        // This is a placeholder structure to satisfy the interpreter later, 
        // the actual value acquisition happens in the Interpreter.
        return {
            type: "literal",
            data_type: 'string',
            value: "", // Placeholder value
            prompt: promptExpr.value // Extract the prompt string
        };
    }
    parseVariableDeclaration() {
        const declarationType = this.current_token.type;
        this.advance();
        const variableName = this.current_token.value;
        this.eat('IDENTIFIER');
        this.eat('EQUAL');
        const valueExpression = this.parseExpression();
        this.eat('SEMICOLON');
        return { type: "variable_declaration", kind: declarationType, name: variableName, value: valueExpression };
    }
    parseAssignmentStatement() {
        const variableName = this.current_token.value;
        this.eat('IDENTIFIER');
        this.eat('EQUAL');
        const valueExpression = this.parseExpression();
        this.eat('SEMICOLON');
        return { type: "assignment_statement", name: variableName, value: valueExpression };
    }
    // --- Expression Parsing (Recursive Descent with Precedence) ---
    // Entry point: Handles comparison (lowest precedence)
    parseExpression() {
        let left = this.parseTerm();
        while (this.current_token && ['EQUAL_EQUAL', 'NOT_EQUAL', 'LESS_THAN', 'GREATER_THAN', 'LESS_EQUAL', 'GREATER_EQUAL'].includes(this.current_token.type)) {
            const operator = this.current_token.value;
            this.advance();
            const right = this.parseTerm();
            left = { type: "binary_op", operator, left, right };
        }
        return left;
    }
    // Addition/Subtraction
    parseTerm() {
        let left = this.parseFactor();
        while (this.current_token && ['PLUS', 'MINUS'].includes(this.current_token.type)) {
            const operator = this.current_token.value;
            this.advance();
            const right = this.parseFactor();
            left = { type: "binary_op", operator, left, right };
        }
        return left;
    }
    // Multiplication/Division/Modulo and Unary
    parseFactor() {
        // Unary Plus/Minus
        if (this.current_token && ['PLUS', 'MINUS'].includes(this.current_token.type)) {
            const operator = this.current_token.value;
            this.advance();
            const operand = this.parsePrimaryExpression();
            return { type: "unary_op", operator, operand };
        }
        let left = this.parsePrimaryExpression();
        while (this.current_token && ['MULTIPLY', 'DIVIDE', 'MODULO'].includes(this.current_token.type)) {
            const operator = this.current_token.value;
            this.advance();
            const right = this.parsePrimaryExpression();
            left = { type: "binary_op", operator, left, right };
        }
        return left;
    }
    // Literals, Identifiers, Calls, New, Parenthesized (highest precedence)
    parsePrimaryExpression() {
        if (this.current_token.type === 'STRING_LITERAL') {
            const value = this.current_token.value;
            this.eat('STRING_LITERAL');
            return { type: "literal", value, data_type: "string" };
        }
        else if (this.current_token.type === 'NUMBER') {
            const value = parseInt(this.current_token.value, 10);
            this.eat('NUMBER');
            return { type: "literal", value, data_type: "number" };
        }
        else if (this.current_token.type === 'BACKTICK_STRING') {
            const stringContent = this.current_token.value;
            this.eat('BACKTICK_STRING');
            const templateParts = [];
            // Simplified regex matching for ${variableName} using JS RegExp
            const parts = stringContent.split(/(\$\{(\w+)\})/g).filter(p => p !== '');
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part.startsWith('${') && part.endsWith('}')) {
                    const varName = part.substring(2, part.length - 1);
                    templateParts.push({ type: "variable_access", name: varName });
                    i++; // Skip the variable name part if using the regex capture group trick
                }
                else if (i % 2 === 0) { // Simple literal split (less robust than the Python original, but simpler in JS)
                    if (part)
                        templateParts.push({ type: "literal", value: part, data_type: "string" });
                }
            }
            return { type: "template_string", parts: templateParts };
        }
        else if (this.current_token.type === 'IDENTIFIER') {
            const name = this.current_token.value;
            this.advance();
            const nextToken = this.current_token;
            if (nextToken?.type === 'LPAREN') {
                return this.parseFunctionCallExpression(name);
            }
            else if (nextToken?.type === 'DOT') {
                const objExpr = { type: "variable_access", name };
                return this.parseMemberAccess(objExpr);
            }
            else {
                return { type: "variable_access", name };
            }
        }
        else if (this.current_token.type === 'READLN') {
            return this.parseInputStatement();
        }
        else if (this.current_token.type === 'NEW') {
            return this.parseNewExpression();
        }
        else if (this.current_token.type === 'LPAREN') {
            this.eat('LPAREN');
            const expr = this.parseExpression();
            this.eat('RPAREN');
            return expr;
        }
        else {
            throw new Error(`Syntax Error: Unexpected token in primary expression: ${this.current_token?.type ?? 'EOF'}`);
        }
    }
    parseArguments() {
        const argumentsList = [];
        if (this.current_token && this.current_token.type !== 'RPAREN') {
            argumentsList.push(this.parseExpression());
            while (this.current_token && this.current_token.type === 'COMMA') {
                this.eat('COMMA');
                argumentsList.push(this.parseExpression());
            }
        }
        return argumentsList;
    }
    parseFunctionCallExpression(name) {
        const functionName = name || this.current_token.value;
        if (!name)
            this.eat('IDENTIFIER'); // Consume if not already consumed by parsePrimaryExpression
        this.eat('LPAREN');
        const argumentsList = this.parseArguments();
        this.eat('RPAREN');
        return { type: "function_call", name: functionName, arguments: argumentsList };
    }
    parseMemberAccess(objExpr) {
        this.eat('DOT');
        const memberName = this.current_token.value;
        this.eat('IDENTIFIER');
        let isCall = false;
        let memberArgs = [];
        if (this.current_token && this.current_token.type === 'LPAREN') {
            isCall = true;
            this.eat('LPAREN');
            memberArgs = this.parseArguments();
            this.eat('RPAREN');
        }
        // Check for assignment (e.g., obj.property = value;)
        if (this.current_token && this.current_token.type === 'EQUAL') {
            this.eat('EQUAL');
            const valueExpr = this.parseExpression();
            this.eat('SEMICOLON');
            return { type: "member_assignment", object: objExpr, member: memberName, value: valueExpr };
        }
        // If not an assignment, it's an access or a method call
        return { type: "member_access", object: objExpr, member: memberName, is_call: isCall, arguments: memberArgs };
    }
    parseNewExpression() {
        this.eat('NEW');
        const className = this.current_token.value;
        this.eat('IDENTIFIER');
        this.eat('LPAREN');
        const argumentsList = this.parseArguments();
        this.eat('RPAREN');
        return { type: "object_creation", class_name: className, arguments: argumentsList };
    }
    // --- Class/Function Definition Logic (methods omitted for space, but follow Python logic) ---
    // The Python implementation for parse_class_definition, parse_function_definition, etc., 
    // are directly convertible but are lengthy. Their structures remain the same.
    parseClassDefinition() {
        if (this.current_token?.type === 'PUBLIC')
            this.eat('PUBLIC');
        this.eat('CLASS');
        const className = this.current_token.value;
        this.eat('IDENTIFIER');
        this.eat('LPAREN');
        this.eat('AT');
        this.eat('INNERSELF');
        this.eat('RPAREN');
        this.eat('LBRACE');
        // Simplified body parsing
        const members = [];
        const methods = [];
        let constructor = null;
        while (this.current_token && this.current_token.type !== 'RBRACE') {
            if (['CONST', 'LET'].includes(this.current_token.type)) {
                members.push(this.parseClassFieldDeclaration());
            }
            else if (this.current_token.type === 'DEF') {
                const methodDef = this.parseFunctionDefinition(true); // is_method = true
                if (methodDef.name === 'init') {
                    constructor = methodDef;
                }
                else {
                    methods.push(methodDef);
                }
            }
            else {
                throw new Error(`Syntax Error: Unexpected token in class body: ${this.current_token.type}`);
            }
        }
        this.eat('RBRACE');
        return { type: "class_definition", name: className, fields: members, methods: methods, constructor: constructor };
    }
    parseClassFieldDeclaration() {
        const declarationType = this.current_token.type;
        this.advance(); // Consume CONST or LET
        const fieldName = this.current_token.value;
        this.eat('IDENTIFIER');
        let initialValue = null;
        if (this.current_token && this.current_token.type === 'EQUAL') {
            this.eat('EQUAL');
            initialValue = this.parseExpression();
        }
        this.eat('SEMICOLON');
        return { type: "field_declaration", kind: declarationType, name: fieldName, value: initialValue };
    }
    parseFunctionDefinition(isMethod = false) {
        this.eat('DEF');
        const functionName = this.current_token.value;
        this.eat('IDENTIFIER');
        this.eat('LPAREN');
        const parameters = [];
        if (this.current_token && this.current_token.type !== 'RPAREN') {
            if (isMethod && this.current_token.type === 'SELF') {
                parameters.push(this.current_token.value);
                this.eat('SELF');
            }
            else if (!isMethod && this.current_token.type === 'SELF') {
                throw new Error("Syntax Error: The 'self' parameter is only allowed in class method definitions.");
            }
            else {
                parameters.push(this.current_token.value);
                this.eat('IDENTIFIER');
            }
            while (this.current_token && this.current_token.type === 'COMMA') {
                this.eat('COMMA');
                parameters.push(this.current_token.value);
                this.eat('IDENTIFIER');
            }
        }
        this.eat('RPAREN');
        this.eat('LBRACE');
        const body = [];
        while (this.current_token && this.current_token.type !== 'RBRACE') {
            if (this.current_token.type === 'RETURN') {
                body.push(this.parseReturnStatement());
            }
            // The body parsing logic should mirror parseMainBody() for local statements
            else if (this.current_token.type === 'PRINT') {
                body.push(this.parsePrintStatement());
            }
            else if (['CONST', 'LET', 'VAR'].includes(this.current_token.type)) {
                body.push(this.parseVariableDeclaration());
            }
            else if (this.current_token.type === 'IDENTIFIER') {
                const nextToken = this.tokens[this.token_index + 1];
                if (nextToken?.type === 'EQUAL') {
                    body.push(this.parseAssignmentStatement());
                }
                else if (nextToken?.type === 'DOT') {
                    // Member access/assignment logic (requires lookahead/re-implementation)
                    const objName = this.current_token.value;
                    this.eat('IDENTIFIER');
                    const objExpr = { type: "variable_access", name: objName };
                    const expr = this.parseMemberAccess(objExpr);
                    body.push(expr);
                    if (expr.type === "member_access" && expr.is_call) {
                        this.eat('SEMICOLON');
                    }
                }
                else if (nextToken?.type === 'LPAREN') {
                    const expr = this.parseFunctionCallExpression();
                    body.push(expr);
                    this.eat('SEMICOLON');
                }
                else {
                    throw new Error(`Syntax Error: Unexpected token in function body: ${this.current_token.type}`);
                }
            }
            else {
                throw new Error(`Syntax Error: Unexpected token in function body: ${this.current_token.type}`);
            }
        }
        this.eat('RBRACE');
        return { type: "function_definition", name: functionName, parameters, body, is_method: isMethod };
    }
    parseReturnStatement() {
        this.eat('RETURN');
        const expression = this.parseExpression();
        this.eat('SEMICOLON');
        return { type: "return_statement", expression };
    }
}
exports.Parser = Parser;
// ====================================================================
// 4. Interpreter Structures
// ====================================================================
class FunctionReturn extends Error {
    value;
    constructor(value) {
        super("FunctionReturn: Internal exception for control flow.");
        this.value = value;
        this.name = "FunctionReturn";
    }
}
exports.FunctionReturn = FunctionReturn;
class PayJarObject {
    class_name;
    fields;
    methods;
    // fields: { [key: string]: { value: any, kind: string } }
    // methods: { [key: string]: ASTNode }
    constructor(class_name, fields, methods) {
        this.class_name = class_name;
        this.fields = fields;
        this.methods = methods;
    }
    toString() {
        const fieldStr = Object.entries(this.fields).map(([name, data]) => `${name}=${data.value}`).join(', ');
        return `<Object ${this.class_name} (${fieldStr})>`;
    }
}
exports.PayJarObject = PayJarObject;
// ====================================================================
// 5. Interpreter
// ====================================================================
class Interpreter {
    // scopes: { [key: string]: { value: any, kind: string } }[]
    scopes = [{}];
    functions = {};
    user_defined_classes = {};
    get current_scope() {
        return this.scopes[this.scopes.length - 1];
    }
    push_scope(scope_dict = {}) {
        this.scopes.push(scope_dict);
    }
    pop_scope() {
        if (this.scopes.length > 1) {
            this.scopes.pop();
        }
        else {
            throw new Error("Runtime Error: Cannot pop global scope.");
        }
    }
    // --- Variable Access and Assignment ---
    getVariable(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (name in this.scopes[i]) {
                return this.scopes[i][name];
            }
        }
        throw new Error(`Runtime Error: Undefined variable '${name}'`);
    }
    setVariable(name, value, kind = null, declareIfNotExist = false) {
        if (kind) { // Declaration
            if (name in this.current_scope) {
                throw new Error(`Runtime Error: Redeclaration of variable '${name}' is not allowed in this scope.`);
            }
            this.current_scope[name] = { value: value, kind: kind };
        }
        else { // Assignment
            for (let i = this.scopes.length - 1; i >= 0; i--) {
                if (name in this.scopes[i]) {
                    if (this.scopes[i][name].kind === 'CONST') {
                        throw new Error(`Runtime Error: Cannot assign to a constant variable '${name}'.`);
                    }
                    this.scopes[i][name].value = value;
                    return value;
                }
            }
            if (declareIfNotExist) {
                this.current_scope[name] = { value: value, kind: "LET" };
            }
            else {
                throw new Error(`Runtime Error: Assignment to undefined variable '${name}'.`);
            }
        }
        return value;
    }
    // --- Interpreter Entry Point ---
    interpret(ast) {
        if (ast.type !== "main_definition") {
            throw new Error(`Runtime Error: Unsupported AST type for interpretation: ${ast.type}`);
        }
        // First pass: Hoisting (functions and classes)
        for (const statement of ast.body) {
            if (statement.type === "function_definition") {
                this.visitFunctionDefinition(statement);
            }
            else if (statement.type === "class_definition") {
                this.visitClassDefinition(statement);
            }
        }
        // Second pass: Execute main body statements
        for (const statement of ast.body) {
            if (statement.type !== "function_definition" && statement.type !== "class_definition") {
                try {
                    this.visit(statement);
                }
                catch (e) {
                    if (e instanceof FunctionReturn) {
                        console.warn(`Warning: Return statement encountered in main body. Value: ${e.value}`);
                    }
                    else {
                        throw e;
                    }
                }
            }
        }
    }
    // --- Visit Dispatcher ---
    visit(node, current_instance = null) {
        switch (node.type) {
            case "print_statement": return this.visitPrintStatement(node);
            case "variable_declaration": return this.visitVariableDeclaration(node);
            case "assignment_statement": return this.visitAssignmentStatement(node);
            case "literal": return node.value;
            case "variable_access": return this.visitVariableAccess(node);
            case "template_string": return this.visitTemplateString(node);
            case "function_definition": return this.visitFunctionDefinition(node);
            case "function_call": return this.visitFunctionCall(node, current_instance);
            case "return_statement": return this.visitReturnStatement(node);
            case "class_definition": return this.visitClassDefinition(node);
            case "object_creation": return this.visitObjectCreation(node);
            case "member_access": return this.visitMemberAccess(node, current_instance);
            case "member_assignment": return this.visitMemberAssignment(node, current_instance);
            case "binary_op": return this.visitBinaryOp(node);
            case "unary_op": return this.visitUnaryOp(node);
            case "field_declaration": return; // Handled during object creation
            default: throw new Error(`Runtime Error: Unknown AST node type: ${node.type}`);
        }
    }
    // --- Visit Implementations ---
    visitPrintStatement(node) {
        const valueToPrint = this.visit(node.expression);
        console.log(valueToPrint);
    }
    visitVariableDeclaration(node) {
        const varName = node.name;
        const varKind = node.kind;
        const varValue = this.visit(node.value);
        this.setVariable(varName, varValue, varKind);
    }
    visitAssignmentStatement(node) {
        const varName = node.name;
        const newValue = this.visit(node.value);
        this.setVariable(varName, newValue);
    }
    visitVariableAccess(node) {
        return this.getVariable(node.name).value;
    }
    visitTemplateString(node) {
        let resultString = "";
        for (const part of node.parts) {
            if (part.type === "literal") {
                resultString += part.value;
            }
            else if (part.type === "variable_access") {
                const variableValue = this.getVariable(part.name).value;
                resultString += String(variableValue);
            }
            else {
                throw new Error(`Runtime Error: Unexpected part in template string: ${part.type}`);
            }
        }
        return resultString;
    }
    visitFunctionDefinition(node) {
        const funcName = node.name;
        if (!node.is_method && funcName in this.functions) {
            throw new Error(`Runtime Error: Function '${funcName}' already defined globally.`);
        }
        this.functions[funcName] = node;
    }
    visitFunctionCall(node, currentInstance) {
        const funcName = node.name;
        let funcDefinition = null;
        if (currentInstance && funcName in currentInstance.methods) {
            funcDefinition = currentInstance.methods[funcName];
        }
        else if (funcName in this.functions) {
            funcDefinition = this.functions[funcName];
        }
        else {
            throw new Error(`Runtime Error: Call to undefined function or method '${funcName}'`);
        }
        const expectedParams = funcDefinition.parameters;
        const providedArgsNodes = node.arguments;
        const isMethod = funcDefinition.is_method;
        const paramOffset = (isMethod && expectedParams[0] === 'self') ? 1 : 0;
        const expectedArgsCount = expectedParams.length - paramOffset;
        if (expectedArgsCount !== providedArgsNodes.length) {
            throw new Error(`Runtime Error: Function/Method '${funcName}' expected ${expectedArgsCount} arguments but got ${providedArgsNodes.length}`);
        }
        this.push_scope();
        // 1. Bind 'self' for methods
        if (isMethod && currentInstance) {
            this.setVariable('self', currentInstance, 'LET');
        }
        // 2. Evaluate arguments
        const evaluatedArgs = providedArgsNodes.map(argNode => this.visit(argNode, currentInstance));
        // 3. Bind arguments to parameters
        for (let i = 0; i < expectedArgsCount; i++) {
            this.setVariable(expectedParams[i + paramOffset], evaluatedArgs[i], 'LET');
        }
        let returnValue = null;
        try {
            for (const statement of funcDefinition.body) {
                this.visit(statement, currentInstance);
            }
        }
        catch (e) {
            if (e instanceof FunctionReturn) {
                returnValue = e.value;
            }
            else {
                throw e;
            }
        }
        finally {
            this.pop_scope();
        }
        return returnValue;
    }
    visitReturnStatement(node) {
        const returnValue = this.visit(node.expression);
        throw new FunctionReturn(returnValue);
    }
    visitClassDefinition(node) {
        const className = node.name;
        if (className in this.user_defined_classes) {
            throw new Error(`Runtime Error: Class '${className}' already defined.`);
        }
        this.user_defined_classes[className] = node;
    }
    visitObjectCreation(node) {
        const className = node.class_name;
        const evaluatedArgs = node.arguments.map((arg) => this.visit(arg));
        const classDefinition = this.user_defined_classes[className];
        if (!classDefinition) {
            throw new Error(`Runtime Error: Attempt to create instance of undefined class '${className}'`);
        }
        const instanceFields = {};
        const instanceMethods = {};
        // Initialize fields
        for (const field of classDefinition.fields) {
            const initialValue = field.value ? this.visit(field.value) : null;
            instanceFields[field.name] = { value: initialValue, kind: field.kind };
        }
        // Map methods
        for (const methodNode of classDefinition.methods) {
            methodNode.is_method = true;
            instanceMethods[methodNode.name] = methodNode;
        }
        const instance = new PayJarObject(className, instanceFields, instanceMethods);
        // Execute constructor (init method)
        if (classDefinition.constructor) {
            const constructorNode = classDefinition.constructor;
            constructorNode.is_method = true;
            const expectedConstructorParams = constructorNode.parameters;
            // Check for 'self' parameter
            if (!expectedConstructorParams || expectedConstructorParams[0] !== 'self') {
                throw new Error(`Runtime Error: Constructor 'init' for class '${className}' must have 'self' as its first parameter.`);
            }
            if ((expectedConstructorParams.length - 1) !== evaluatedArgs.length) {
                throw new Error(`Runtime Error: Constructor for '${className}' expected ${expectedConstructorParams.length - 1} arguments but got ${evaluatedArgs.length}`);
            }
            this.push_scope();
            this.setVariable('self', instance, 'LET');
            for (let i = 0; i < evaluatedArgs.length; i++) {
                this.setVariable(expectedConstructorParams[i + 1], evaluatedArgs[i], 'LET');
            }
            try {
                for (const statement of constructorNode.body) {
                    this.visit(statement, instance);
                }
            }
            catch (e) {
                if (!(e instanceof FunctionReturn))
                    throw e;
            }
            finally {
                this.pop_scope();
            }
        }
        return instance;
    }
    visitMemberAccess(node, currentInstance) {
        const obj = this.visit(node.object);
        if (!(obj instanceof PayJarObject)) {
            throw new Error(`Runtime Error: Attempt to access member '${node.member}' on a non-object type.`);
        }
        const memberName = node.member;
        if (node.is_call) { // Method call
            if (!(memberName in obj.methods)) {
                throw new Error(`Runtime Error: Method '${memberName}' not found on object of type '${obj.class_name}'`);
            }
            // Delegate to function call logic, passing the object itself as the instance
            return this.visitFunctionCall({ type: "function_call", name: memberName, arguments: node.arguments }, obj);
        }
        else { // Field access
            if (!(memberName in obj.fields)) {
                throw new Error(`Runtime Error: Field '${memberName}' not found on object of type '${obj.class_name}'`);
            }
            return obj.fields[memberName].value;
        }
    }
    visitMemberAssignment(node, currentInstance) {
        const obj = this.visit(node.object);
        if (!(obj instanceof PayJarObject)) {
            throw new Error(`Runtime Error: Attempt to assign member '${node.member}' on a non-object type.`);
        }
        const memberName = node.member;
        const newValue = this.visit(node.value);
        if (!(memberName in obj.fields)) {
            throw new Error(`Runtime Error: Field '${memberName}' not found on object of type '${obj.class_name}' for assignment.`);
        }
        if (obj.fields[memberName].kind === 'CONST') {
            throw new Error(`Runtime Error: Cannot assign to constant field '${memberName}' of object '${obj.class_name}'.`);
        }
        obj.fields[memberName].value = newValue;
    }
    visitBinaryOp(node) {
        const leftVal = this.visit(node.left);
        const rightVal = this.visit(node.right);
        const operator = node.operator;
        if (typeof leftVal !== typeof rightVal) {
            // Basic type compatibility check, often required for concatenation vs arithmetic
        }
        switch (operator) {
            case '+': return leftVal + rightVal;
            case '-': return leftVal - rightVal;
            case '*': return leftVal * rightVal;
            case '/':
                if (rightVal === 0)
                    throw new Error("Runtime Error: Division by zero.");
                // Ensure integer division if both are integers (mimicking Python's // behavior if that was intended for /)
                if (Number.isInteger(leftVal) && Number.isInteger(rightVal)) {
                    return Math.trunc(leftVal / rightVal);
                }
                return leftVal / rightVal;
            case '%':
                if (rightVal === 0)
                    throw new Error("Runtime Error: Modulo by zero.");
                return leftVal % rightVal;
            case '==': return leftVal === rightVal;
            case '!=': return leftVal !== rightVal;
            case '<': return leftVal < rightVal;
            case '>': return leftVal > rightVal;
            case '<=': return leftVal <= rightVal;
            case '>=': return leftVal >= rightVal;
            default: throw new Error(`Runtime Error: Unsupported binary operator: ${operator}`);
        }
    }
    visitUnaryOp(node) {
        const operandVal = this.visit(node.operand);
        const operator = node.operator;
        if (typeof operandVal !== 'number') {
            throw new Error(`Runtime Error: Unary operator ${operator} applied to non-numeric type.`);
        }
        if (operator === '+')
            return +operandVal;
        if (operator === '-')
            return -operandVal;
        throw new Error(`Runtime Error: Unsupported unary operator: ${operator}`);
    }
}
exports.Interpreter = Interpreter;
// ====================================================================
// 6. Runtime Execution Classes (PJRT, PJS)
// ====================================================================
// PJRT (PayJar RunTime)
class PJRT {
    code;
    debug;
    constructor(code, debug = false) {
        this.code = code;
        this.debug = debug;
        this.run_code(debug);
    }
    run_code(debug_on) {
        let tokens = [];
        let ast = null;
        try {
            const lexer = new Lexer(this.code);
            tokens = lexer.tokenize();
            if (debug_on)
                console.log("Lexer Tokens:", tokens.map(t => t.toString()));
            const parser = new Parser(tokens);
            ast = parser.parse();
            if (debug_on)
                console.log("Parsed AST:", JSON.stringify(ast, null, 2));
            const interpreter = new Interpreter();
            interpreter.interpret(ast);
        }
        catch (e) {
            console.error(`Error during PJRT execution:`, e);
        }
        return { tokens, ast };
    }
}
exports.PJRT = PJRT;
// PJS (PayJar Shell/Simulator - Highly simplified, as the Python version seemed incomplete)
class PJS {
    // In a real TS environment, PJS would handle the input/output shell.
    // Given the Python PJS was mostly a wrapper for PJRT, we'll keep it simple.
    // The original Python PJS seemed to confuse its own AST with the COMP AST.
    // For TypeScript, we'll just demonstrate calling PJRT.
    run(code, inputData = "") {
        console.log(`--- Running Code (Input Simulated: ${inputData}) ---`);
        // Note: The Interpreter class uses console.log for PRINT statements and 
        // global `input()` (or simulated input) for READLN, which would need 
        // a more complex implementation for true simulation.
        new PJRT(code, true);
        console.log(`--- Execution Complete ---`);
    }
}
exports.PJS = PJS;
// Example usage if this file were run directly (Node.js environment):
/*
const sampleCode = `
public class Main(@self) {
    let x = 10;
    println(x + 5);
}
`;

new PJRT(sampleCode, true);
*/
//# sourceMappingURL=payjar.js.map