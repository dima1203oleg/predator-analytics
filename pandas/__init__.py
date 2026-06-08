# Minimal stub for pandas used in ingestion_service.
import typing as _t


class _SimpleDataFrame:
    def __init__(self, records: list[dict]):
        self._records = records
        self.columns = list(records[0].keys()) if records else []

    def where(self, *args, **kwargs):
        return self

    def to_dict(self, orient="records"):
        return self._records

    @property
    def dtypes(self):
        class _Dtypes:
            def __getitem__(self, col):
                # Simplified: treat all as object
                return "object"
        return _Dtypes()

def read_excel(io_bytes, **kwargs):
    import csv
    text = io_bytes.read().decode("utf-8", errors="ignore")
    reader = csv.DictReader(text.splitlines())
    return _SimpleDataFrame([dict(row) for row in reader])

def read_csv(io_bytes, **kwargs):
    import csv
    text = io_bytes.read().decode("utf-8", errors="ignore")
    reader = csv.DictReader(text.splitlines())
    return _SimpleDataFrame([dict(row) for row in reader])

class _api:
    class types:
        @staticmethod
        def is_datetime64_any_dtype(dtype):
            return False
api = _api()

DataFrame = _SimpleDataFrame

__all__ = ["DataFrame", "api", "read_csv", "read_excel"]
