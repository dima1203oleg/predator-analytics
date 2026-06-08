"""Регресійні перевірки контракту 100 аналітичних датасетів."""

from __future__ import annotations

import ast
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SERVICE_PATH = ROOT / "app/services/datasets_service.py"
API_PATH = ROOT / "app/api/v1/datasets.py"
MAIN_PATH = ROOT / "app/main.py"
DDL_PATH = ROOT / "db/postgres/init.sql"
KAGGLE_PATH = ROOT / "scripts/predator_kaggle_prod_v67.py"


def _parse(path: Path) -> ast.Module:
    return ast.parse(path.read_text(encoding="utf-8"))


def _dataset_service_methods() -> dict[str, ast.AsyncFunctionDef]:
    tree = _parse(SERVICE_PATH)
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "DatasetsService":
            return {
                item.name: item
                for item in node.body
                if isinstance(item, ast.AsyncFunctionDef) and item.name.startswith("dataset_")
            }
    raise AssertionError("Клас DatasetsService не знайдено")


def _dataset_api_methods() -> dict[str, ast.AsyncFunctionDef]:
    tree = _parse(API_PATH)
    return {
        item.name: item
        for item in tree.body
        if isinstance(item, ast.AsyncFunctionDef) and item.name.startswith("dataset_")
    }


def _dataset_api_routes() -> list[str]:
    routes: list[str] = []
    for method in _dataset_api_methods().values():
        for decorator in method.decorator_list:
            if (
                isinstance(decorator, ast.Call)
                and isinstance(decorator.func, ast.Attribute)
                and decorator.func.attr == "get"
                and decorator.args
                and isinstance(decorator.args[0], ast.Constant)
            ):
                routes.append(str(decorator.args[0].value).lstrip("/"))
    return sorted(routes, key=lambda item: int(item.split("-", 1)[0]))


def _kaggle_dataset_routes() -> list[tuple[int, str, str]]:
    tree = _parse(KAGGLE_PATH)
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "_DATASET_ROUTES":
                    return ast.literal_eval(node.value)
        if (
            isinstance(node, ast.AnnAssign)
            and isinstance(node.target, ast.Name)
            and node.target.id == "_DATASET_ROUTES"
            and node.value is not None
        ):
            return ast.literal_eval(node.value)
    raise AssertionError("_DATASET_ROUTES не знайдено у Kaggle backend")


def _postgres_tables() -> dict[str, set[str]]:
    ddl = DDL_PATH.read_text(encoding="utf-8")
    tables: dict[str, set[str]] = {}
    for match in re.finditer(
        r"CREATE TABLE IF NOT EXISTS\s+([\w.]+)\s*\((.*?)\);",
        ddl,
        flags=re.S | re.I,
    ):
        table_name = match.group(1).split(".")[-1]
        columns: set[str] = set()
        for line in match.group(2).splitlines():
            clean_line = line.strip().rstrip(",")
            if not clean_line or clean_line.startswith("--"):
                continue
            column_name = clean_line.split()[0].strip('"')
            if column_name.upper() in {"CONSTRAINT", "PRIMARY", "FOREIGN", "UNIQUE", "CHECK"}:
                continue
            columns.add(column_name)
        tables[table_name] = columns
    return tables


def _dataset_sql_blocks() -> dict[str, str]:
    source = SERVICE_PATH.read_text(encoding="utf-8")
    blocks: dict[str, str] = {}
    for name, method in _dataset_service_methods().items():
        method_source = ast.get_source_segment(source, method) or ""
        matches = re.findall(r'text\("""(.*?)"""\)', method_source, flags=re.S)
        if matches:
            blocks[name] = matches[0]
    return blocks


def test_all_dataset_endpoints_have_matching_service_methods() -> None:
    service_methods = _dataset_service_methods()
    api_methods = _dataset_api_methods()

    assert len(service_methods) == 100
    assert len(api_methods) == 100

    service_ids = sorted(int(name.split("_", 2)[1]) for name in service_methods)
    api_ids = sorted(int(name.split("_", 2)[1]) for name in api_methods)
    assert service_ids == list(range(1, 101))
    assert api_ids == list(range(1, 101))


def test_api_keyword_arguments_match_service_signatures() -> None:
    service_args = {
        name: {arg.arg for arg in method.args.args if arg.arg != "self"}
        for name, method in _dataset_service_methods().items()
    }

    for api_name, api_method in _dataset_api_methods().items():
        service_call: ast.Call | None = None
        for node in ast.walk(api_method):
            if (
                isinstance(node, ast.Call)
                and isinstance(node.func, ast.Attribute)
                and node.func.attr.startswith("dataset_")
            ):
                service_call = node
                break

        assert service_call is not None, f"{api_name}: немає виклику DatasetsService"
        service_name = service_call.func.attr
        assert service_name in service_args, f"{api_name}: метод {service_name} відсутній"

        unknown_keywords = [
            keyword.arg
            for keyword in service_call.keywords
            if keyword.arg is not None and keyword.arg not in service_args[service_name]
        ]
        assert unknown_keywords == [], f"{api_name}: зайві параметри {unknown_keywords}"


