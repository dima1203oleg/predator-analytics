"""
Predator Agents OS — Orchestrator
Центральний вузол керування агентами на базі LangGraph.
"""

from typing import Annotated, TypedDict, List, Dict, Any, Union
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from core.llm import planner_llm, coder_llm
from agents.graph_analyst import GraphAnalyst
from agents.researcher import ResearcherAgent
import operator
import json

# Ініціалізація агентів
graph_analyst = GraphAnalyst()
researcher = ResearcherAgent()

# Визначення стану графа
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    task: str
    plan: List[str]
    results: List[Dict[str, Any]]
    next_step: str

# Системні промпти
PLANNER_PROMPT = """
Ти — Orchestrator проекту PREDATOR Analytics. Твоє завдання — розбити складне завдання користувача на кроки.
Використовуй доступних агентів: 
- Graph Analyst: для пошуку зв'язків у Neo4j (власники, директори, пов'язані компанії).
- Researcher: для пошуку в документах та реєстрах (Qdrant).

Відповідай ТІЛЬКИ у форматі JSON: {"plan": [{"agent": "graph_analyst", "task": "опис"}, {"agent": "researcher", "task": "опис"}], "reasoning": "чому саме так"}
"""

REPORTER_PROMPT = """
Ти — Секретар PREDATOR Analytics. Твоє завдання — підсумувати результати роботи агентів для користувача.
Будь лаконічним, використовуй військову термінологію (Cyberpunk style). Мова: УКРАЇНСЬКА.
Якщо є помилки — вкажи на них.
"""

# Ноди (вузли) графа
async def planner_node(state: AgentState):
    """
    Аналізує завдання та створює план.
    """
    print("--- [ORCHESTRATOR] Planning Phase ---")
    messages = [
        SystemMessage(content=PLANNER_PROMPT),
        HumanMessage(content=f"Завдання: {state['task']}")
    ]
    response = await planner_llm.ainvoke(messages)
    
    try:
        plan_data = json.loads(response.content)
        plan = plan_data.get("plan", [])
    except:
        # Fallback якщо модель не видала чистий JSON
        plan = [{"agent": "researcher", "task": state["task"]}]

    return {
        "plan": plan,
        "next_step": "executor"
    }

async def executor_node(state: AgentState):
    """
    Виконує кроки плану, викликаючи реальних агентів.
    """
    print(f"--- [ORCHESTRATOR] Executing {len(state['plan'])} steps ---")
    results = []
    
    for step in state["plan"]:
        agent_type = step.get("agent")
        sub_task = step.get("task")
        
        print(f"Calling {agent_type} for task: {sub_task}")
        
        if agent_type == "graph_analyst":
            res = await graph_analyst.analyze(sub_task)
            results.append(res)
        elif agent_type == "researcher":
            res = await researcher.search(sub_task)
            results.append(res)
        else:
            results.append({"error": f"Unknown agent: {agent_type}"})

    return {
        "results": results,
        "next_step": "reporter"
    }

async def reporter_node(state: AgentState):
    """
    Формує фінальну відповідь для користувача.
    """
    print("--- [ORCHESTRATOR] Reporting Phase ---")
    results_str = json.dumps(state["results"], ensure_ascii=False, indent=2)
    messages = [
        SystemMessage(content=REPORTER_PROMPT),
        HumanMessage(content=f"Результати роботи агентів:\n{results_str}")
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
        "results": [],
        "next_step": ""
    }
    return await orchestrator_graph.ainvoke(initial_state)
