package predator.constitution

# Axiom 5: CLI-First Sovereignty
# Blocks any mutation request that doesn't originate from a CLI-labeled agent or tool
violation[{"msg": msg}] {
  input.review.kind.kind == "Pod"
  operations := ["POST", "PUT", "PATCH", "DELETE"]
  input.review.operation == operations[_]
  not input.review.object.metadata.labels["managed-by"] == "predatorctl"
  not input.review.object.metadata.labels["agent-type"] == "azr"
  msg := "Axiom 5 Violation: Mutations must originate from predatorctl or authorized AZR agents."
}

# Axiom 6: GitOps Full Verification
# Ensures every deployment carries a git-sha annotation
violation[{"msg": msg}] {
  input.review.kind.kind == "Deployment"
  not input.review.object.metadata.annotations["predator.io/git-sha"]
  msg := "Axiom 6 Violation: Deployments must be declared in Git and carry a valid commit SHA."
}

# Integrity Check: Rejects pods if they try to bypass the Arbiter
violation[{"msg": msg}] {
  input.review.kind.kind == "Job"
  input.review.object.metadata.labels["predator-job-type"] == "etl"
  not input.review.object.metadata.annotations["predator-arbiter-approved"] == "true"
  msg := "Security Violation: ETL Jobs require formal Arbiter approval in annotations."
}
