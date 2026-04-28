/**
 * PREDATOR OpenSearch Real Queries - реальні Запити до OpenSearch
 *
 * Готові запити для кожної персони:
 * - TITAN: бізнес-аналітика, конкуренти,ринкові тренди
 * - INQUISITOR: аномалії,ризики, підозрілі патерни
 * - SOVEREIGN: макро-тренди, системний аналіз
 *
 * © 2026 PREDATOR Analytics
 */
import { OPENSEARCH_URL, OPENSEARCH_API_URL } from './api/config';

// OpenSearch Query Templates
export interface OpenSearchQuery {
  id: string;
  name: string;
  description: string;
  persona: 'TITAN' | 'INQUISITOR' | 'SOVEREIGN' | 'ALL';
  category: string;
  query: object;
  visualization: 'bar' | 'line' | 'pie' | 'treemap' | 'heatmap' | 'table' | 'metric';
}

// Base URL for OpenSearch
export const OPENSEARCH_BASE_URL = OPENSEARCH_URL;
// OPENSEARCH_API_URL вже імпортовано

// ============================================
// TITAN QUERIES - Business Intelligence
// ============================================
export const TITAN_QUERIES: OpenSearchQuery[] = [
  {
    id: 'titan-top-importers',
    name: 'Топ Імпортерів за Обсягом',
    description: 'рейтинг компаній за сумарним обсягом імпорту',
    persona: 'TITAN',
    category: 'Конкуренти',
    query: {
      size: 0,
      aggs: {
        top_importers: {
          terms: {
            field: 'importer_name.keyword',
            size: 20,
            order: { total_value: 'desc' }
          },
          aggs: {
            total_value: { sum: { field: 'declared_value' } },
            total_weight: { sum: { field: 'weight_kg' } },
            declaration_count: { value_count: { field: 'declaration_id' } }
          }
        }
      }
    },
    visualization: 'bar'
  },
  {
    id: 'titan-price-trends',
    name: 'Динаміка Цін по Категоріях',
    description: 'Зміна середньої ціни за кг по HS кодах за останні 30 днів',
    persona: 'TITAN',
    category: 'Ціни',
    query: {
      size: 0,
      query: {
        range: { declaration_date: { gte: 'now-30d/d', lte: 'now/d' } }
      },
      aggs: {
        by_date: {
          date_histogram: {
            field: 'declaration_date',
            calendar_interval: 'day'
          },
          aggs: {
            by_hs_code: {
              terms: { field: 'hs_code_4.keyword', size: 5 },
              aggs: {
                avg_price_per_kg: {
                  bucket_script: {
                    buckets_path: { value: 'total_value', weight: 'total_weight' },
                    script: 'params.value / params.weight'
                  }
                },
                total_value: { sum: { field: 'declared_value' } },
                total_weight: { sum: { field: 'weight_kg' } }
              }
            }
          }
        }
      }
    },
    visualization: 'line'
  },
  {
    id: 'titan-supplier-countries',
    name: 'Країни Походження',
    description: 'розподіл імпорту за країнами походження',
    persona: 'TITAN',
    category: 'Географія',
    query: {
      size: 0,
      aggs: {
        by_country: {
          terms: { field: 'origin_country.keyword', size: 15 },
          aggs: {
            total_value: { sum: { field: 'declared_value' } },
            unique_suppliers: { cardinality: { field: 'supplier_name.keyword' } }
          }
        }
      }
    },
    visualization: 'pie'
  },
  {
    id: 'titan-market-share',
    name: 'Частка  инку Конкурентів',
    description: 'розподіл ринку між основними гравцями',
    persona: 'TITAN',
    category: 'Конкуренти',
    query: {
      size: 0,
      query: {
        range: { declaration_date: { gte: 'now-90d/d' } }
      },
      aggs: {
        market_share: {
          terms: { field: 'importer_name.keyword', size: 10 },
          aggs: {
            total_value: { sum: { field: 'declared_value' } },
            market_percentage: {
              bucket_script: {
                buckets_path: { '_value': 'total_value' },
                script: 'params._value'
              }
            }
          }
        },
        total_market: { sum: { field: 'declared_value' } }
      }
    },
    visualization: 'treemap'
  },
  {
    id: 'titan-new-suppliers',
    name: 'Нові Постачальники',
    description: 'Постачальники, що з\'явились за останні 30 днів',
    persona: 'TITAN',
    category: 'Можливості',
    query: {
      size: 100,
      query: {
        bool: {
          must: [
            { range: { declaration_date: { gte: 'now-30d/d' } } }
          ],
          must_not: [
            { range: { first_seen_date: { lt: 'now-30d/d' } } }
          ]
        }
      },
      aggs: {
        new_suppliers: {
          terms: { field: 'supplier_name.keyword', size: 20 },
          aggs: {
            country: { terms: { field: 'origin_country.keyword', size: 1 } },
            avg_price: { avg: { field: 'price_per_unit' } },
            product_types: { terms: { field: 'hs_code_4.keyword', size: 5 } }
          }
        }
      }
    },
    visualization: 'table'
  }
];

