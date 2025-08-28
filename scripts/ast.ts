import fs from "fs";
import ts from "typescript";
import { CONFIG } from "./config";
import { fileCache, getCachedExports, setCachedExports } from "./cache";
import { ExportedFunction, ExportedType, ModuleExports } from "./types";

export function analyzeModuleExports(filePath: string): ModuleExports {
  // Check cache first
  const cached = getCachedExports(filePath);
  if (cached) return cached;

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.warn(`⚠️ Failed to read file ${filePath}:`, error);
    return { functions: [], types: [], imports: [] };
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    CONFIG.compilerOptions.target!,
    true,
    ts.ScriptKind.TS
  );

  const functions: ExportedFunction[] = [];
  const types: ExportedType[] = [];
  const imports: string[] = [];

  function visit(node: ts.Node) {
    try {
      if (ts.isImportDeclaration(node)) {
        imports.push(node.getText().trim());
      }

      if (hasExportModifier(node)) {
        if (ts.isFunctionDeclaration(node) && node.name) {
          const func = analyzeFunctionDeclaration(node);
          func.httpMethod = detectHttpMethod(func.name, func.parameters);
          functions.push(func);
        } else if (ts.isVariableStatement(node)) {
          const funcs = analyzeVariableStatement(node);
          funcs.forEach(func => {
            func.httpMethod = detectHttpMethod(func.name, func.parameters);
          });
          functions.push(...funcs);
        } else {
          const exportedType = analyzeTypeDeclaration(node);
          if (exportedType) types.push(exportedType);
        }
      }

      ts.forEachChild(node, visit);
    } catch (error) {
      console.warn(`⚠️ Error analyzing node in ${filePath}:`, error);
    }
  }

  visit(sourceFile);

  const result = { functions, types, imports };
  setCachedExports(filePath, result);
  return result;
}

export function hasExportModifier(node: ts.Node): boolean {
  return (
    (ts.canHaveModifiers(node) &&
      ts
        .getModifiers(node)
        ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) ||
    false
  );
}

export function analyzeFunctionDeclaration(
  node: ts.FunctionDeclaration
): ExportedFunction {
  const name = node.name!.text;
  const parameters = node.parameters.map((p) => ({
    name: (p.name as ts.Identifier).text,
    type: p.type?.getText() || "any",
    optional: !!p.questionToken,
  }));

  const returnType = node.type?.getText();
  const isAsync =
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) || false;

  return { name, type: "function", parameters, returnType, isAsync, node };
}

export function analyzeVariableStatement(
  node: ts.VariableStatement
): ExportedFunction[] {
  const funcs: ExportedFunction[] = [];

  for (const decl of node.declarationList.declarations) {
    if (ts.isIdentifier(decl.name) && decl.initializer) {
      let funcNode: ts.ArrowFunction | ts.FunctionExpression | null = null;
      let type: "arrow" | "variable" = "variable";

      if (ts.isArrowFunction(decl.initializer)) {
        funcNode = decl.initializer;
        type = "arrow";
      } else if (ts.isFunctionExpression(decl.initializer)) {
        funcNode = decl.initializer;
        type = "variable";
      }

      if (funcNode) {
        const parameters = funcNode.parameters.map((p) => ({
          name: (p.name as ts.Identifier).text,
          type: p.type?.getText() || "any",
          optional: !!p.questionToken,
        }));

        const returnType = funcNode.type?.getText();
        const isAsync =
          funcNode.modifiers?.some(
            (m) => m.kind === ts.SyntaxKind.AsyncKeyword
          ) || false;

        funcs.push({
          name: decl.name.text,
          type,
          parameters,
          returnType,
          isAsync,
          node: decl,
        });
      }
    }
  }

  return funcs;
}

export function analyzeTypeDeclaration(node: ts.Node): ExportedType | null {
  try {
    if (ts.isInterfaceDeclaration(node)) {
      return {
        name: node.name.text,
        type: "interface",
        declaration: node.getText().trim(),
        node,
      };
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return {
        name: node.name.text,
        type: "type",
        declaration: node.getText().trim(),
        node,
      };
    }
    if (ts.isEnumDeclaration(node)) {
      return {
        name: node.name.text,
        type: "enum",
        declaration: node.getText().trim(),
        node,
      };
    }
    if (ts.isClassDeclaration(node) && node.name) {
      return {
        name: node.name.text,
        type: "class",
        declaration: node.getText().trim(),
        node,
      };
    }
  } catch (error) {
    console.warn(`⚠️ Error analyzing type declaration:`, error);
  }

  return null;
}

export function detectHttpMethod(functionName: string, parameters?: ExportedFunction["parameters"]): string {
  const lowerName = functionName.toLowerCase();
  
  // If we have complex object parameters, prefer POST regardless of function name
  if (parameters && parameters.length === 1) {
    const param = parameters[0];
    // Check if the parameter is an object type (contains : or starts with {)
    if (param.type.includes(':') || param.type.startsWith('{')) {
      return 'POST';
    }
  }
  
  for (const [method, prefixes] of Object.entries(CONFIG.httpMethods)) {
    for (const prefix of prefixes) {
      if (lowerName.startsWith(prefix)) {
        return method;
      }
    }
  }
  
  return 'POST';
}