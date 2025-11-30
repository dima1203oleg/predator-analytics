# .github/workflows

Містить CI/CD workflows для автоматизації тестування, збірки та деплою через GitHub Actions.

## Додано

- `workflow-lint.yml` — автоматичний лінтер для файлів у `.github/workflows/` (actionlint + yamllint). Працює на push/pull_request та по розкладу (щодня).
- `nightly-rerun.yml` — щоденний scheduled workflow, який автоматично запускає ключові workflow-и (Deploy / deploy-mac / deploy-nvidia / deploy-oracle) для перевірки стабільності.