// ============================================
// INQUISITOR QUERIES - Compliance & Risk
// ============================================
export const INQUISITOR_QUERIES: OpenSearchQuery[] = [
  {
    id: 'inq-price-anomalies',
    name: 'Цінові Аномалії',
    description: 'Декларації з ціною значно нижче ринкової',
    persona: 'INQUISITOR',
    category: 'Аномалії',
    query: {
      size: 0,
      query: {
        bool: {
          must: [
            { range: { declaration_date: { gte: 'now-30d/d' } } },
            {
              script: {
                script: {
                  source: "doc['declared_value'].value / doc['weight_kg'].value < doc['market_price_per_kg'].value * 0.5",
                  lang: 'painless'
                }
              }
            }
          ]
        }
      },
      aggs: {
        by_hs_code: {
          terms: { field: 'hs_code_4.keyword', size: 20 },
          aggs: {
            avg_deviation: {
              avg: {
                script: {
                  source: "(doc['market_price_per_kg'].value - (doc['declared_value'].value / doc['weight_kg'].value)) / doc['market_price_per_kg'].value * 100"
                }
              }
            },
            total_undervaluation: { sum: { field: 'potential_loss' } },
            companies_involved: { cardinality: { field: 'importer_name.keyword' } }
          }
        }
      }
    },
    visualization: 'heatmap'
  },
  {
    id: 'inq-risk-scoring',
    name: 'Скорингризику Компаній',
    description: 'рейтинг компаній заризиком порушень',
    persona: 'INQUISITOR',
    category: ' изики',
    query: {
      size: 0,
      aggs: {
        by_company: {
          terms: { field: 'importer_name.keyword', size: 50 },
          aggs: {
            risk_factors: {
              filters: {
                filters: {
                  low_prices: { range: { price_deviation_pct: { lte: -30 } } },
                  round_values: { term: { is_round_value: true } },
                  new_company: { range: { company_age_days: { lte: 180 } } },
                  high_volume_spike: { range: { volume_change_pct: { gte: 200 } } }
                }
              }
            },
            total_value: { sum: { field: 'declared_value' } },
            declaration_count: { value_count: { field: 'declaration_id' } }
          }
        }
      }
    },
    visualization: 'table'
  },
  {
    id: 'inq-related-entities',
    name: 'Мережа Пов\'язаних Осіб',
    description: 'Компанії з спільними бенефіціарами/адресами',
    persona: 'INQUISITOR',
    category: 'Схеми',
    query: {
      size: 0,
      aggs: {
        by_address: {
          terms: { field: 'registration_address.keyword', size: 20 },
          aggs: {
            companies: {
              terms: { field: 'importer_name.keyword', size: 10 }
            },
            total_value: { sum: { field: 'declared_value' } }
          }
        },
        by_beneficiary: {
          terms: { field: 'beneficiary_name.keyword', size: 20 },
          aggs: {
            companies: {
              terms: { field: 'importer_name.keyword', size: 10 }
            }
          }
        }
      }
    },
    visualization: 'table'
  },
  {
    id: 'inq-evasion-patterns',
    name: 'Патерни Ухилення',
    description: 'Типові схеми заниження митної вартості',
    persona: 'INQUISITOR',
    category: 'Схеми',
    query: {
      size: 0,
      aggs: {
        patterns: {
          filters: {
            filters: {
              split_shipments: {
                bool: {
                  must: [
                    { range: { shipment_count_same_day: { gte: 3 } } },
                    { range: { single_shipment_value: { lte: 1000 } } }
                  ]
                }
              },
              misclassification: {
                range: { hs_code_risk_score: { gte: 80 } }
              },
              undervaluation: {
                range: { price_deviation_pct: { lte: -50 } }
              },
              transit_abuse: {
                bool: {
                  must: [
                    { term: { customs_procedure: 'transit' } },
                    { range: { transit_duration_days: { gte: 30 } } }
                  ]
                }
              }
            }
          },
          aggs: {
            total_value: { sum: { field: 'declared_value' } }
          }
        }
      }
    },
    visualization: 'bar'
  },
  {
    id: 'inq-suspicious-declarations',
    name: 'Підозрілі Декларації',
    description: 'Декларації з високимризик-скором',
    persona: 'INQUISITOR',
    category: 'Аномалії',
    query: {
      size: 100,
      query: {
        range: { risk_score: { gte: 75 } }
      },
      sort: [{ risk_score: 'desc' }, { declared_value: 'desc' }],
      _source: ['declaration_id', 'importer_name', 'hs_code', 'declared_value', 'risk_score', 'risk_factors', 'declaration_date']
    },
    visualization: 'table'
  }
];

