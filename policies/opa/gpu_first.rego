package predator.gpu_first

violation[{"msg": msg}] {
  input.review.kind.kind == "Pod"
  # Check if pod requests GPU
  container := input.review.object.spec.containers[_]
  gpu_request := container.resources.requests["nvidia.com/gpu"]
  to_number(gpu_request) > 0

  # Check if node selector is present
  not input.review.object.spec.nodeSelector["predator/gpu"] == "true"

  msg := sprintf("Pod %v requests GPU but is not scheduled on a GPU node (missing predator/gpu=true)", [input.review.object.metadata.name])
}

violation[{"msg": msg}] {
    # Check simple workloads on Heavy Nodes
    input.review.kind.kind == "Pod"
    not input.review.object.spec.nodeSelector["predator/gpu"] == "true"

    # Heuristic: simple jobs should stay off GPU
    # In reality we check labels like "job-type: etl-heavy"
    input.review.object.metadata.labels["predator-job-type"] == "simple-script"

    # If it ended up on GPU node somehow (e.g. no taints) - hard to check here without Node info.
    # But we can forbid requesting GPU for simple scripts.
    container := input.review.object.spec.containers[_]
    gpu_request := container.resources.requests["nvidia.com/gpu"]
    to_number(gpu_request) > 0

    msg := "Simple scripts must not request GPU resources (Law of Compute Distribution)"
}
