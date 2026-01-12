"""
ML Training Saga Workflow
Implements durable execution for ML pipelines using Temporal.io
"""
from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy

# Import activity definitions (interface only inside workflow)
with workflow.unsafe.imports_passed_through():
    from services.api_gateway.app.activities.ml import (
        validate_dataset,
        train_model,
        evaluate_model,
        deploy_model,
        rollback_deployment,
        notify_user
    )

@workflow.defn
class MLTrainingWorkflow:
    @workflow.run
    async def run(self, dataset_id: str, model_config: dict) -> dict:
        workflow.logger.info(f"Starting ML Training Saga for {dataset_id}")

        # Configure retry policies
        activity_opts = workflow.ActivityOptions(
            start_to_close_timeout=timedelta(minutes=5),
            retry_policy=RetryPolicy(
                initial_interval=timedelta(seconds=1),
                maximum_interval=timedelta(seconds=60),
                maximum_attempts=3
            )
        )

        long_running_opts = workflow.ActivityOptions(
            start_to_close_timeout=timedelta(hours=1),
            heartbeat_timeout=timedelta(minutes=1)
        )

        compensation_stack = []
        result = {}

        try:
            # Step 1: Validate Dataset
            validation = await workflow.execute_activity(
                validate_dataset,
                dataset_id,
                options=activity_opts
            )
            if not validation["valid"]:
                raise ApplicationError("Invalid dataset")

            # Step 2: Train Model (Long running)
            model_artifact = await workflow.execute_activity(
                train_model,
                args=[dataset_id, model_config],
                options=long_running_opts
            )
            result["model_id"] = model_artifact["id"]

            # Step 3: Evaluate
            metrics = await workflow.execute_activity(
                evaluate_model,
                model_artifact["id"],
                options=activity_opts
            )
            result["metrics"] = metrics

            if metrics["accuracy"] < 0.7:
                raise ApplicationError(f"Model accuracy too low: {metrics['accuracy']}")

            # Step 4: Deploy
            deployment = await workflow.execute_activity(
                deploy_model,
                model_artifact["id"],
                options=activity_opts
            )
            compensation_stack.append(deployment["id"]) # Register for rollback
            result["deployment_url"] = deployment["url"]

            # Step 5: Notify
            await workflow.execute_activity(
                notify_user,
                args=[f"Model deployed: {deployment['url']}"],
                options=activity_opts
            )

            return result

        except Exception as e:
            workflow.logger.error(f"Workflow failed: {e}")

            # Execute Compensations (Rollback)
            for deployment_id in reversed(compensation_stack):
                await workflow.execute_activity(
                    rollback_deployment,
                    deployment_id,
                    options=activity_opts
                )

            await workflow.execute_activity(
                notify_user,
                args=[f"Training failed: {e}"],
                options=activity_opts
            )
            raise e
