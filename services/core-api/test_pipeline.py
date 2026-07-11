from app.routers.deepseek_tuning import full_tuning_pipeline
import logging

logging.basicConfig(level=logging.INFO)
print("Starting pipeline test...")
full_tuning_pipeline()
print("Pipeline finished.")
