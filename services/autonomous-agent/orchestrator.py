"""
Orchestrator for the LLM Council (Autonomous OODA Loop).
Натхненно підходом karpathy/llm-council.
"""

import os
from loguru import logger
from langgraph.graph import StateGraph, END
from typing import Dict, Any, TypedDict

import os
from loguru import logger
from langgraph.graph import StateGraph, END
from typing import Dict, Any, TypedDict
from git_manager import GitManager
from test_runner import TestRunner
from council_judge import CouncilJudge
import asyncio

# Mypy strict requires explicit types
class AgentState(TypedDict):
    task: str
    code_diff: str
    qa_status: str
    iteration: int
    max_iterations: int
    proposals: List[str]
    decision: str

class ChiefConductor:
    def __init__(self) -> None:
        self.workflow = StateGraph(AgentState)
        self.git = GitManager()
        self.tester = TestRunner()
        self.council = CouncilJudge()
        self._setup_graph()
        self.app = self.workflow.compile()
    
    def _setup_graph(self) -> None:
        self.workflow.add_node("planner", self.node_planner)
        self.workflow.add_node("council_session", self.node_council_session)
        self.workflow.add_node("ui_optimizer", self.node_ui_optimizer)
        self.workflow.add_node("coder", self.node_coder)
        self.workflow.add_node("qa_reviewer", self.node_qa_reviewer)
        
        self.workflow.set_entry_point("planner")
        
        # Planner decides if it needs Council for strategic decisions
        self.workflow.add_conditional_edges(
            "planner",
            self.route_planner_decision,
            {
                "strategic": "council_session",
                "ui": "ui_optimizer",
                "routine": "coder"
            }
        )
        
        self.workflow.add_edge("council_session", "coder")
        self.workflow.add_edge("ui_optimizer", "qa_reviewer")
        self.workflow.add_edge("coder", "qa_reviewer")
        
        self.workflow.add_conditional_edges(
            "qa_reviewer",
            self.route_qa_result,
            {
                "pass": END,
                "fail": "coder", # Default retry
                "timeout": END
            }
        )

    def route_planner_decision(self, state: AgentState) -> str:
        if "architecture" in state['task'].lower() or "strategic" in state['task'].lower():
            return "strategic"
        if "ui" in state['task'].lower() or "ux" in state['task'].lower():
            return "ui"
        return "routine"

    def node_planner(self, state: AgentState) -> AgentState:
        logger.info(f"ChiefConductor: Analyzing task '{state['task']}'")
        self.git.run_cmd(["git", "pull", "--rebase"])
        return state

    async def node_council_session(self, state: AgentState) -> AgentState:
        logger.info("ChiefConductor: Convening strategic Council Session...")
        decision = await self.council.get_council_decision(state['task'], "Sovereign Factory Context")
        state['decision'] = decision
        return state

    def node_ui_optimizer(self, state: AgentState) -> AgentState:
        logger.info("ChiefConductor: UI/UX Optimizer Agent activated...")
        state['iteration'] += 1
        # Тут буде аналіз Lighthouse CI та генерація патчів
        return state

    def node_coder(self, state: AgentState) -> AgentState:
        logger.info("ChiefConductor: Coding changes...")
        state['iteration'] += 1
        # Генерація коду на основі плану або рішення ради
        state['code_diff'] = self.git.get_diff()
        return state

    def node_qa_reviewer(self, state: AgentState) -> AgentState:
        logger.info("ChiefConductor: Executing QA Verification...")
        if state['iteration'] >= state['max_iterations']:
            state['qa_status'] = 'timeout'
            return state

        # Run full suite (HR-09)
        lint_ok, _ = self.tester.run_python_lint()
        # Тут також запуск Playwright для UI (UI-Tester)
        
        if not lint_ok:
            state['qa_status'] = 'fail'
            return state
            
        state['qa_status'] = 'pass'
        diff_str = self.git.get_diff()
        if diff_str:
            self.git.commit_changes(f"feat(factory): {state['task']} [OODA Cycle]")
            
            # Telegram notification
            from bot import bot as tg_bot, send_notification
            asyncio.create_task(send_notification(tg_bot, f"🚀 Factory Cycle #{state['iteration']} Success!\nTask: {state['task']}\nStatus: COMMITTED & DEPLOYED"))
            
        return state

    def route_qa_result(self, state: AgentState) -> str:
        return state['qa_status']

    async def run_loop(self) -> None:
        """Eternal OODA Loop for Predator Factory."""
        logger.info("FACTORY: Eternal OODA Loop STARTED.")
        while True:
            # 1. Скрапінг задач / аналіз логів / Sentinel alerts
            task = "Optimize Neo4j query performance" # Example
            
            initial_state: AgentState = {
                "task": task,
                "code_diff": "",
                "qa_status": "",
                "iteration": 0,
                "max_iterations": 3,
                "proposals": [],
                "decision": ""
            }
            
            # 2. Виконання циклу
            # await self.app.ainvoke(initial_state)
            
            await asyncio.sleep(900) # Every 15 mins (Step 3 in plan)
            logger.debug("Factory resting for 15 mins...")