// ============================================
// SOVEREIGN QUERIES - Strategic Analytics
// ============================================
export const SOVEREIGN_QUERIES: OpenSearchQuery[] = [
  {
    id: 'sov-trade-balance',
    name: 'Торговий Баланс',
    description: 'Динаміка імпорту/експорту за секторами',
    persona: 'SOVEREIGN',
    category: 'Макро',
    query: {
      size: 0,
      query: {
        range: { declaration_date: { gte: 'now-365d/d' } }
      },
      aggs: {
        by_month: {
          date_histogram: {
            field: 'declaration_date',
            calendar_interval: 'month'
          },
          aggs: {
            by_sector: {
              terms: { field: 'industry_sector.keyword', size: 10 },
              aggs: {
                import_value: {
                  filter: { term: { flow_type: 'import' } },
                  aggs: { value: { sum: { field: 'declared_value' } } }
                },
                export_value: {
                  filter: { term: { flow_type: 'export' } },
                  aggs: { value: { sum: { field: 'declared_value' } } }
                }
              }
            }
          }
        }
      }
    },
    visualization: 'line'
  },
  {
    id: 'sov-supply-chain-risk',
    name: ' изики Ланцюга Поставок',
    description: 'Концентрація залежності від постачальників',
    persona: 'SOVEREIGN',
    category: ' изики',
    query: {
      size: 0,
      aggs: {
        by_product: {
          terms: { field: 'product_category.keyword', size: 20 },
          aggs: {
            supplier_concentration: {
              terms: { field: 'supplier_name.keyword', size: 3 },
              aggs: {
                value: { sum: { field: 'declared_value' } }
              }
            },
            total_suppliers: { cardinality: { field: 'supplier_name.keyword' } },
            total_value: { sum: { field: 'declared_value' } },
            concentration_ratio: {
              bucket_script: {
                buckets_path: { top3: 'supplier_concentration._count', total: 'total_suppliers' },
                script: 'params.top3 / params.total * 100'
              }
            }
          }
        }
      }
    },
    visualization: 'heatmap'
  },
  {
    id: 'sov-sector-correlations',
    name: 'Міжгалузеві Кореляції',
    description: 'Зв\'язки між секторами економіки',
    persona: 'SOVEREIGN',
    category: 'Аналітика',
    query: {
      size: 0,
      query: {
        range: { declaration_date: { gte: 'now-180d/d' } }
      },
      aggs: {
        by_week: {
          date_histogram: {
            field: 'declaration_date',
            calendar_interval: 'week'
          },
          aggs: {
            sectors: {
              terms: { field: 'industry_sector.keyword', size: 10 },
              aggs: {
                value: { sum: { field: 'declared_value' } }
              }
            }
          }
        }
      }
    },
    visualization: 'heatmap'
  },
  {
    id: 'sov-geopolitical-impact',
    name: 'Геополітичний Вплив',
    description: 'Зміни торгівлі з регіонами',
    persona: 'SOVEREIGN',
    category: 'Геополітика',
    query: {
      size: 0,
      aggs: {
        by_region: {
          terms: { field: 'trade_region.keyword', size: 10 },
          aggs: {
            by_quarter: {
              date_histogram: {
                field: 'declaration_date',
                calendar_interval: 'quarter'
              },
              aggs: {
                total_value: { sum: { field: 'declared_value' } },
                yoy_change: {
                  serial_diff: {
                    buckets_path: 'total_value',
                    lag: 4
                  }
                }
              }
            }
          }
        }
      }
    },
    visualization: 'line'
  },
  {
    id: 'sov-forecast-model',
    name: 'Прогнозна Модель',
    description: 'Прогноз обсягів торгівлі на 90 днів',
    persona: 'SOVEREIGN',
    category: 'Прогнози',
    query: {
      size: 0,
      query: {
        range: { declaration_date: { gte: 'now-365d/d' } }
      },
      aggs: {
        historical: {
          date_histogram: {
            field: 'declaration_date',
            calendar_interval: 'day'
          },
          aggs: {
            value: { sum: { field: 'declared_value' } },
            moving_avg: {
              moving_fn: {
                buckets_path: 'value',
                window: 7,
                script: 'MovingFunctions.unweightedAvg(values)'
              }
            }
          }
        }
      }
    },
    visualization: 'line'
  }
];

