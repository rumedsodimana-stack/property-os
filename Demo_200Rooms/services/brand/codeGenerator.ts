/**
 * Code Generation Engine
 * 
 * Generates and modifies TypeScript/React code using AST manipulation.
 * Ensures type-safe, formatted code that integrates seamlessly.
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import prettier from 'prettier';

export interface CodeModification {
    type: 'replace' | 'insert' | 'update' | 'delete';
    target: string; // Line number, function name, or selector
    code?: string;
    imports?: string[];
}

export interface GeneratedCode {
    code: string;
    imports: string[];
    formatted: string;
}

export interface FileChange {
    filePath: string;
    content: string;
    type: 'css' | 'typescript' | 'json';
    description: string;
}

class CodeGenerator {
    /**
     * Generate CSS variable update
     */
    generateCSSUpdate(
        variableName: string,
        newValue: string,
        currentValue?: string
    ): string {
        return `  ${variableName}: ${newValue}; /* Updated from ${currentValue || 'previous value'} */`;
    }

    /**
     * Generate React component prop update
     */
    generatePropUpdate(
        componentName: string,
        propName: string,
        propValue: any
    ): GeneratedCode {
        const code = `<${componentName} ${propName}={${JSON.stringify(propValue)}} />`;

        return {
            code,
            imports: [],
            formatted: code
        };
    }

    /**
     * Generate config constant update
     */
    async generateConfigUpdate(
        configName: string,
        newValue: any,
        type?: string
    ): Promise<GeneratedCode> {
        let valueString: string;

        if (typeof newValue === 'string') {
            valueString = `'${newValue}'`;
        } else if (typeof newValue === 'number' || typeof newValue === 'boolean') {
            valueString = String(newValue);
        } else {
            valueString = JSON.stringify(newValue, null, 2);
        }

        const code = `const ${configName}${type ? `: ${type}` : ''} = ${valueString};`;

        return {
            code,
            imports: [],
            formatted: await this.formatCode(code, 'typescript')
        };
    }

    /**
     * Generate workflow validation step
     */
    async generateValidationStep(
        condition: string,
        errorMessage: string
    ): Promise<GeneratedCode> {
        const code = `
if (${condition}) {
  throw new Error('${errorMessage}');
}
`;

        return {
            code: code.trim(),
            imports: [],
            formatted: await this.formatCode(code, 'typescript')
        };
    }

    /**
     * Generate if-check with business logic
     */
    async generateBusinessLogic(
        condition: string,
        action: string,
        imports: string[] = []
    ): Promise<GeneratedCode> {
        const code = `
if (${condition}) {
  ${action}
}
`;

        return {
            code: code.trim(),
            imports,
            formatted: await this.formatCode(code, 'typescript')
        };
    }

    /**
     * Modify existing TypeScript file using AST
     */
    async modifyTypeScriptFile(
        sourceCode: string,
        modifications: CodeModification[]
    ): Promise<string> {
        const ast = parser.parse(sourceCode, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        // Apply modifications using AST traversal
        for (const mod of modifications) {
            if (mod.type === 'update' && mod.code) {
                this.applyASTModification(ast, mod);
            }
        }

        // Generate code from modified AST
        const output = generate(ast, {
            retainLines: true,
            comments: true
        });

        // Format with Prettier
        return this.formatCode(output.code, 'typescript');
    }

    /**
     * Apply AST modification
     */
    private applyASTModification(
        ast: any,
        modification: CodeModification
    ): void {
        traverse(ast, {
            // Update variable declarations
            VariableDeclarator(path) {
                if (path.node.id.type === 'Identifier' &&
                    path.node.id.name === modification.target) {
                    if (modification.code) {
                        // Parse new value
                        const newValueAst = parser.parseExpression(modification.code);
                        path.node.init = newValueAst;
                    }
                }
            },

            // Update object properties
            ObjectProperty(path) {
                if (path.node.key.type === 'Identifier' &&
                    path.node.key.name === modification.target) {
                    if (modification.code) {
                        const newValueAst = parser.parseExpression(modification.code);
                        path.node.value = newValueAst;
                    }
                }
            }
        });
    }

    /**
     * Insert code at specific location
     */
    insertCodeAtLine(
        sourceCode: string,
        lineNumber: number,
        codeToInsert: string
    ): string {
        const lines = sourceCode.split('\n');
        lines.splice(lineNumber - 1, 0, codeToInsert);
        return lines.join('\n');
    }

    /**
     * Replace code at specific line range
     */
    replaceCodeLines(
        sourceCode: string,
        startLine: number,
        endLine: number,
        newCode: string
    ): string {
        const lines = sourceCode.split('\n');
        const before = lines.slice(0, startLine - 1);
        const after = lines.slice(endLine);
        return [...before, newCode, ...after].join('\n');
    }

    /**
     * Add import statement if not exists
     */
    async addImport(
        sourceCode: string,
        importStatement: string
    ): Promise<string> {
        // Check if import already exists
        if (sourceCode.includes(importStatement)) {
            return sourceCode;
        }

        const ast = parser.parse(sourceCode, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        // Parse import statement
        const importAst = parser.parse(importStatement, {
            sourceType: 'module'
        });

        // Insert import at the beginning
        if (importAst.program.body.length > 0) {
            ast.program.body.unshift(importAst.program.body[0]);
        }

        const output = generate(ast);
        return await this.formatCode(output.code, 'typescript');
    }

    /**
     * Update CSS custom property
     */
    updateCSSVariable(
        cssContent: string,
        variableName: string,
        newValue: string
    ): string {
        // Match --variable-name: value;
        const regex = new RegExp(
            `(${variableName}\\s*:\\s*)([^;]+)(;)`,
            'g'
        );

        const updated = cssContent.replace(
            regex,
            `$1${newValue}$3`
        );

        return updated;
    }

    /**
     * Format code with Prettier
     */
    private async formatCode(code: string, parser: 'typescript' | 'css'): Promise<string> {
        try {
            return await prettier.format(code, {
                parser,
                semi: true,
                singleQuote: true,
                tabWidth: 2,
                trailingComma: 'es5'
            });
        } catch (error) {
            console.warn('[Code Generator] Prettier formatting failed:', error);
            return code;
        }
    }

    /**
     * Generate React Hook update
     */
    async generateHookUpdate(
        hookName: string,
        initialValue: any
    ): Promise<GeneratedCode> {
        const code = `const [${hookName}, set${this.capitalize(hookName)}] = useState(${JSON.stringify(initialValue)});`;

        return {
            code,
            imports: ["import { useState } from 'react';"],
            formatted: await this.formatCode(code, 'typescript')
        };
    }

    /**
     * Generate type definition
     */
    async generateTypeDefinition(
        typeName: string,
        properties: Record<string, string>
    ): Promise<GeneratedCode> {
        const propsString = Object.entries(properties)
            .map(([key, type]) => `  ${key}: ${type};`)
            .join('\n');

        const code = `interface ${typeName} {\n${propsString}\n}`;

        return {
            code,
            imports: [],
            formatted: await this.formatCode(code, 'typescript')
        };
    }

    /**
     * Validate generated code (syntax check)
     */
    validateCode(code: string): { valid: boolean; errors: string[] } {
        try {
            parser.parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx']
            });
            return { valid: true, errors: [] };
        } catch (error: any) {
            return {
                valid: false,
                errors: [error.message]
            };
        }
    }

    /**
     * Helper: Capitalize string
     */
    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Generate complete React component
     */
    async generateComponent(
        componentName: string,
        props: Record<string, string>,
        jsx: string
    ): Promise<GeneratedCode> {
        const propsInterface = Object.keys(props).length > 0
            ? `interface ${componentName}Props {\n${Object.entries(props)
                .map(([key, type]) => `  ${key}: ${type};`)
                .join('\n')}\n}\n\n`
            : '';

        const propsParam = Object.keys(props).length > 0
            ? `{ ${Object.keys(props).join(', ')} }: ${componentName}Props`
            : '';

        const code = `
import React from 'react';

${propsInterface}const ${componentName}: React.FC${Object.keys(props).length > 0 ? `<${componentName}Props>` : ''} = (${propsParam}) => {
  return (
    ${jsx}
  );
};

export default ${componentName};
`;

        return {
            code: code.trim(),
            imports: ["import React from 'react';"],
            formatted: await this.formatCode(code, 'typescript')
        };
    }
}

// Export singleton
export const codeGenerator = new CodeGenerator();

// Export class for testing
export default CodeGenerator;
