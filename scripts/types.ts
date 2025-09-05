import ts from "typescript";
import { NextRequest, NextResponse } from "next/server";

export interface QuickwireContext {
  req: NextRequest;
  // res?: NextResponse;
  getHeaders: () => Record<string, string>;
  getCookies: () => Record<string, string>;
  getIp: () => string;
  getUserAgent: () => string;
}

export interface ExportedFunction {
  name: string;
  type: "function" | "arrow" | "variable";
  parameters: { name: string; type: string; optional?: boolean }[];
  returnType?: string;
  isAsync?: boolean;
  httpMethod?: string;
  needsContext?: boolean; // New flag to indicate if function needs request context
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
