/**
 * 🧪 E2E Test: Full ML Training Cycle
 *
 * Tests the complete ML training pipeline from data upload to model deployment:
 * 1. Upload dataset
 * 2. Trigger ML training
 * 3. Monitor progress
 * 4. Verify completion
 * 5. Check model artifacts
 */

describe('ML Training End-to-End Cycle', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  let datasetId: string
  let jobId: string

  before(() => {
    // Setup: Ensure backend is healthy
    cy.request(`${API_URL}/health`).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.status).to.eq('healthy')
    })
  })

  it('Step 1: Upload test dataset', () => {
    cy.log('📤 Uploading test dataset...')

    // Use fixture file
    cy.fixture('test-dataset.csv', 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then((blob) => {
        const formData = new FormData()
        formData.append('file', blob, 'test-dataset.csv')
        formData.append('dataset_type', 'generic')

        cy.request({
          method: 'POST',
          url: `${API_URL}/api/v1/data/upload`,
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        }).then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('status', 'queued')

          cy.log('✅ Dataset uploaded successfully')
        })
      })
  })

  it('Step 2: Wait for dataset processing', () => {
    cy.log('⏳ Waiting for dataset processing...')

    // Poll for datasets
    cy.waitUntil(() =>
      cy.request(`${API_URL}/api/v45/data-hub/datasets`)
        .then((response) => {
          const datasets = response.body.datasets || []
          const latestDataset = datasets[0]

          if (latestDataset) {
            datasetId = latestDataset.id
            return latestDataset.status === 'ready'
          }
          return false
        }),
      {
        timeout: 60000,
        interval: 2000,
        errorMsg: 'Dataset processing timeout'
      }
    )

    cy.log(`✅ Dataset ready: ${datasetId}`)
  })

  it('Step 3: Trigger ML training', () => {
    cy.log('🤖 Starting ML training...')

    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v45/ml-training/start`,
      body: {
        dataset_id: datasetId,
        model_type: 'automl',
        hyperparameters: {
          max_models: 5,
          max_runtime_secs: 300
        },
        auto_deploy: false
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('job_id')

      jobId = response.body.job_id

      cy.log(`✅ ML training started: ${jobId}`)
    })
  })

  it('Step 4: Monitor training progress', () => {
    cy.log('📊 Monitoring training progress...')

    let lastProgress = 0

    cy.waitUntil(() =>
      cy.request(`${API_URL}/api/v45/ml-jobs/${jobId}`)
        .then((response) => {
          expect(response.status).to.eq(200)

          const job = response.body
          const currentProgress = job.progress_percent || 0

          if (currentProgress > lastProgress) {
            cy.log(`Progress: ${currentProgress}%`)
            lastProgress = currentProgress
          }

          return job.status === 'succeeded' || job.status === 'failed'
        }),
      {
        timeout: 300000, // 5 minutes max
        interval: 5000,  // Check every 5 seconds
        errorMsg: 'ML training timeout'
      }
    )
  })

  it('Step 5: Verify training completion', () => {
    cy.log('✅ Verifying training results...')

    cy.request(`${API_URL}/api/v45/ml-jobs/${jobId}`).then((response) => {
      const job = response.body

      // Assert successful completion
      expect(job.status).to.eq('succeeded')
      expect(job.progress_percent).to.eq(100)

      // Verify metrics exist
      expect(job).to.have.property('metrics')
      expect(job.metrics).to.have.property('accuracy')
      expect(job.metrics.accuracy).to.be.greaterThan(0)

      cy.log(`✅ Training completed! Accuracy: ${job.metrics.accuracy}`)
    })
  })

  it('Step 6: Check model artifacts', () => {
    cy.log('📦 Checking model artifacts...')

    cy.request(`${API_URL}/api/v45/ml-jobs/${jobId}/artifacts`).then((response) => {
      expect(response.status).to.eq(200)

      const artifacts = response.body.artifacts || []

      // Verify artifacts exist
      expect(artifacts.length).to.be.greaterThan(0)

      // Check for model file
      const hasModel = artifacts.some((a: any) =>
        a.type === 'model' || a.name.includes('.pkl') || a.name.includes('.h5')
      )
      expect(hasModel).to.be.true

      cy.log(`✅ Found ${artifacts.length} artifacts`)
    })
  })

  it('Step 7: Cleanup (optional)', () => {
    cy.log('🧹 Cleanup test data...')

    // Delete test job (optional)
    cy.request({
      method: 'DELETE',
      url: `${API_URL}/api/v45/ml-jobs/${jobId}`,
      failOnStatusCode: false
    }).then((response) => {
      cy.log('✅ Cleanup completed')
    })
  })
})

/**
 * 🧪 Helper: Performance Benchmark
 */
describe('ML Training Performance Benchmark', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should complete training within SLA', () => {
    const startTime = Date.now()
    const SLA_THRESHOLD_MS = 300000 // 5 minutes

    cy.request(`${API_URL}/api/v45/ml-jobs`)
      .then((response) => {
        const recentJobs = response.body.jobs || []
        const completedJobs = recentJobs.filter((j: any) => j.status === 'succeeded')

        if (completedJobs.length > 0) {
          const avgDuration = completedJobs.reduce((sum: number, job: any) => {
            return sum + (job.duration_ms || 0)
          }, 0) / completedJobs.length

          cy.log(`Average training duration: ${avgDuration}ms`)
          expect(avgDuration).to.be.lessThan(SLA_THRESHOLD_MS)
        }
      })
  })
})
