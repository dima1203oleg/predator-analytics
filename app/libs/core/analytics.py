from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

import duckdb

if TYPE_CHECKING:
    import pandas as pd


logger = logging.getLogger("core.analytics")


class AnalyticsEngine:
    """WinSURF Analytics Core powered by DuckDB.
    Provides ultra-fast SQL analysis on local dataframes, CSVs, and Parquet files.
    """

    def __init__(self):
        self.conn = duckdb.connect(database=":memory:")

    def register_dataframe(self, name: str, df: pd.DataFrame):
        """Registers a pandas DataFrame as a SQL table."""
        self.conn.register(name, df)
        logger.info(f"Registered table '{name}' with {len(df)} rows.")

    def query(self, sql: str) -> list[dict[str, Any]]:
        """Executes a SQL query and returns list of dicts."""
        try:
            logger.debug(f"Executing SQL: {sql}")
            result = self.conn.execute(sql).fetchdf()
            return result.to_dict(orient="records")
        except Exception as e:
            logger.exception(f"SQL Error: {e}")
            raise

    def analyze_csv(self, file_path: str, sql_query: str) -> list[dict[str, Any]]:
        """Directly queries a CSV file without loading it all into RAM."""
        try:
            # DuckDB can query files directly: SELECT * FROM 'file.csv'
            query = sql_query.replace("FROM table", f"FROM '{file_path}'")
            return self.query(query)
        except Exception as e:
            logger.exception(f"CSV Analysis failed: {e}")
            raise


analytics = AnalyticsEngine()
