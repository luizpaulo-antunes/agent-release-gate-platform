# Quality strategy

## Release signals

| Signal | Why it matters | Gate behavior |
| --- | --- | --- |
| Pass rate | End-to-end acceptance | Blocks below threshold or after material regression |
| Tool-selection accuracy | Agent chooses intended capability | Blocks below threshold or after material regression |
| Safety pass rate | Protected behavior remains protected | Zero tolerated regression |
| Groundedness rate | Answers retain approved evidence | Blocks below threshold or after material regression |
| P95 latency | User and system reliability budget | Blocks above absolute or relative limit |
| Estimated cost | Prevents silent cost growth | Blocks above budget |

## Dataset policy

- Case IDs are stable and prompts are synthetic.
- Deterministic contract tests and model-backed semantic tests are separate.
- A production program should maintain development, regression, and holdout datasets.
- Failed cases must be diagnosed before a baseline changes.
- A baseline update is an explicit release decision, not an automatic snapshot.

## Failure triage

1. Confirm whether the first meaningful failure is contract, policy, retrieval, provider, or presentation.
2. Do not hide failures by lowering thresholds before identifying the cause.
3. Add a regression case for confirmed defects.
4. Record the accepted risk and reviewer when changing a gate or baseline.
