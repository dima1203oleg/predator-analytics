from functools import lru_cache
from .provisioner import K8sProvisioner

@lru_cache()
def get_k8s_provisioner() -> K8sProvisioner:
    return K8sProvisioner()

__all__ = ["K8sProvisioner", "get_k8s_provisioner"]
