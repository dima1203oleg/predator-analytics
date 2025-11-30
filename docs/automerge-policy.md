Purpose
-------

This document explains when automated PRs created by the autofix loop may be
automatically merged into `main` or staging branches.

Default behaviour
-----------------

- Autofix PRs created by `.github/workflows/ai-autofix-loop.yml` target
  `autofix/staging` by default to avoid direct changes to `main`.
- Auto-merge is disabled unless the repository secret `ALLOW_AUTO_MERGE` is
  explicitly set to the string `true`.

Safety rules
------------

- Any patch that attempts to delete or modify Helm `Chart.yaml` files or
  files under `environments/*/templates/` is refused by the autofix job and
  blocked by the `chart-protection` workflow.
- Critical infrastructure changes require human review and cannot be
  auto-merged. Non-critical fixes (linting, formatting, small code
  refactors) may be merged to the staging branch automatically if the
  repository secret permits it.

How to enable auto-merge to `main`
---------------------------------

1. Add a repository secret named `ALLOW_AUTO_MERGE` with value `true`.
2. Ensure autofix PRs pass CI and the `chart-protection` workflow.
3. Optionally require at least one human approval on `autofix/staging` PRs
   before promoting them to `main`.

Recommendation
--------------

Keep `ALLOW_AUTO_MERGE` unset or `false` for production repositories. Use
`autofix/staging` as the quarantine branch and promote to `main` after human
validation when in doubt.
