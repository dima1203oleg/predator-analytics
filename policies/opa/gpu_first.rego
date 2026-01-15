package predator.gpu_first

# Deny any pod that requests GPU resources but hasn't selected a GPU node
violation[{"msg": msg}] {
  input.review.kind.kind == "Pod"
  container := input.review.object.spec.containers[_]

  # Check if container requests GPU
  # Adjust the key based on your specific GPU resource name (e.g., nvidia.com/gpu)
  exists(container.resources.requests["nvidia.com/gpu"])

  # Check node selector
  not has_gpu_selector(input.review.object.spec)

  msg := sprintf("Pod %v requests GPU but does not have predator/gpu='true' node selector", [input.review.object.metadata.name])
}

# Helper to check for existence
exists(val) {
  val != null
}

# Helper to check node selector
has_gpu_selector(spec) {
  spec.nodeSelector["predator/gpu"] == "true"
}
