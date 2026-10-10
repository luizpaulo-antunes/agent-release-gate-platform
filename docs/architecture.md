# Architecture

## Boundaries

The project separates five concerns:

1. `AgentService` selects a safe execution path and presents results.
2. `ToolRegistry` validates contracts and enforces trusted authorization context.
3. MCP adapts the registry to the official protocol without owning domain policy.
4. The evaluation runner converts observable behavior into release metrics.
5. OpenTelemetry exports redacted operational evidence.

This avoids placing authorization in the prompt, tool description, UI, or model output. Those layers can influence a request, but they are not trusted enforcement points.

## Request sequence

```text
HTTP identity headers
        |
        v
AgentService -- unsafe instruction? --> refuse
        |
        v
select tool
        |
        v
AJV input contract
        |
        v
role + tenant policy
        |
        v
tool implementation
        |
        v
AJV output contract
        |
        v
grounded response + citations + release signals
```

## Provider boundary

The deterministic provider makes PR validation repeatable. A hosted model adapter should be introduced without changing authorization or tool contracts. Model-backed evaluations should run separately until their judges have been calibrated against human labels.
