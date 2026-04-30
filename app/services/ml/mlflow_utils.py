import logging

logger = logging.getLogger(__name__)

class ExperimentTracker:
    """Wrapper for MLflow to safely track experiments.
    Falls back to local logging if MLflow is not installed or configured.
    """

    def __init__(self, experiment_name="predator_analytics"):
        self.experiment_name = experiment_name
        self.mlflow_available = False
        self.active_run = None

        try:
            import mlflow
            self.mlflow = mlflow
            self.mlflow_available = True
            self.mlflow.set_experiment(experiment_name)
            logger.info(f"MLflow tracker initialized for experiment: {experiment_name}")
        except ImportError:
            logger.warning("MLflow not found. Using local logging for experiment tracking.")
        except Exception as e:
            logger.error(f"Failed to initialize MLflow: {e}")

    def start_run(self, run_name=None):
        """Start a new tracking run."""
        if self.mlflow_available:
            self.active_run = self.mlflow.start_run(run_name=run_name)
            return self.active_run
        else:
            logger.info(f"Starting local run: {run_name or 'unnamed'}")
            return None

    def log_param(self, key, value):
        """Log a parameter."""
        if self.mlflow_available:
            self.mlflow.log_param(key, value)
        else:
            logger.debug(f"[EXP] PARAM: {key} = {value}")

    def log_metric(self, key, value, step=None):
        """Log a metric."""
        if self.mlflow_available:
            self.mlflow.log_metric(key, value, step=step)
        else:
            logger.debug(f"[EXP] METRIC: {key} = {value} (step: {step})")

    def end_run(self):
        """End the current run."""
        if self.mlflow_available:
            self.mlflow.end_run()
            self.active_run = None
        else:
            logger.info("Ending local run.")

# Singleton instance
tracker = ExperimentTracker()
