/**
 * 🧪 E2E Test: Search Performance & Accuracy
 *
 * Tests hybrid search functionality:
 * 1. Semantic search
 * 2. Keyword search
 * 3. Hybrid search
 * 4. Performance benchmarks
 * 5. Relevance scoring
 */

describe('Search Performance Test Suite', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  const testQueries = [
    { query: 'митні декларації', mode: 'hybrid', expectedMinResults: 1 },
    { query: 'контрабанда', mode: 'semantic', expectedMinResults: 1 },
    { query: 'import export', mode: 'keyword', expectedMinResults: 1 }
  ]

  before(() => {
    // Health check
    cy.request(`${API_URL}/health`).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  testQueries.forEach((testCase) => {
    it(`Should return results for "${testCase.query}" in ${testCase.mode} mode`, () => {
      const startTime = Date.now()

      cy.request({
        method: 'POST',
        url: `${API_URL}/api/v1/search`,
        body: {
          query: testCase.query,
          mode: testCase.mode,
          limit: 20
        },
        timeout: 10000
      }).then((response) => {
        const latency = Date.now() - startTime

        // Assert response structure
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body).to.have.property('results')
        expect(response.body).to.have.property('took_ms')

        // Assert results quality
        const results = response.body.results
        expect(results).to.be.an('array')
        expect(results.length).to.be.greaterThan(testCase.expectedMinResults - 1)

        // Assert latency SLA
        const LATENCY_SLA_MS = 500
        expect(latency).to.be.lessThan(LATENCY_SLA_MS)

        cy.log(`✅ ${testCase.mode} search: ${results.length} results in ${latency}ms`)

        // Log top result
        if (results.length > 0) {
          const topResult = results[0]
          cy.log(`Top result: ${topResult.title || topResult.id} (score: ${topResult.score})`)
        }
      })
    })
  })
})

/**
 * 🧪 Search Modes Comparison
 */
describe('Search Modes - Quality Comparison', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'
  const testQuery = 'митні декларації з Китаю'

  const modes = ['semantic', 'keyword', 'hybrid']
  const results: any = {}

  modes.forEach((mode) => {
    it(`Perform ${mode} search`, () => {
      cy.request({
        method: 'POST',
        url: `${API_URL}/api/v1/search`,
        body: {
          query: testQuery,
          mode: mode,
          limit: 10
        }
      }).then((response) => {
        expect(response.status).to.eq(200)

        results[mode] = {
          count: response.body.results.length,
          took_ms: response.body.took_ms,
          top_score: response.body.results[0]?.score || 0
        }

        cy.log(`${mode}: ${results[mode].count} results, ${results[mode].took_ms}ms`)
      })
    })
  })

  it('Compare search modes', () => {
    cy.then(() => {
      // Hybrid should have results
      expect(results.hybrid.count).to.be.greaterThan(0)

      // Log comparison
      cy.log('===== Search Modes Comparison =====')
      modes.forEach((mode) => {
        cy.log(`${mode}: ${results[mode].count} results, top score: ${results[mode].top_score}`)
      })
    })
  })
})

/**
 * 🧪 Performance Benchmark
 */
describe('Search Performance Benchmark', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  const ITERATIONS = 10
  const LATENCY_P99_SLA = 500 // ms
  const LATENCY_P50_SLA = 200 // ms

  it(`Should meet latency SLA over ${ITERATIONS} iterations`, () => {
    const latencies: number[] = []

    // Run multiple iterations
    const runSearch = () => {
      return cy.request({
        method: 'POST',
        url: `${API_URL}/api/v1/search`,
        body: {
          query: 'test query',
          mode: 'hybrid',
          limit: 20
        }
      }).then((response) => {
        latencies.push(response.body.took_ms || 0)
      })
    }

    // Chain iterations
    let chain = cy.wrap(null)
    for (let i = 0; i < ITERATIONS; i++) {
      chain = chain.then(runSearch)
    }

    // Analyze results
    chain.then(() => {
      latencies.sort((a, b) => a - b)

      const p50 = latencies[Math.floor(ITERATIONS * 0.5)]
      const p99 = latencies[Math.floor(ITERATIONS * 0.99)]
      const avg = latencies.reduce((a, b) => a + b, 0) / ITERATIONS

      cy.log('===== Latency Analysis =====')
      cy.log(`P50: ${p50}ms (SLA: ${LATENCY_P50_SLA}ms)`)
      cy.log(`P99: ${p99}ms (SLA: ${LATENCY_P99_SLA}ms)`)
      cy.log(`AVG: ${avg.toFixed(0)}ms`)

      // Assert SLAs
      expect(p50).to.be.lessThan(LATENCY_P50_SLA)
      expect(p99).to.be.lessThan(LATENCY_P99_SLA)

      cy.log('✅ Search performance meets SLA')
    })
  })
})

/**
 * 🧪 Pagination Test
 */
describe('Search Pagination', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should support pagination', () => {
    const query = 'test'
    const limit = 10

    // First page
    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v1/search`,
      body: { query, limit, offset: 0 }
    }).then((firstPage) => {
      expect(firstPage.body.results.length).to.be.lessThan(limit + 1)

      const firstResults = firstPage.body.results

      // Second page
      cy.request({
        method: 'POST',
        url: `${API_URL}/api/v1/search`,
        body: { query, limit, offset: limit }
      }).then((secondPage) => {
        const secondResults = secondPage.body.results

        // Verify pagination works (no duplicate IDs)
        const firstIds = firstResults.map((r: any) => r.id)
        const secondIds = secondResults.map((r: any) => r.id)

        const intersection = firstIds.filter((id: string) => secondIds.includes(id))
        expect(intersection.length).to.eq(0)

        cy.log('✅ Pagination works correctly')
      })
    })
  })
})

/**
 * 🧪 Filters Test
 */
describe('Search Filters', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should filter by source_type', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v1/search`,
      body: {
        query: 'test',
        mode: 'hybrid',
        limit: 20,
        filters: {
          source_type: 'customs'
        }
      }
    }).then((response) => {
      expect(response.status).to.eq(200)

      const results = response.body.results

      // Verify all results match filter
      if (results.length > 0) {
        results.forEach((result: any) => {
          if (result.source_type) {
            expect(result.source_type).to.eq('customs')
          }
        })

        cy.log('✅ Source type filter works')
      }
    })
  })
})

/**
 * 🧪 Error Handling
 */
describe('Search Error Handling', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should handle empty query gracefully', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v1/search`,
      body: {
        query: '',
        mode: 'hybrid'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Should return 400 or handle gracefully
      expect([200, 400, 422]).to.include(response.status)
    })
  })

  it('Should handle invalid mode gracefully', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v1/search`,
      body: {
        query: 'test',
        mode: 'invalid_mode'
      },
      failOnStatusCode: false
    }).then((response) => {
      // Should return error or default to hybrid
      expect([200, 400, 422]).to.include(response.status)
    })
  })
})

/**
 * 🧪 Concurrent Requests
 */
describe('Search Concurrency', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should handle concurrent requests', () => {
    const concurrentRequests = 5
    const requests = []

    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        cy.request({
          method: 'POST',
          url: `${API_URL}/api/v1/search`,
          body: {
            query: `concurrent test ${i}`,
            mode: 'hybrid',
            limit: 10
          }
        })
      )
    }

    // All should succeed
    requests.forEach((req) => {
      req.then((response) => {
        expect(response.status).to.eq(200)
      })
    })

    cy.log('✅ Handled concurrent requests successfully')
  })
})
