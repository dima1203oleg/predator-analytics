from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.services.infrastructure.k8s import K8sProvisioner, get_k8s_provisioner

router = APIRouter(prefix="/infra/k8s", tags=["Infrastructure & Cluster"])

@router.get("/status")
async def get_cluster_status(
    provisioner: K8sProvisioner = Depends(get_k8s_provisioner)
) -> Dict[str, Any]:
    """
    Returns the status of K8s cluster components.
    """
    return provisioner.check_status()

@router.post("/provision/{component}")
async def provision_cluster_component(
    component: str,
    provisioner: K8sProvisioner = Depends(get_k8s_provisioner)
) -> Dict[str, Any]:
    """
    Provisions or updates a K8s component.
    """
    return provisioner.provision_component(component)
