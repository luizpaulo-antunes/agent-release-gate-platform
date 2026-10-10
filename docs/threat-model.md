# Threat model

## Protected assets

- tenant-scoped customer information;
- caller identity and role;
- prompts, credentials, and traces;
- tool contracts and release evidence;
- CI baselines and quality thresholds.

## Trust boundaries and controls

| Threat | Control in this lab | Residual risk |
| --- | --- | --- |
| Prompt injection | Pre-tool refusal cases and execution-time policy | Regex is illustrative; semantic and policy-layer defenses are still needed |
| Cross-tenant access | Trusted actor tenant compared with requested tenant | Production identity must be cryptographically verified |
| Role escalation | Role comes from request context, not model arguments | Header identity is a lab adapter, not authentication |
| Tool schema drift | AJV validates input and output | Schema governance and compatibility policy remain necessary |
| Trace leakage | Raw prompts and sensitive keys are redacted | Free-text exception messages still require review |
| Baseline gaming | Versioned thresholds and explicit regression limits | Repository governance and required reviewers are not configured locally |
| Excessive retry/cost | Cost signal and resilience guidance | No live provider or retry controller in the deterministic path |

## Explicit non-goals

This is not a penetration-testing toolkit, production identity service, DLP product, or proof that an LLM is safe. It demonstrates testable engineering boundaries and release evidence.