def test_dataset_sql_has_no_known_broken_schema_references() -> None:
    source = SERVICE_PATH.read_text(encoding="utf-8")
    forbidden_patterns = {
        "битий interval-bind": r"INTERVAL '\:",
        "неіснуючий companies.importer_ueid": r"\bc\.importer_ueid\b",
        "неіснуючий declarations.weight": r"\bd\.weight\b",
        "неіснуючий declarations.description": r"\bd\.description\b",
        "неіснуючий declarations.price": r"\bd\.price\b",
        "неіснуючий companies.liquidation_date": r"\bc\.liquidation_date\b",
        "неіснуючий domestic_sales_prices.sale_price_per_unit_usd": r"\bsale_price_per_unit_usd\b",
        "неіснуючий domestic_sales_prices.import_price_per_unit_usd": r"\bimport_price_per_unit_usd\b",
    }

    for label, pattern in forbidden_patterns.items():
        assert re.search(pattern, source) is None, label


def test_dataset_sql_alias_columns_exist_in_postgres_schema() -> None:
    tables = _postgres_tables()
    issues: list[str] = []

    for dataset_name, sql in _dataset_sql_blocks().items():
        aliases: dict[str, str] = {}
        for table_name, alias in re.findall(
            r"\b(?:FROM|JOIN)\s+([a-z_][\w.]*)\s+(?:AS\s+)?([a-z][\w]*)\b",
            sql,
            flags=re.I,
        ):
            clean_table_name = table_name.split(".")[-1]
            if clean_table_name in tables:
                aliases[alias] = clean_table_name

        for alias, column in re.findall(r"\b([a-z][\w]*)\.([a-z_][\w]*)\b", sql):
            table_name = aliases.get(alias)
            if table_name is not None and column not in tables[table_name]:
                issues.append(f"{dataset_name}: {alias}.{column} не існує в {table_name}")

    assert issues == []


def test_dataset_routes_are_canonical_api_v1_paths() -> None:
    api_source = API_PATH.read_text(encoding="utf-8")
    main_source = MAIN_PATH.read_text(encoding="utf-8")

    assert '"/datasets/{i}"' not in api_source
    assert '"/api/v1/datasets{path}"' in api_source
    assert "from app.api.v1.datasets import router as datasets_router" not in main_source
    assert "app.include_router(datasets_router)" not in main_source


def test_kaggle_dataset_registry_matches_canonical_routes() -> None:
    registry = _kaggle_dataset_routes()
    routes = [route for _, route, _ in registry]

    assert len(registry) == 100
    assert [dataset_id for dataset_id, _, _ in registry] == list(range(1, 101))
    assert routes == _dataset_api_routes()
    assert all(title and not title.startswith("Dataset #") for _, _, title in registry)


def test_kaggle_dataset_routes_are_not_shadowed_by_old_stubs() -> None:
    source = KAGGLE_PATH.read_text(encoding="utf-8")
    tree = _parse(KAGGLE_PATH)
    routes: list[tuple[str, int]] = []
    for node in tree.body:
        if isinstance(node, ast.AsyncFunctionDef):
            for decorator in node.decorator_list:
                if (
                    isinstance(decorator, ast.Call)
                    and isinstance(decorator.func, ast.Attribute)
                    and decorator.func.attr == "get"
                    and decorator.args
                    and isinstance(decorator.args[0], ast.Constant)
                ):
                    routes.append((str(decorator.args[0].value), node.lineno))

    dynamic_line = next(line for route, line in routes if route == "/api/v1/datasets/{dataset_key}")
    legacy_lines = [
        line
        for route, line in routes
        if route.startswith("/api/v1/datasets/")
        and route not in {"/api/v1/datasets/", "/api/v1/datasets/{dataset_key}"}
    ]

    assert '"/datasets/{i}"' not in source
    assert 'f"Dataset #{i}"' not in source
    assert dynamic_line < min(legacy_lines)


def test_postgres_dataset_schema_has_valid_timestamp_defaults() -> None:
    ddl = DDL_PATH.read_text(encoding="utf-8")

    assert "TIMESTAMPTZ NOT NULL NOW()" not in ddl
    assert "TIMESTAMPTZ NOT DEFAULT NOW()" not in ddl