// ============================================
// Query Execution Helpers
// ============================================
export async function executeOpenSearchQuery(query: OpenSearchQuery): Promise<any> {
  try {
    const response = await fetch(`${OPENSEARCH_API_URL}/customs-declarations/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query.query)
    });

    if (!response.ok) {
      throw new Error(`OpenSearch query failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OpenSearch query error:', error);
    return null;
  }
}

export function getQueriesForPersona(persona: string): OpenSearchQuery[] {
  switch (persona) {
    case 'TITAN':
      return TITAN_QUERIES;
    case 'INQUISITOR':
      return INQUISITOR_QUERIES;
    case 'SOVEREIGN':
      return SOVEREIGN_QUERIES;
    default:
      return [...TITAN_QUERIES, ...INQUISITOR_QUERIES, ...SOVEREIGN_QUERIES];
  }
}

export function getQueryById(queryId: string): OpenSearchQuery | undefined {
  const allQueries = [...TITAN_QUERIES, ...INQUISITOR_QUERIES, ...SOVEREIGN_QUERIES];
  return allQueries.find(q => q.id === queryId);
}

// ============================================
// Dashboard URL Generators
// ============================================
export function generateDashboardUrl(persona: string): string {
  const baseUrl = `${OPENSEARCH_BASE_URL}/app/dashboards`;

  // This would link to pre-configured dashboards
  const dashboardIds: Record<string, string> = {
    TITAN: 'predator-titan-business-intel',
    INQUISITOR: 'predator-inquisitor-compliance',
    SOVEREIGN: 'predator-sovereign-strategic'
  };

  const dashboardId = dashboardIds[persona] || 'predator-overview';
  return `${baseUrl}#/view/${dashboardId}?embed=true&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-30d,to:now))`;
}

export function generateDiscoverUrl(query: OpenSearchQuery): string {
  const baseUrl = `${OPENSEARCH_BASE_URL}/app/discover`;
  const queryString = encodeURIComponent(JSON.stringify(query.query));
  return `${baseUrl}#/?_g=(filters:!())&_a=(query:'${queryString}')`;
}

export default {
  TITAN_QUERIES,
  INQUISITOR_QUERIES,
  SOVEREIGN_QUERIES,
  executeOpenSearchQuery,
  getQueriesForPersona,
  getQueryById,
  generateDashboardUrl,
  generateDiscoverUrl
};
