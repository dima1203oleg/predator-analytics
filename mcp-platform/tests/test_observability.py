"""Тести для Observability Layer (Metrics та Logging)."""

import pytest
from mcp.observability.metrics_collector import (
    MetricsCollector,
    Logger,
    Metric,
    MetricType,
)


class TestMetricsCollector:
    """Тести MetricsCollector."""

    @pytest.fixture
    def metrics_collector(self):
        """Фікстура MetricsCollector."""
        return MetricsCollector()

    def test_init(self, metrics_collector):
        """Тест ініціалізації."""
        assert len(metrics_collector.metrics) == 0
        assert len(metrics_collector.history) == 0

    def test_counter(self, metrics_collector):
        """Тест лічильника."""
        metrics_collector.counter("requests_total", 1.0)
        metrics_collector.counter("requests_total", 2.0)
        
        metric = metrics_collector.get_metric("requests_total")
        
        assert metric.value == 3.0
        assert metric.type == MetricType.COUNTER

    def test_counter_with_labels(self, metrics_collector):
        """Тест лічильника з мітками."""
        labels = {"method": "GET", "status": "200"}
        metrics_collector.counter("http_requests", 1.0, labels)
        metrics_collector.counter("http_requests", 1.0, labels)
        
        metric = metrics_collector.get_metric("http_requests", labels)
        
        assert metric.value == 2.0

    def test_gauge(self, metrics_collector):
        """Тест gauge метрики."""
        metrics_collector.gauge("memory_usage", 512.5)
        
        metric = metrics_collector.get_metric("memory_usage")
        
        assert metric.value == 512.5
        assert metric.type == MetricType.GAUGE

    def test_gauge_overwrite(self, metrics_collector):
        """Тест переписування gauge метрики."""
        metrics_collector.gauge("cpu_usage", 50.0)
        metrics_collector.gauge("cpu_usage", 75.0)
        
        metric = metrics_collector.get_metric("cpu_usage")
        
        assert metric.value == 75.0

    def test_histogram(self, metrics_collector):
        """Тест гістограми."""
        metrics_collector.histogram("request_duration", 100.0)
        metrics_collector.histogram("request_duration", 150.0)
        metrics_collector.histogram("request_duration", 200.0)
        
        metric = metrics_collector.get_metric("request_duration")
        
        assert metric.value["count"] == 3
        assert metric.value["sum"] == 450.0

    def test_get_all_metrics(self, metrics_collector):
        """Тест отримання всіх метрик."""
        metrics_collector.counter("counter1", 1.0)
        metrics_collector.gauge("gauge1", 100.0)
        metrics_collector.histogram("histogram1", 50.0)
        
        all_metrics = metrics_collector.get_all_metrics()
        
        assert len(all_metrics) == 3

    def test_export_prometheus(self, metrics_collector):
        """Тест експорту Prometheus."""
        metrics_collector.counter("requests_total", 100.0)
        metrics_collector.gauge("memory_usage", 512.0)
        
        prometheus_output = metrics_collector.export_prometheus()
        
        assert "requests_total_total 100.0" in prometheus_output
        assert "memory_usage 512.0" in prometheus_output

    def test_reset(self, metrics_collector):
        """Тест скидання метрик."""
        metrics_collector.counter("test_counter", 1.0)
        assert len(metrics_collector.metrics) == 1
        
        metrics_collector.reset()
        
        assert len(metrics_collector.metrics) == 0


class TestLogger:
    """Тести Logger."""

    @pytest.fixture
    def logger(self):
        """Фікстура Logger."""
        return Logger("test_logger")

    def test_init(self, logger):
        """Тест ініціалізації."""
        assert logger.name == "test_logger"
        assert len(logger.logs) == 0

    def test_info_logging(self, logger):
        """Тест інформаційного логування."""
        logger.info("Test info message")
        
        assert len(logger.logs) == 1
        assert logger.logs[0]["level"] == "INFO"
        assert logger.logs[0]["message"] == "Test info message"

    def test_warning_logging(self, logger):
        """Тест логування попередження."""
        logger.warning("Test warning message")
        
        assert len(logger.logs) == 1
        assert logger.logs[0]["level"] == "WARNING"

    def test_error_logging(self, logger):
        """Тест логування помилки."""
        logger.error("Test error message")
        
        assert len(logger.logs) == 1
        assert logger.logs[0]["level"] == "ERROR"

    def test_critical_logging(self, logger):
        """Тест логування критичної помилки."""
        logger.critical("Test critical message")
        
        assert len(logger.logs) == 1
        assert logger.logs[0]["level"] == "CRITICAL"

    def test_logging_with_metadata(self, logger):
        """Тест логування з метаданими."""
        metadata = {"user_id": 123, "action": "login"}
        logger.info("User logged in", metadata)
        
        assert len(logger.logs) == 1
        assert logger.logs[0]["metadata"] == metadata

    def test_multiple_logs(self, logger):
        """Тест кількох логів."""
        logger.info("Message 1")
        logger.warning("Message 2")
        logger.error("Message 3")
        
        assert len(logger.logs) == 3

    def test_get_logs_by_level(self, logger):
        """Тест отримання логів за рівнем."""
        logger.info("Info message")
        logger.warning("Warning message")
        logger.error("Error message")
        
        error_logs = logger.get_logs("ERROR")
        
        assert len(error_logs) == 1
        assert error_logs[0]["message"] == "Error message"

    def test_get_all_logs(self, logger):
        """Тест отримання всіх логів."""
        logger.info("Info message")
        logger.warning("Warning message")
        
        all_logs = logger.get_logs()
        
        assert len(all_logs) == 2

    def test_clear_logs(self, logger):
        """Тест очищення логів."""
        logger.info("Test message")
        assert len(logger.logs) == 1
        
        logger.clear()
        
        assert len(logger.logs) == 0

    def test_timestamp_in_logs(self, logger):
        """Тест наявності timestamp у логах."""
        logger.info("Test message")
        
        assert "timestamp" in logger.logs[0]
        assert logger.logs[0]["timestamp"] is not None
