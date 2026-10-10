export class ToolContractError extends Error {
  constructor(
    message: string,
    public readonly details: string[],
  ) {
    super(message);
    this.name = "ToolContractError";
  }
}

export class AccessDeniedError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class ToolNotFoundError extends Error {
  constructor(toolName: string) {
    super(`Unknown tool: ${toolName}`);
    this.name = "ToolNotFoundError";
  }
}
