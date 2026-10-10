# Three-minute portfolio demo

1. Explain the risk: an E2E pass does not prove safe tool selection or tenant isolation.
2. Run `npm run check` and show the evaluation metrics and passing quality gate.
3. Start the app and request a grounded answer with citations.
4. Repeat the customer lookup as `viewer` to show policy denial.
5. Attempt a cross-tenant lookup and a prompt injection.
6. Open Jaeger and show that traces contain fingerprints and operational attributes, not raw prompts.
7. Finish with limitations and the next production steps: real IdP, model-backed calibration, holdout data, and load testing.
