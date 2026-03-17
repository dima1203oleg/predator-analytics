"""Тести для Code Analysis Layer."""

import pytest
from mcp.code_analysis.ast_parser import ASTParser
from mcp.code_analysis.dependency_generator import DependencyGraphGenerator
from mcp.code_analysis.metrics_collector import CodeMetricsCollector


# Sample Python code for testing
SAMPLE_CODE = """
def hello(name: str) -> str:
    '''Привіт функція.'''
    return f'Hello, {name}!'

class Calculator:
    '''Калькулятор клас.'''
    
    def add(self, a: int, b: int) -> int:
        '''Додавання двох чисел.'''
        return a + b
    
    def multiply(self, a: int, b: int) -> int:
        return a * b

async def async_process():
    '''Асинхронна обробка.'''
    pass

import os
from typing import List
"""


class TestASTParser:
    """Тести ASTParser."""

    def test_init(self):
        """Тест ініціалізації."""
        parser = ASTParser()
        assert parser.tree is None
        assert parser.source == ""

    def test_parse_string(self):
        """Тест парсингу рядка коду."""
        parser = ASTParser()
        tree = parser.parse_string(SAMPLE_CODE)
        assert tree is not None
        assert isinstance(tree, object)

    def test_get_functions(self):
        """Тест отримання функцій."""
        parser = ASTParser()
        parser.parse_string(SAMPLE_CODE)
        functions = parser.get_functions()
        
        assert len(functions) >= 2
        assert any(f["name"] == "hello" for f in functions)
        assert any(f["is_async"] for f in functions)

    def test_get_classes(self):
        """Тест отримання класів."""
        parser = ASTParser()
        parser.parse_string(SAMPLE_CODE)
        classes = parser.get_classes()
        
        assert len(classes) == 1
        assert classes[0]["name"] == "Calculator"
        assert len(classes[0]["methods"]) == 2

    def test_get_imports(self):
        """Тест отримання імпортів."""
        parser = ASTParser()
        parser.parse_string(SAMPLE_CODE)
        imports = parser.get_imports()
        
        assert len(imports) >= 2
        assert any(i["type"] == "import" for i in imports)
        assert any(i["type"] == "from" for i in imports)

    def test_get_complexity_metrics(self):
        """Тест отримання метрик складності."""
        parser = ASTParser()
        parser.parse_string(SAMPLE_CODE)
        metrics = parser.get_complexity_metrics()
        
        assert "lines_of_code" in metrics
        assert "functions" in metrics
        assert "classes" in metrics
        assert metrics["functions"] >= 2
        assert metrics["classes"] == 1

    def test_get_stats(self):
        """Тест отримання повної статистики."""
        parser = ASTParser()
        parser.parse_string(SAMPLE_CODE)
        stats = parser.get_stats()
        
        assert "functions" in stats
        assert "classes" in stats
        assert "imports" in stats
        assert "metrics" in stats


class TestDependencyGraphGenerator:
    """Тести DependencyGraphGenerator."""

    def test_init(self):
        """Тест ініціалізації."""
        gen = DependencyGraphGenerator()
        assert gen.nodes == {}
        assert gen.edges == []

    def test_add_file(self):
        """Тест додавання файлу."""
        gen = DependencyGraphGenerator()
        gen.add_file("test.py", SAMPLE_CODE)
        
        assert "test.py" in gen.nodes
        assert gen.nodes["test.py"]["type"] == "file"

    def test_get_graph(self):
        """Тест отримання графу."""
        gen = DependencyGraphGenerator()
        gen.add_file("test.py", SAMPLE_CODE)
        graph = gen.get_graph()
        
        assert "nodes" in graph
        assert "edges" in graph
        assert "graph" in graph

    def test_find_dead_code(self):
        """Тест пошуку неживого коду."""
        gen = DependencyGraphGenerator()
        gen.add_file("test.py", SAMPLE_CODE)
        dead_code = gen.find_dead_code()
        
        assert isinstance(dead_code, list)

    def test_find_entry_points(self):
        """Тест пошуку точок входу."""
        gen = DependencyGraphGenerator()
        gen.add_file("test.py", SAMPLE_CODE)
        entry_points = gen.find_entry_points()
        
        assert isinstance(entry_points, list)

    def test_find_circular_dependencies(self):
        """Тест пошуку циклічних залежностей."""
        gen = DependencyGraphGenerator()
        gen.add_file("test.py", SAMPLE_CODE)
        cycles = gen.find_circular_dependencies()
        
        assert isinstance(cycles, list)


class TestCodeMetricsCollector:
    """Тести CodeMetricsCollector."""

    def test_init(self):
        """Тест ініціалізації."""
        collector = CodeMetricsCollector()
        assert collector.metrics == {}

    def test_analyze_file(self):
        """Тест аналізу файлу."""
        collector = CodeMetricsCollector()
        metrics = collector.analyze_file("test.py", SAMPLE_CODE)
        
        assert "lines_of_code" in metrics
        assert "functions" in metrics
        assert "classes" in metrics
        assert "cyclomatic_complexity" in metrics
        assert metrics["functions"] >= 2
        assert metrics["classes"] == 1

    def test_metrics_quality(self):
        """Тест якості розраховуваних метрик."""
        collector = CodeMetricsCollector()
        metrics = collector.analyze_file("test.py", SAMPLE_CODE)
        
        assert 0 <= metrics["maintainability_index"] <= 100
        assert metrics["avg_function_length"] >= 0
        assert metrics["documented_functions"] >= 1

    def test_type_hints_detection(self):
        """Тест виявлення type hints."""
        collector = CodeMetricsCollector()
        metrics = collector.analyze_file("test.py", SAMPLE_CODE)
        
        assert metrics["has_type_hints"] is True

    def test_get_summary(self):
        """Тест отримання зведеної статистики."""
        collector = CodeMetricsCollector()
        collector.analyze_file("test.py", SAMPLE_CODE)
        summary = collector.get_summary()
        
        assert "total_files" in summary
        assert "total_functions" in summary
        assert "total_classes" in summary
        assert "avg_maintainability" in summary
        assert summary["total_files"] == 1
