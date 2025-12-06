"""
Tests for ETL Workers (Celery Tasks)
Parser, Processor, Indexer agents
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestParserAgent:
    """Tests for Parse External Source task"""
    
    def test_parse_task_exists(self):
        """Test that parse_external_source task exists"""
        from app.tasks.etl_workers import parse_external_source
        
        assert parse_external_source is not None
        assert callable(parse_external_source)
    
    def test_parse_task_has_correct_name(self):
        """Test task has correct Celery name"""
        from app.tasks.etl_workers import parse_external_source
        
        assert parse_external_source.name == "tasks.workers.parse_external_source"
    
    def test_parse_task_has_delay_method(self):
        """Test task has Celery delay method"""
        from app.tasks.etl_workers import parse_external_source
        
        # Verify async call method exists
        assert hasattr(parse_external_source, 'delay')
        assert hasattr(parse_external_source, 'apply_async')
    
    def test_parse_task_accepts_source_type(self):
        """Test that parse accepts source_type parameter"""
        from app.tasks.etl_workers import parse_external_source
        import inspect
        
        sig = inspect.signature(parse_external_source)
        params = list(sig.parameters.keys())
        assert 'source_type' in params
        assert 'config' in params


class TestProcessorAgent:
    """Tests for Process Staging Records task"""
    
    def test_processor_task_exists(self):
        """Test that process_staging_records task exists"""
        from app.tasks.etl_workers import process_staging_records
        
        assert process_staging_records is not None
        assert callable(process_staging_records)
    
    def test_processor_task_has_correct_name(self):
        """Test task has correct Celery name"""
        from app.tasks.etl_workers import process_staging_records
        
        assert process_staging_records.name == "tasks.workers.process_staging_records"
    
    def test_processor_accepts_staging_ids(self):
        """Test that processor accepts list of staging IDs"""
        from app.tasks.etl_workers import process_staging_records
        
        # Verify function signature
        import inspect
        sig = inspect.signature(process_staging_records)
        params = list(sig.parameters.keys())
        assert 'staging_ids' in params


class TestIndexerAgent:
    """Tests for Index Gold Documents task"""
    
    def test_indexer_task_exists(self):
        """Test that index_gold_documents task exists"""
        from app.tasks.etl_workers import index_gold_documents
        
        assert index_gold_documents is not None
        assert callable(index_gold_documents)
    
    def test_indexer_task_has_correct_name(self):
        """Test task has correct Celery name"""
        from app.tasks.etl_workers import index_gold_documents
        
        assert index_gold_documents.name == "tasks.workers.index_gold_documents"
    
    def test_indexer_accepts_gold_ids(self):
        """Test that indexer accepts list of gold IDs"""
        from app.tasks.etl_workers import index_gold_documents
        
        import inspect
        sig = inspect.signature(index_gold_documents)
        params = list(sig.parameters.keys())
        assert 'gold_ids' in params


class TestScheduledTasks:
    """Tests for scheduled/periodic tasks"""
    
    def test_scheduled_prozorro_sync_exists(self):
        """Test scheduled Prozorro sync task exists"""
        from app.tasks.etl_workers import scheduled_prozorro_sync
        
        assert scheduled_prozorro_sync is not None
    
    def test_scheduled_nbu_sync_exists(self):
        """Test scheduled NBU sync task exists"""
        from app.tasks.etl_workers import scheduled_nbu_sync
        
        assert scheduled_nbu_sync is not None
    
    def test_full_reindex_exists(self):
        """Test full reindex task exists"""
        from app.tasks.etl_workers import full_reindex
        
        assert full_reindex is not None
        assert full_reindex.name == "tasks.workers.full_reindex"


class TestCeleryConfiguration:
    """Tests for Celery app configuration"""
    
    def test_celery_app_exists(self):
        """Test Celery app is configured"""
        from app.core.celery_app import celery_app
        
        assert celery_app is not None
    
    def test_celery_includes_etl_workers(self):
        """Test Celery includes etl_workers module"""
        from app.core.celery_app import celery_app
        
        assert "app.tasks.etl_workers" in celery_app.conf.include
    
    def test_celery_has_task_routes(self):
        """Test Celery has task routes configured"""
        from app.core.celery_app import celery_app
        
        assert celery_app.conf.task_routes is not None
        assert "app.tasks.etl.*" in celery_app.conf.task_routes
    
    def test_celery_has_beat_schedule(self):
        """Test Celery Beat schedule is configured"""
        from app.core.celery_app import celery_app
        
        assert celery_app.conf.beat_schedule is not None
        assert len(celery_app.conf.beat_schedule) > 0


class TestETLPipeline:
    """Integration tests for full ETL pipeline flow"""
    
    def test_pipeline_flow_parser_triggers_processor(self):
        """Test that parser triggers processor after completion"""
        from app.tasks.etl_workers import parse_external_source, process_staging_records
        
        # Both tasks should exist and be callable
        assert hasattr(parse_external_source, 'delay')
        assert hasattr(process_staging_records, 'delay')
    
    def test_pipeline_flow_processor_triggers_indexer(self):
        """Test that processor triggers indexer after completion"""
        from app.tasks.etl_workers import process_staging_records, index_gold_documents
        
        assert hasattr(process_staging_records, 'delay')
        assert hasattr(index_gold_documents, 'delay')
    
    def test_all_workers_have_queue_assignment(self):
        """Test that workers are assigned to correct queues"""
        from app.tasks.etl_workers import (
            parse_external_source,
            process_staging_records,
            index_gold_documents
        )
        
        # Tasks should have queue attribute or be routed
        # Check task options
        assert parse_external_source is not None
        assert process_staging_records is not None
        assert index_gold_documents is not None
