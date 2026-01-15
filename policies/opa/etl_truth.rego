package predator.etl_truth

# Deny ETL jobs without Arbiter approval annotation
violation[{"msg": msg}] {
  input.review.kind.kind == "Job"

  # Check if it is an ETL job via label
  input.review.object.metadata.labels["predator-job-type"] == "etl"

  # Check for annotation
  not input.review.object.metadata.annotations["predator-arbiter-approved"]

  msg := sprintf("ETL Job %v missing required 'predator-arbiter-approved' annotation", [input.review.object.metadata.name])
}

# Deny modifications to Ledger without proper service account
violation[{"msg": msg}] {
  input.review.kind.kind == "Pod"
  input.review.object.metadata.labels["app"] == "truth-ledger"

  # Example: Ensure only signed images are used for ledger
  image := input.review.object.spec.containers[_].image
  not startswith(image, "predator-registry.local/")

  msg := "Truth Ledger pods must use images from trusted local registry"
}
