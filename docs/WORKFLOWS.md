# GitHub Actions Workflows Documentation

Comprehensive documentation for all CI/CD workflows in the Predator Analytics platform.

## Table of Contents

- [Core CI/CD Workflows](#core-cicd-workflows)
- [Deployment Workflows](#deployment-workflows)
- [Security & Quality Workflows](#security--quality-workflows)
- [AI-Powered Workflows](#ai-powered-workflows)
- [Maintenance Workflows](#maintenance-workflows)

---

## Core CI/CD Workflows

### `ci.yml`
**Purpose**: Main continuous integration pipeline  
**Triggers**: Push to any branch, Pull Requests  
**Actions**:
- Runs linters (Python, YAML, Shell)
- Executes unit tests
- Builds Docker images
- Runs security scans
- Validates Kubernetes manifests

**Usage**: Automatically runs on every commit

---

### `ci-cd-pipeline.yml`
**Purpose**: Full CI/CD pipeline with deployment  
**Triggers**: Push to main, tags, manual dispatch  
**Actions**:
- Build and test all services
- Push Docker images to GHCR
- Update Helm values with new image digests
- Deploy to staging (optional)
- Run E2E tests

**Environment Variables**:
- `GHCR_PAT`: GitHub Container Registry token
- `KUBECONFIG_BASE64`: Kubernetes config for deployment

---

### `test-only.yml`
**Purpose**: Run only tests without build/deploy  
**Triggers**: Manual dispatch, Pull Requests (when labeled)  
**Actions**:
- Run unit tests
- Run integration tests
- Generate coverage reports

---

## Deployment Workflows

### `deploy.yml`
**Purpose**: Generic deployment workflow  
**Triggers**: Manual dispatch, workflow call  
**Parameters**:
- `environment`: Target environment (dev/staging/prod)
- `version`: Version tag to deploy

**Actions**:
- Validates deployment prerequisites
- Deploys to specified environment
- Runs smoke tests
- Sends notifications

---

### `deploy-mac.yml`
**Purpose**: Deploy to Mac development environment  
**Triggers**: Push to main, manual dispatch  
**Actions**:
- Deploy to local Mac environment
- Use docker-compose for services
- Run local validation tests

**Requirements**:
- Self-hosted runner on Mac
- Docker Desktop installed

---

### `deploy-nvidia-self-hosted.yml`
**Purpose**: Deploy to NVIDIA GPU server  
**Triggers**: Manual dispatch, successful CI on main  
**Actions**:
- Deploy to NVIDIA server with GPU support
- Update ML workloads
- Restart GPU-dependent services

**Requirements**:
- Self-hosted runner with NVIDIA GPU
- CUDA toolkit installed

---

### `deploy-oracle.yml`
**Purpose**: Deploy to Oracle Cloud ARM instance  
**Triggers**: Manual dispatch, tagged releases  
**Actions**:
- Deploy to Oracle ARM instance
- Optimize for ARM architecture
- Run performance validation

---

### `deploy-argocd.yml`
**Purpose**: Deploy via ArgoCD GitOps  
**Triggers**: Helm chart changes, manual dispatch  
**Actions**:
- Update ArgoCD applications
- Sync with Git repository
- Monitor deployment status
- Automatic rollback on failure

**Environment Variables**:
- `ARGOCD_SERVER`: ArgoCD server URL
- `ARGOCD_AUTH_TOKEN`: Authentication token

---

### `build-nvidia.yml`
**Purpose**: Build images optimized for NVIDIA GPUs  
**Triggers**: Push to main, tags  
**Actions**:
- Build CUDA-enabled images
- Tag with GPU architecture
- Push to registry
- Update NVIDIA environment values

---

## Security & Quality Workflows

### `secrets-checker.yml`
**Purpose**: Scan for exposed secrets  
**Triggers**: Push, Pull Request, scheduled daily  
**Actions**:
- Run TruffleHog secret scanner
- Run detect-secrets
- Block commits with secrets
- Send alerts for violations

**Configuration**: `.secrets.baseline`

---

### `chart-protection.yml`
**Purpose**: Protect critical Helm charts  
**Triggers**: Pull Request to charts/  
**Actions**:
- Validate Helm chart syntax
- Check for breaking changes
- Require manual approval for critical charts
- Run security policies

---

### `check-actionlint.yml`
**Purpose**: Validate GitHub Actions workflow files  
**Triggers**: Changes to .github/workflows/  
**Actions**:
- Run actionlint on all workflows
- Check for syntax errors
- Validate action versions

---

### `workflow-lint.yml`
**Purpose**: Lint workflow YAML files  
**Triggers**: Push to workflows directory  
**Actions**:
- Run yamllint
- Check formatting
- Validate structure

---

## AI-Powered Workflows

### `ai-autofix-loop.yml`
**Purpose**: Automatically fix issues using AI  
**Triggers**: Issue creation, CI failure  
**Actions**:
- Analyze error messages
- Generate fix using AI
- Create PR with fix
- Request review

**Requirements**:
- OpenAI API key or similar
- GitHub token with PR permissions

---

### `autofix-end-to-end-test.yml`
**Purpose**: Test the autofix workflow end-to-end  
**Triggers**: Manual dispatch, scheduled weekly  
**Actions**:
- Create test issue
- Verify autofix triggers
- Validate PR creation
- Clean up test artifacts

---

### `autofix-loop-test.yml`
**Purpose**: Unit test for autofix logic  
**Triggers**: Changes to autofix code  
**Actions**:
- Run autofix unit tests
- Validate error parsing
- Test fix generation

---

### `ci-ai-feedback.yml`
**Purpose**: Get AI feedback on code changes  
**Triggers**: Pull Request  
**Actions**:
- Analyze code changes
- Provide improvement suggestions
- Check for best practices
- Comment on PR

---

### `ci-ai-request-runner.yml`
**Purpose**: Process AI assistance requests  
**Triggers**: Issue with ai-assist label  
**Actions**:
- Parse request from issue
- Execute AI task
- Post results as comment
- Update issue status

---

### `multi-agent-debate.yml`
**Purpose**: Run multi-agent debate for complex decisions  
**Triggers**: Manual dispatch with decision topic  
**Actions**:
- Initialize multiple AI agents
- Run debate rounds
- Synthesize consensus
- Generate decision report

---

### `push-to-ai-studio.yml`
**Purpose**: Sync code to AI training studio  
**Triggers**: Tagged releases  
**Actions**:
- Package code for training
- Upload to AI studio
- Trigger fine-tuning job
- Monitor training progress

---

## Maintenance Workflows

### `nightly-rerun.yml`
**Purpose**: Nightly regression testing  
**Triggers**: Scheduled (daily at 2 AM UTC)  
**Actions**:
- Re-run all deploy workflows
- Check system stability
- Validate all environments
- Generate stability report

---

### `monitor-nvidia-host.yml`
**Purpose**: Monitor NVIDIA server health  
**Triggers**: Scheduled (every 15 minutes)  
**Actions**:
- Check GPU utilization
- Monitor temperature
- Check disk space
- Alert on thresholds

---

### `generate-argocd-tokens.yml`
**Purpose**: Rotate ArgoCD authentication tokens  
**Triggers**: Scheduled (monthly), manual dispatch  
**Actions**:
- Generate new ArgoCD tokens
- Update GitHub secrets
- Revoke old tokens
- Test new credentials

---

### `rollback.yml`
**Purpose**: Rollback to previous version  
**Triggers**: Manual dispatch, deployment failure  
**Parameters**:
- `environment`: Environment to rollback
- `version`: Target version (optional, defaults to previous)

**Actions**:
- Identify previous stable version
- Deploy previous version
- Validate rollback success
- Send notifications

---

### `auto-approve-prs.yml`
**Purpose**: Auto-approve dependabot/bot PRs  
**Triggers**: Pull Request from bots  
**Actions**:
- Verify PR author is trusted bot
- Check automated tests pass
- Auto-approve if criteria met
- Enable auto-merge

**Safety**: Only for minor dependency updates

---

### `auto-close-issues.yml`
**Purpose**: Auto-close stale issues  
**Triggers**: Scheduled (daily)  
**Actions**:
- Find issues inactive > 30 days
- Add stale label
- Close if no response after 7 days
- Exclude labeled issues

---

### `ci-create-pr-automerge.yml`
**Purpose**: Create PRs with auto-merge enabled  
**Triggers**: Workflow call from other workflows  
**Actions**:
- Create PR from changes
- Enable auto-merge
- Request reviews
- Monitor merge status

---

## Best Practices

### Environment-Specific Workflows
- Always use environment-specific secrets
- Validate environment before deploy
- Use separate workflows for dev/staging/prod

### Security
- Never commit secrets to workflows
- Use GitHub Secrets or Vault
- Rotate credentials regularly
- Scan for exposed secrets

### Testing
- Run tests before deploy
- Use separate test workflow for PR validation
- Maintain E2E test suite
- Monitor test flakiness

### Monitoring
- Set up notifications for failures
- Monitor workflow execution time
- Track success rates
- Alert on anomalies

### Documentation
- Keep this file updated
- Document new workflows
- Include trigger conditions
- Specify required secrets

---

## Troubleshooting

### Common Issues

**Issue**: Workflow not triggering  
**Solution**: Check trigger conditions, verify branch names, ensure workflow file is valid YAML

**Issue**: Secrets not accessible  
**Solution**: Verify secrets are set in repository/org settings, check secret names match workflow

**Issue**: Deployment fails  
**Solution**: Check deployment logs, verify kubeconfig, ensure cluster is accessible

**Issue**: Tests timeout  
**Solution**: Increase timeout in workflow, optimize test suite, check resource limits

---

## Contributing

When adding new workflows:
1. Follow naming convention: `{category}-{purpose}.yml`
2. Add comprehensive documentation to this file
3. Include all required secrets in documentation
4. Add example usage
5. Test thoroughly before merging

---

**Last Updated**: 2026-01-31  
**Maintainer**: DevOps Team
