"""Predator Agents OS — Orchestrator
Центральний вузол керування агентами на базі LangGraph.
"""

import json
import operator
from typing import Annotated, Any, TypedDict

from agents.graph_analyst import GraphAnalyst
from agents.researcher import ResearcherAgent
from agents.sysadmin import SysAdminAgent
from core.memory import AgentMemory
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from core.llm import coder_llm, planner_llm

# Ініціалізація
graph_analyst = GraphAnalyst()
researcher = ResearcherAgent()
sysadmin = SysAdminAgent()
memory = AgentMemory()

# Визначення стану графа
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], operator.add]
    task: str
    plan: list[str]
    results: list[dict[str, Any]]
    context: list[str] # Пам'ять про попередні події
    next_step: str

# Системні промпти
PLANNER_PROMPT = """
Ти — Orchestrator проекту PREDATOR Analytics. Твоє завдання — розбити складне завдання користувача на кроки.
Враховуй наданий КОНТЕКСТ (пам'ять про попередні дії).

Використовуй агентів: 
- Graph Analyst: зв'язки у Neo4j.
- Researcher: пошук у документах (Qdrant).
- SysAdmin: перевірка стану системи, MCP інструментів, БД та ресурсів.

Відповідай ТІЛЬКИ у форматі JSON: {"plan": [{"agent": "graph_analyst", "task": "опис"}], "reasoning": "чому"}
"""

REPORTER_PROMPT = """
Ти — Секретар PREDATOR Analytics. Підсумуй результати. 
Військова термінологія, українська мова, Cyberpunk style.
"""

# Ноди
async def planner_node(state: AgentState):
    """Аналізує завдання та створює план, враховуючи пам'ять.
    """
    print("--- [ORCHESTRATOR] Planning with Memory ---")

    # Пошук у пам'яті
    past_memories = await memory.query_memories(state["task"], limit=3)
    context_str = "\n".join([m["text"] for m in past_memories])

    messages = [
        SystemMessage(content=PLANNER_PROMPT),
        HumanMessage(content=f"КОНТЕКСТ З ПАМ'ЯТІ:\n{context_str}\n\nЗАВДАННЯ: {state['task']}")
    ]
    response = await planner_llm.ainvoke(messages)

    try:
        plan_data = json.loads(response.content)
        plan = plan_data.get("plan", [])
    except:
        plan = [{"agent": "researcher", "task": state["task"]}]

    return {
        "plan": plan,
        "context": [context_str],
        "next_step": "executor"
    }

async def executor_node(state: AgentState):
    """Виконує кроки плану.
    """
    print("--- [ORCHESTRATOR] Executing Plan ---")
    results = []

    for step in state["plan"]:
        agent_type = step.get("agent")
        sub_task = step.get("task")

        if agent_type == "graph_analyst":
            res = await graph_analyst.analyze(sub_task)
            results.append(res)
        elif agent_type == "researcher":
            res = await researcher.search(sub_task)
            results.append(res)
        elif agent_type == "sysadmin":
            res = await sysadmin.execute(sub_task)
            results.append(res)

    return {
        "results": results,
        "next_step": "reporter"
    }

async def reporter_node(state: AgentState):
    """Формує відповідь та зберігає нові факти в пам'ять.
    """
    print("--- [ORCHESTRATOR] Reporting & Memorizing ---")
    results_str = json.dumps(state["results"], ensure_ascii=False, indent=2)

    # Збереження результатів у пам'ять для майбутнього
    summary_for_memory = f"Завдання: {state['task']}. Результат: {results_str[:500]}"
    await memory.add_memory(summary_for_memory, metadata={"source": "orchestrator", "task": state["task"]})

    messages = [
        SystemMessage(content=REPORTER_PROMPT),
        HumanMessage(content=f"Результати:\n{results_str}")
    ]
    response = await coder_llm.ainvoke(messages)

    return {
        "messages": [response],
        "next_step": END
    }

# Граф
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_node)
workflow.add_node("executor", executor_node)
workflow.add_node("reporter", reporter_node)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "executor")
workflow.add_edge("executor", "reporter")
workflow.add_edge("reporter", END)

orchestrator_graph = workflow.compile()

async def run_orchestrator(task: str):
    initial_state = {
        "messages": [HumanMessage(content=task)],
        "task": task,
        "plan": [],
        "results": [],
        "context": [],
        "next_step": ""
    }
    return await orchestrator_graph.ainvoke(initial_state)
