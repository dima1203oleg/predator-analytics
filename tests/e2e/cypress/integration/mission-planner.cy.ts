/**
 * 🧪 E2E Test: Mission Planner Workflow
 *
 * Tests the multi-agent mission execution system:
 * 1. Create mission via API
 * 2. Verify task breakdown
 * 3. Monitor agent assignment
 * 4. Track execution progress
 * 5. Verify completion
 */

describe('Mission Planner End-to-End', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  let missionId: string

  before(() => {
    // Verify Mission Planner API is available
    cy.request(`${API_URL}/api/v45/missions/agents/stats`).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('total_agents')
      expect(response.body.total_agents).to.be.greaterThan(0)

      cy.log(`✅ ${response.body.total_agents} agents available`)
    })
  })

  it('Test 1: Create threat analysis mission', () => {
    cy.log('🎯 Creating threat analysis mission...')

    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v45/missions/test/threat-analysis`,
      timeout: 30000
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body).to.have.property('mission_id')

      missionId = response.body.mission_id

      cy.log(`✅ Mission created: ${missionId}`)
      cy.log(`Tasks: ${response.body.tasks.length}`)
      cy.log(`Agents: ${response.body.agents.join(', ')}`)
    })
  })

  it('Test 2: Verify mission details', () => {
    cy.log('📊 Fetching mission details...')

    cy.request(`${API_URL}/api/v45/missions/${missionId}`).then((response) => {
      expect(response.status).to.eq(200)

      const mission = response.body

      // Verify mission structure
      expect(mission).to.have.property('mission_id', missionId)
      expect(mission).to.have.property('status')
      expect(mission).to.have.property('priority')
      expect(mission).to.have.property('tasks')
      expect(mission).to.have.property('assigned_agents')

      // Verify tasks were created
      expect(mission.tasks.length).to.be.greaterThan(0)

      // Verify agents were assigned
      expect(mission.assigned_agents.length).to.be.greaterThan(0)

      cy.log(`✅ Mission has ${mission.tasks.length} tasks`)
      cy.log(`✅ ${mission.assigned_agents.length} agents assigned`)
    })
  })

  it('Test 3: Monitor mission progress', () => {
    cy.log('⏳ Monitoring mission execution...')

    let lastProgress = 0

    cy.waitUntil(() =>
      cy.request(`${API_URL}/api/v45/missions/${missionId}`)
        .then((response) => {
          const mission = response.body
          const progress = mission.progress || 0

          if (progress > lastProgress) {
            cy.log(`Progress: ${progress.toFixed(1)}%`)
            lastProgress = progress
          }

          // Mission completed when status is 'completed' or 'failed'
          return mission.status === 'completed' || mission.status === 'failed'
        }),
      {
        timeout: 60000,  // 1 minute max
        interval: 2000,  // Check every 2 seconds
        errorMsg: 'Mission execution timeout'
      }
    )

    cy.log('✅ Mission execution finished')
  })

  it('Test 4: Verify successful completion', () => {
    cy.log('✅ Verifying mission results...')

    cy.request(`${API_URL}/api/v45/missions/${missionId}`).then((response) => {
      const mission = response.body

      // Verify mission completed successfully
      expect(mission.status).to.eq('completed')
      expect(mission.progress).to.eq(100)

      // Verify all tasks completed
      const completedTasks = mission.tasks.filter((t: any) => t.status === 'completed')
      expect(completedTasks.length).to.eq(mission.tasks.length)

      // Verify results exist
      if (mission.results) {
        expect(mission.results).to.be.an('object')
        cy.log(`Results: ${JSON.stringify(mission.results, null, 2)}`)
      }

      cy.log(`✅ All ${mission.tasks.length} tasks completed successfully`)
    })
  })

  it('Test 5: Check agent statistics', () => {
    cy.log('📊 Checking agent stats after mission...')

    cy.request(`${API_URL}/api/v45/missions/agents/stats`).then((response) => {
      expect(response.status).to.eq(200)

      const stats = response.body

      // Verify agent stats structure
      expect(stats).to.have.property('total_agents')
      expect(stats).to.have.property('available_agents')
      expect(stats).to.have.property('agents')

      // Log top performing agents
      Object.entries(stats.agents).slice(0, 5).forEach(([name, agentStats]: [string, any]) => {
        cy.log(`Agent ${name}: ${agentStats.tasks_completed} tasks, ${agentStats.success_rate}% success`)
      })

      cy.log('✅ Agent statistics verified')
    })
  })
})

/**
 * 🧪 Test: Multiple Mission Types
 */
describe('Mission Planner - Different Mission Types', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  const missionTypes = [
    {
      name: 'Data Processing',
      endpoint: '/test/data-processing',
      expectedAgents: ['LLM', 'CRITIC']
    },
    {
      name: 'System Health',
      endpoint: '/test/system-health',
      expectedAgents: ['DEVOPS', 'PERFORMANCE']
    }
  ]

  missionTypes.forEach((missionType) => {
    it(`Should execute ${missionType.name} mission`, () => {
      cy.log(`🎯 Testing ${missionType.name} mission...`)

      cy.request({
        method: 'POST',
        url: `${API_URL}/api/v45/missions${missionType.endpoint}`,
        timeout: 30000
      }).then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.be.true

        const missionId = response.body.mission_id

        // Verify expected agents are involved
        const assignedAgents = response.body.agents || []
        const hasExpectedAgents = missionType.expectedAgents.some((expectedAgent) =>
          assignedAgents.includes(expectedAgent)
        )

        expect(hasExpectedAgents).to.be.true

        cy .log(`✅ ${missionType.name} mission created with appropriate agents`)
      })
    })
  })
})

/**
 * 🧪 Test: Custom Mission Creation
 */
describe('Mission Planner - Custom Missions', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should create custom mission', () => {
    cy.log('🎯 Creating custom mission...')

    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v45/missions/create`,
      body: {
        title: 'Cypress E2E Test Mission',
        description: 'Automated test mission for validating multi-agent coordination',
        priority: 'high',
        context: {
          test_id: 'cypress_e2e',
          timestamp: new Date().toISOString()
        }
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true

      const missionId = response.body.mission_id

      // Verify mission was planned
      expect(response.body).to.have.property('tasks_count')
      expect(response.body.tasks_count).to.be.greaterThan(0)

      cy.log(`✅ Custom mission created: ${missionId}`)
      cy.log(`Tasks: ${response.body.tasks_count}`)
    })
  })
})

/**
 * 🧪 Performance Test: Mission Execution Time
 */
describe('Mission Planner - Performance', () => {
  const API_URL = Cypress.env('API_URL') || 'http://localhost:8090'

  it('Should execute mission within performance SLA', () => {
    const SLA_THRESHOLD_MS = 30000 // 30 seconds
    const startTime = Date.now()

    cy.request({
      method: 'POST',
      url: `${API_URL}/api/v45/missions/test/system-health`,
    }).then((response) => {
      const missionId = response.body.mission_id

      // Wait for completion
      cy.waitUntil(() =>
        cy.request(`${API_URL}/api/v45/missions/${missionId}`)
          .then((res) => res.body.status === 'completed'),
        { timeout: SLA_THRESHOLD_MS, interval: 1000 }
      ).then(() => {
        const duration = Date.now() - startTime

        cy.log(`⚡ Mission completed in ${duration}ms`)
        expect(duration).to.be.lessThan(SLA_THRESHOLD_MS)
      })
    })
  })
})
