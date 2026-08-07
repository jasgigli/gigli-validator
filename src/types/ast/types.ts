// AST type aliases and interfaces for Gigli Unified Runtime

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

export interface PrimitiveNode extends BaseASTNode {
  type: "primitive";
  primitive: PrimitiveType;
  rules?: RuleNode[];
  transformers?: TransformerNode[];
  optional?: boolean;
}

export interface ObjectNode extends BaseASTNode {
  type: "object";
  fields: Record<string, ASTNode>;
  rules?: RuleNode[];
  transformers?: TransformerNode[];
  optional?: boolean;
}

export interface ArrayNode extends BaseASTNode {
  type: "array";
  element: ASTNode;
  rules?: RuleNode[];
  transformers?: TransformerNode[];
  optional?: boolean;
}

export interface RuleNode extends BaseASTNode {
  type: "rule";
  name: string;
  params?: Record<string, any>;
  message?: string;
  key?: string;
}

export interface TransformerNode extends BaseASTNode {
  type: "transformer";
  name: string;
  params?: Record<string, any>;
}

export interface PipelineNode extends BaseASTNode {
  type: "pipeline";
  steps: PipelineStepNode[];
}

export interface ClassNode extends BaseASTNode {
  type: "class";
  className: string;
  fields: Record<string, ASTNode>;
  refinements?: Array<{ fn: (obj: any) => boolean; message?: string }>;
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

export type ASTNode =
  | PrimitiveNode
  | ObjectNode
  | ArrayNode
  | RuleNode
  | TransformerNode
  | PipelineNode
  | ClassNode;
