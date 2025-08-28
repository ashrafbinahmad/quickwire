import ts from "typescript";

export interface ExportedFunction {
  name: string;
  type: "function" | "arrow" | "variable";
  parameters: { name: string; type: string; optional?: boolean }[];
  returnType?: string;
  isAsync?: boolean;
  httpMethod?: string;
  node: ts.Node;
}

export interface ExportedType {
  name: string;
  type: "interface" | "type" | "enum" | "class";
  declaration: string;
  node: ts.Node;
}

export interface ModuleExports {
  functions: ExportedFunction[];
  types: ExportedType[];
  imports: string[];
}
