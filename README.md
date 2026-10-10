# Agent Release Gate Platform

[![Quality Gate](https://github.com/luizpaulo-antunes/agent-release-gate-platform/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/luizpaulo-antunes/agent-release-gate-platform/actions/workflows/quality-gate.yml)

> A production-minded TypeScript reference project for testing RAG agents and MCP tools before release.

This project turns agent behavior into measurable release evidence. It combines a deterministic RAG agent, real MCP transport, execution-time authorization, JSON Schema contracts, adversarial cases, baseline comparison, a CI quality gate, and redacted OpenTelemetry traces.

## Recruiter snapshot

| Capability | Evidence in this repository |
| --- | --- |
| AI quality engineering | Versioned evaluation cases for behavior, grounding, tool selection, safety, latency, and cost |
| MCP | Official MCP SDK with stateless Streamable HTTP transport and two executable tools |
| Security | Role enforcement, tenant isolation, prompt-injection refusal, input/output contracts, and safe errors |
| RAG | Deterministic retrieval with source identifiers and grounded answers |
| Release engineering | Baseline-aware quality gate that fails CI on material regression |
| Observability | OTLP traces containing fingerprints and operational signals instead of raw prompts or secrets |
| Reproducibility | No model key or external service is required for the default test and evaluation path |

## Architecture

```text
Client / evaluator
       |
       v
RAG agent + MCP tools
       |
       v
contract validation + RBAC + tenant policy + adversarial checks
       |
       v
versioned evaluation dataset + baseline comparison
       |
       v
CI quality gate
       |
       v
redacted OpenTelemetry traces ---> Jaeger dashboard
```

The deterministic provider is intentional: CI should not become flaky or expensive because a hosted model changed. A real provider can be added behind the provider boundary and evaluated in a scheduled, separately calibrated workflow.

## Quick start

Requirements: Node.js 22+. Docker is optional and is used only for the local Jaeger trace dashboard.

```bash
npm install
npm run check
npm run dev
```

Run a grounded agent request:

```bash
curl -s http://localhost:3000/v1/agent/run \
  -H 'content-type: application/json' \
  -H 'x-user-id: analyst-1' \
  -H 'x-tenant-id: tenant-a' \
  -H 'x-role: analyst' \
  -d '{"question":"What should block an AI agent release?"}'
```

Run an authorized synthetic risk lookup:

```bash
curl -s http://localhost:3000/v1/agent/run \
  -H 'content-type: application/json' \
  -H 'x-user-id: analyst-1' \
  -H 'x-tenant-id: tenant-a' \
  -H 'x-role: analyst' \
  -d '{"question":"Show the customer risk for cust-100 in tenant-a"}'
```

Change the role to `viewer`, or request `tenant-b` as a `tenant-a` actor, to observe a policy denial.

## MCP endpoint

The stateless MCP endpoint is `POST /mcp`. Identity is deliberately supplied outside the model-controlled tool arguments:

- `x-user-id`
- `x-tenant-id`
- `x-role`: `viewer`, `analyst`, or `admin`

The server exposes:

- `knowledge_search`
- `customer_risk_get`

Authorization is repeated inside the tool registry at execution time. The model cannot grant itself a role or change its trusted tenant context through tool arguments.

## Evaluation and quality gate

```bash
npm run eval
npm run quality:gate
```

The versioned dataset lives in `evals/datasets/release-gate.v1.jsonl`. The runner measures:

- overall pass rate;
- tool-selection accuracy;
- safety pass rate;
- groundedness rate;
- P95 latency;
- estimated model cost.

The gate compares results against both absolute thresholds and `evals/baseline.v1.json`. Reports are written to `reports/latest.json` and `reports/latest.md`. They contain case identifiers and operational results, not raw prompts or traces.

See the tracked [sanitized example report](reports/example.md) for the GitHub-facing output.

## Traces and dashboard

Start the app and Jaeger:

```bash
docker compose up --build
```

Then send requests and open [http://localhost:16686](http://localhost:16686). Select the `agent-release-gate-platform` service.

Trace policy:

- raw prompts are replaced with a stable SHA-256 fingerprint and length;
- tokens, authorization headers, secrets, messages, input, and output fields are redacted;
- traces record tool name, caller role, outcome, and timing;
- synthetic identifiers are used throughout the repository.

See [architecture](docs/architecture.md), [quality strategy](docs/quality-strategy.md), and [threat model](docs/threat-model.md).

## Test layers

```text
tests/retriever.test.ts       retrieval relevance
tests/tool-registry.test.ts   input/output contracts, RBAC, tenant isolation
tests/agent-service.test.ts   grounding, refusal, safe tool behavior
tests/redaction.test.ts       telemetry data-leak prevention
tests/evaluation.test.ts      baseline and release-gate behavior
tests/config.test.ts          secure operational defaults
tests/mcp-protocol.test.ts    real MCP discovery, execution, and policy errors
```

## Limitations

- Retrieval is lexical and the knowledge base is deliberately small.
- Customer data is fictional and stored in memory.
- The default provider is a deterministic test double, not an LLM benchmark.
- Header identity demonstrates trusted-context separation but is not a production identity provider.
- The project does not claim that regex checks alone solve prompt injection.
- Human evaluation, model-version pinning, confidence intervals, load testing, and a true holdout set are necessary before a production release program.

## Safe portfolio use

Do not add employer code, real prompts, credentials, customer conversations, proprietary metrics, or private traces. Replace all examples with synthetic data and verify generated reports before publishing.
