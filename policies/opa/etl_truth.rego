package predator.etl_truth

# 1. Block Non-Arbiter Approved Jobs
violation[{"msg": msg}] {
  input.review.kind.kind == "Job"
  input.review.object.metadata.labels["predator-job-type"] == "etl"

  # Check for annotation signature
  not input.review.object.metadata.annotations["predator-arbiter-approved"]

  msg := sprintf("ETL Job %v missing Arbiter Approval (Axiom 4 violation)", [input.review.object.metadata.name])
}

# 2. Block direct DB access pods (except specific services)
violation[{"msg": msg}] {
    input.review.kind.kind == "Pod"
    image := input.review.object.spec.containers[_].image
    contains(image, "postgres-client")

    not input.review.object.metadata.labels["predator-role"] == "admin-tool"

    msg := "Direct DB client pods are forbidden (Use predatorctl)"
}
