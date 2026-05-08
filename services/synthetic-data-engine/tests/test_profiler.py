import pytest
import pandas as pd
import numpy as np
from app.analyzer.dataset_profiler import DatasetProfiler

def test_profiler_basic():
    df = pd.DataFrame({
        'A': [1, 2, 3, 4, 5],
        'B': ['a', 'b', 'c', 'd', 'e'],
        'C': [1.1, 2.2, 3.3, 4.4, 5.5]
    })
    
    result = DatasetProfiler.profile(df)
    
    assert result['num_rows'] == 5
    assert result['num_columns'] == 3
    assert 'A' in result['numeric_cols']
    assert 'C' in result['numeric_cols']
    assert 'B' in result['categorical_cols']
    assert result['recommended_generator'] == 'GaussianCopula'

def test_profiler_with_missing():
    df = pd.DataFrame({
        'A': [1, 2, np.nan, 4, 5],
        'B': ['a', 'b', 'c', 'd', 'e'],
    })
    
    result = DatasetProfiler.profile(df)
    
    assert result['missing_stats']['A'] == 1
    assert result['recommended_generator'] == 'TVAE'
