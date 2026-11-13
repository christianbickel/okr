export type GraphQLVariables = Record<string, unknown>;

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: unknown[];
    extensions?: Record<string, unknown>;
  }>;
}

export class ConsolidateApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly errors?: GraphQLResponse<unknown>["errors"]
  ) {
    super(message);
    this.name = "ConsolidateApiError";
  }
}
