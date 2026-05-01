"""
Predator Agents OS — Orchestrator
Центральний вузол керування агентами на базі LangGraph.
"""

from typing import Annotated, TypedDict, List, Dict, Any, Union
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from core.llm import planner_llm, coder_llm
import operator
import json

# Визначення стану графа
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    task: str
    plan: List[str]
    results: Dict[str, Any]
    next_step: str

# Системні промпти
PLANNER_PROMPT = """
Ти — Orchestrator проекту PREDATOR Analytics. Твоє завдання — розбити складне завдання користувача на кроки.
Використовуй доступних агентів: Graph Analyst (Neo4j), Researcher (Qdrant), Risk Expert.
Відповідай ТІЛЬКИ у форматі JSON: {"plan": ["крок 1", "крок 2"], "reasoning": "чому саме так"}
"""

REPORTER_PROMPT = """
Ти — Секретар PREDATOR Analytics. Твоє завдання — підсумувати результати роботи агентів для користувача.
Будь лаконічним, використовуй військову термінологію (Cyberpunk style). Мова: УКРАЇНСЬКА.
"""

# Ноди (вузли) графа
async def planner_node(state: AgentState):
    """
    Аналізує завдання та створює план.
    """
    print("--- PLANNER RUNNING ---")
    messages = [
        SystemMessage(content=PLANNER_PROMPT),
        HumanMessage(content=f"Завдання: {state['task']}")
    ]
    response = await planner_llm.ainvoke(messages)
    
    try:
        # Спроба парсингу JSON
        plan_data = json.loads(response.content)
        plan = plan_data.get("plan", [])
    except:
        plan = [response.content]

    return {
        "plan": plan,
        "next_step": "executor"
    }

async def executor_node(state: AgentState):
    """
    Виконує кроки плану (Placeholder для виклику Tool-агентів).
    """
    print("--- EXECUTOR RUNNING ---")
    # Тут буде логіка переключення між інструментами
    return {
        "results": {"status": "info", "data": "Виконано аналіз структури"},
        "next_step": "reporter"
    }

async def reporter_node(state: AgentState):
    """
    Формує фінальну відповідь для користувача.
    """
    print("--- REPORTER RUNNING ---")
    results_str = json.dumps(state["results"], ensure_ascii=False)
    messages = [
        SystemMessage(content=REPORTER_PROMPT),
        HumanMessage(content=f"Результати: {results_str}")
    ]
    response = await coder_llm.ainvoke(messages)
    
    return {
        "messages": [response],
        "next_step": END
    }

# Побудова графа
workflow = StateGraph(AgentState)

# Додавання нод
workflow.add_node("planner", planner_node)
workflow.add_node("executor", executor_node)
workflow.add_node("reporter", reporter_node)

# Встановлення зв'язків
workflow.set_entry_point("planner")
workflow.add_edge("planner", "executor")
workflow.add_edge("executor", "reporter")
workflow.add_edge("reporter", END)

# Компіляція
orchestrator_graph = workflow.compile()

async def run_orchestrator(task: str):
    """
    Запуск оркестратора.
    """
    initial_state = {
        "messages": [HumanMessage(content=task)],
        "task": task,
        "plan": [],
        "results": {},
        "next_step": ""
    }
    return await orchestrator_graph.ainvoke(initial_state)
