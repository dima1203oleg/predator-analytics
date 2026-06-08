"""Оцінка якості синтетичних даних."""

from typing import Any

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
import structlog

logger = structlog.get_logger("sde.trainers.quality")

class SyntheticQualityEvaluator:
    """Клас для оцінки якості згенерованих даних порівняно з оригіналом."""

    @staticmethod
    def evaluate(real_data: pd.DataFrame, synthetic_data: pd.DataFrame) -> dict[str, Any]:
        """Комплексна оцінка якості."""
        logger.info("Початок комплексної оцінки якості синтетики")

        results = {
            "statistical_similarity": 0.0,
            "correlation_similarity": 0.0,
            "overall_score": 0.0,
            "details": {}
        }

        # Перевірка на співпадіння колонок
        common_cols = list(set(real_data.columns) & set(synthetic_data.columns))
        if not common_cols:
            logger.error("Немає спільних колонок для порівняння!")
            return results

        num_cols = real_data[common_cols].select_dtypes(include=[np.number]).columns.tolist()

        # 1. Статистична схожість (Kolmogorov-Smirnov тест для числових колонок)
        ks_scores = []
        for col in num_cols:
            real_col = real_data[col].dropna()
            synth_col = synthetic_data[col].dropna()

            if len(real_col) > 0 and len(synth_col) > 0:
                # ks_2samp повертає statistic (відстань) та p-value
                # statistic ближче до 0 означає вищу схожість
                stat, p_value = ks_2samp(real_col, synth_col)
                similarity = 1.0 - stat
                ks_scores.append(similarity)
                results["details"][f"ks_{col}"] = {"similarity": similarity, "p_value": p_value}

        if ks_scores:
            results["statistical_similarity"] = np.mean(ks_scores)

        # 2. Схожість кореляцій (для числових колонок)
        if len(num_cols) > 1:
            real_corr = real_data[num_cols].corr().fillna(0).values
            synth_corr = synthetic_data[num_cols].corr().fillna(0).values

            # MAE між кореляційними матрицями
            corr_diff = np.abs(real_corr - synth_corr)
            corr_similarity = 1.0 - (np.sum(corr_diff) / (len(num_cols) * len(num_cols)))
            results["correlation_similarity"] = max(0.0, corr_similarity)

        # Загальний скор (проста середня)
        if len(num_cols) > 0:
            if len(num_cols) > 1:
                results["overall_score"] = (results["statistical_similarity"] * 0.6 +
                                          results["correlation_similarity"] * 0.4)
            else:
                results["overall_score"] = results["statistical_similarity"]

        # Множимо на 100 для відсотків
        results["overall_score"] = round(results["overall_score"] * 100, 2)
        results["statistical_similarity"] = round(results["statistical_similarity"] * 100, 2)
        results["correlation_similarity"] = round(results["correlation_similarity"] * 100, 2)

        logger.info(f"Оцінка завершена. Загальний бал: {results['overall_score']}")
        return results
