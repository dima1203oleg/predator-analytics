"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

Валідатори інфраструктури (Рівень 1)
"""

import asyncio
import subprocess
from typing import Dict, Any
import logging

from core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)


async def validate_docker() -> ValidationResult:
    """Валідація Docker"""
    details = {}
    errors = []
    
    try:
        # Перевірка docker ps
        result = subprocess.run(
            ['docker', 'ps'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['docker_ps'] = 'OK'
            details['running_containers'] = len(result.stdout.split('\n')) - 1
        else:
            errors.append('docker ps failed')
        
        # Перевірка docker stats
        result = subprocess.run(
            ['docker', 'stats', '--no-stream'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['docker_stats'] = 'OK'
        else:
            errors.append('docker stats failed')
        
    except subprocess.TimeoutExpired:
        errors.append('Docker command timeout')
    except FileNotFoundError:
        errors.append('Docker not found')
    except Exception as e:
        errors.append(f'Docker validation error: {str(e)}')
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.INFRASTRUCTURE,
        name='Docker Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_kubernetes() -> ValidationResult:
    """Валідація Kubernetes"""
    details = {}
    errors = []
    
    try:
        # Перевірка kubectl get pods
        result = subprocess.run(
            ['kubectl', 'get', 'pods', '-A'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['kubectl_pods'] = 'OK'
            pod_lines = result.stdout.split('\n')
            details['total_pods'] = len(pod_lines) - 1
        else:
            errors.append('kubectl get pods failed')
        
        # Перевірка kubectl get nodes
        result = subprocess.run(
            ['kubectl', 'get', 'nodes'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['kubectl_nodes'] = 'OK'
        else:
            errors.append('kubectl get nodes failed')
        
    except subprocess.TimeoutExpired:
        errors.append('kubectl command timeout')
    except FileNotFoundError:
        errors.append('kubectl not found')
    except Exception as e:
        errors.append(f'Kubernetes validation error: {str(e)}')
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.INFRASTRUCTURE,
        name='Kubernetes Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_argocd() -> ValidationResult:
    """Валідація ArgoCD"""
    details = {}
    errors = []
    
    try:
        # Перевірка argocd app list
        result = subprocess.run(
            ['argocd', 'app', 'list'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['argocd_apps'] = 'OK'
        else:
            errors.append('argocd app list failed')
        
    except subprocess.TimeoutExpired:
        errors.append('argocd command timeout')
    except FileNotFoundError:
        errors.append('argocd not found')
    except Exception as e:
        errors.append(f'ArgoCD validation error: {str(e)}')
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.INFRASTRUCTURE,
        name='ArgoCD Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_helm() -> ValidationResult:
    """Валідація Helm"""
    details = {}
    errors = []
    
    try:
        # Перевірка helm list
        result = subprocess.run(
            ['helm', 'list', '-A'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['helm_releases'] = 'OK'
        else:
            errors.append('helm list failed')
        
    except subprocess.TimeoutExpired:
        errors.append('helm command timeout')
    except FileNotFoundError:
        errors.append('helm not found')
    except Exception as e:
        errors.append(f'Helm validation error: {str(e)}')
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.INFRASTRUCTURE,
        name='Helm Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )
