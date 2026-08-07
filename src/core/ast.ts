// AST Node Types for Gigli Unified Runtime
export type PrimitiveType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "object"
  | "array"
  | "any";

export interface BaseASTNode {
  type: string;
}

// Primitive node (string, number, etc.)
export interface PrimitiveNode extends BaseASTNode {
  type: "primitive";
  primitive: PrimitiveType;
  rules?: RuleNode[];
  transformers?: TransformerNode[];
  optional?: boolean;
}

// Object node (for v.object())
export interface ObjectNode extends BaseASTNode {
  type: "object";
  fields: Record<string, ASTNode>;
  rules?: RuleNode[];
  transformers?: TransformerNode[];
  optional?: boolean;
}

// Array node (for v.array())
export interface ArrayNode extends BaseASTNode {
  type: "array";
  element: ASTNode;
  rules?: RuleNode[];
  transformers?: TransformerNode[];
  optional?: boolean;
}

// Rule node (e.g., min, max, email, custom)
export interface RuleNode extends BaseASTNode {
  type: "rule";
  name: string;
  params?: Record<string, any>;
  message?: string;
  key?: string;
}

// Transformer node (e.g., trim, lower, custom)
export interface TransformerNode extends BaseASTNode {
  type: "transformer";
  name: string;
  params?: Record<string, any>;
}

// Pipeline node (for v.pipeline())
export interface PipelineNode extends BaseASTNode {
  type: "pipeline";
  steps: PipelineStepNode[];
}

export type PipelineStepNode =
  | { type: "transform"; fn: TransformerNode | ((value: any) => any) }
  | { type: "validate"; schema: ASTNode }
  | { type: "refine"; fn: (value: any) => boolean; message?: string }
  | { type: "dispatch"; field: string; cases: Record<string, ASTNode> }
  | {
      type: "effect";
      onSuccess?: (trace: any) => void;
      onFailure?: (trace: any) => void;
    };

// Decorator/Class node (for class-based validation)
export interface ClassNode extends BaseASTNode {
  type: "class";
  className: string;
  fields: Record<string, ASTNode>;
  refinements?: Array<{ fn: (obj: any) => boolean; message?: string }>;
}

export type ASTNode =
  | PrimitiveNode
  | ObjectNode
  | ArrayNode
  | RuleNode
  | TransformerNode
  | PipelineNode
  | ClassNode;
