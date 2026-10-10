# ADR 0001: Deterministic CI before model-backed gating

- Status: accepted
- Date: 2026-10-10

## Decision

The default CI path uses deterministic retrieval and response synthesis. Hosted model evaluation is a separate extension point.

## Rationale

PR checks must be repeatable, fast, free of API credentials, and diagnosable. Nondeterministic model output should not become a blocking gate until the dataset, judge, model version, and acceptable variance have been calibrated.

## Consequences

The repository proves the evaluation architecture and policy behavior, but it does not claim model-quality benchmark results.
