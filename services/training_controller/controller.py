"""Training Controller for Predator Analytics v45.1.

This component handles ML model training jobs in Kubernetes.
"""

import logging
from typing import Any
import uuid

from fastapi import BackgroundTasks, FastAPI
from kubernetes import client, config
from services.shared.events import PredatorEvent
from services.shared.logging_config import setup_logging

setup_logging("training-controller")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator Training Controller", version="25.1")

# Initialize K8s Client
try:
    config.load_incluster_config()
except Exception:
    try:
        config.load_kube_config()
    except Exception as e:
        logger.warning("Failed to load K8s config, running in simulation mode: %s", e)

batch_api = client.BatchV1Api()


def create_training_job_spec(model_id: str, image: str, params: dict[str, Any]) -> client.V1Job:
    """Generates K8s Job specification for model training."""
    job_name = f"train-{model_id}-{uuid.uuid4().hex[:6]}"

    container = client.V1Container(
        name="trainer",
        image=image,
        env=[
            client.V1EnvVar(
                name="MLFLOW_TRACKING_URI", value="http://predator-analytics-mlflow:5000"
            ),
            client.V1EnvVar(name="MODEL_PARAMS", value=str(params)),
        ],
        resources=client.V1ResourceRequirements(
            requests={"memory": "2Gi", "cpu": "1"}, limits={"memory": "4Gi", "cpu": "2"}
        ),
    )

    template = client.V1PodTemplateSpec(
        metadata=client.V1ObjectMeta(labels={"app": "predator-trainer", "model": model_id}),
        spec=client.V1PodSpec(
            restart_policy="Never", containers=[container], priority_class_name="predator-low"
        ),
    )

    spec = client.V1JobSpec(template=template, backoff_limit=2, ttl_seconds_after_finished=3600)

    return client.V1Job(
        api_version="batch/v1",
        kind="Job",
        metadata=client.V1ObjectMeta(name=job_name, namespace="predator-analytics"),
        spec=spec,
    )


async def launch_training_job(event: PredatorEvent):
    """Event handler for 'TrainingApproved'."""
    model_id = event.context.get("model_id")
    if not model_id:
        logger.error("No model_id in training event")
        return

    logger.info(
        "Launching training for %s", model_id, extra={"correlation_id": event.correlation_id}
    )

    try:
        # In real scenario, we'd lookup image from Model Registry/Config
        # Here we use a generic trainer image
        job_spec = create_training_job_spec(
            model_id=model_id,
            image="ghcr.io/predator-analytics/ml-trainer:latest",
            params=event.context.get("params", {}),
        )

        batch_api.create_namespaced_job(namespace="predator-analytics", body=job_spec)
        logger.info("Training Job created: %s", job_spec.metadata.name)

    except Exception:
        logger.exception("Failed to create training job")


@app.post("/events/train")
async def handle_training_trigger(event_dict: dict, background_tasks: BackgroundTasks):
    """Invoked by RTB Engine upon 'APPROVE' decision."""
    event = PredatorEvent.from_dict(event_dict)
    background_tasks.add_task(launch_training_job, event)
    return {"status": "training_scheduled", "correlation_id": event.correlation_id}


@app.get("/health")
async def health():
    return {"status": "active"}
