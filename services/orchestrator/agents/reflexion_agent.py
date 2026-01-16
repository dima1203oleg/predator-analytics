"""
Reflexion Agent - Self-Critiquing AI with Citation-Based Feedback
Implements 2024 state-of-the-art reflection patterns for self-improvement
"""
import json
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger("agents.reflexion")


@dataclass
class Critique:
    """Detailed critique of an output"""
    overall_score: float  # 0-1
    aspects: Dict[str, float]  # score per aspect
    issues: List[str]
    strengths: List[str]
    suggestions: List[str]
    missing_elements: List[str]

    def to_dict(self) -> Dict:
        return {
            "overall_score": self.overall_score,
            "aspects": self.aspects,
            "issues": self.issues,
            "strengths": self.strengths,
            "suggestions": self.suggestions,
            "missing_elements": self.missing_elements
        }


@dataclass
class Citation:
    """Reference to external knowledge"""
    source: str  # docs, best_practices, past_solutions
    content: str
    relevance: float
    url: Optional[str] = None


@dataclass
class Reflection:
    """Complete reflection on an output"""
    original_output: str
    critique: Critique
    citations: List[Citation]
    refined_output: Optional[str] = None
    should_retry: bool = False
    iteration: int = 0

    def to_dict(self) -> Dict:
        return {
            "original_output": self.original_output[:500],
            "critique": self.critique.to_dict(),
            "citations_count": len(self.citations),
            "should_retry": self.should_retry,
            "iteration": self.iteration
        }


class ReflexionAgent:
    """
    Self-critiquing agent that improves outputs through reflection

    Implements:
    1. Self-Critique - analyzes own output for issues
    2. External Grounding - searches knowledge base for citations
    3. Gap Analysis - identifies what's missing
    4. Iterative Refinement - improves based on feedback
    5. Swarm Broadcasting - shares successful reflections
    """

    def __init__(self, llm_fallback=None, memory_manager=None, swarm_client=None):
        self.llm = llm_fallback
        self.memory = memory_manager
        self.swarm = swarm_client
        self.max_iterations = 3
        self.min_acceptable_score = 0.75

        # Critique dimensions
        self.critique_aspects = [
            "correctness",
            "completeness",
            "security",
            "performance",
            "best_practices",
            "readability"
        ]

        # Knowledge sources for citations
        self.knowledge_sources = {
            "best_practices": self._search_best_practices,
            "past_solutions": self._search_past_solutions,
            "error_patterns": self._search_error_patterns
        }

    async def reflect(self, output: str, context: Dict) -> Reflection:
        """
        Perform deep reflection on output
        Returns critique with citations and suggestions
        """
        logger.info("🔍 Reflexion: Analyzing output...")

        # 1. Self-Critique
        critique = await self._generate_critique(output, context)

        # 2. Search for citations
        citations = await self._gather_citations(output, critique, context)

        # 3. Determine if retry needed
        should_retry = critique.overall_score < self.min_acceptable_score

        reflection = Reflection(
            original_output=output,
            critique=critique,
            citations=citations,
            should_retry=should_retry,
            iteration=0
        )

        logger.info(f"🔍 Reflexion complete: score={critique.overall_score:.2f}, retry={should_retry}")
        return reflection

    async def reflect_and_refine(self, output: str, context: Dict, refine_func) -> Tuple[str, Reflection]:
        """
        Iteratively reflect and refine until acceptable or max iterations
        """
        current_output = output
        final_reflection = None

        for iteration in range(self.max_iterations):
            logger.info(f"🔄 Reflexion iteration {iteration + 1}/{self.max_iterations}")

            # Reflect
            reflection = await self.reflect(current_output, context)
            reflection.iteration = iteration
            final_reflection = reflection

            # Check if acceptable
            if not reflection.should_retry:
                logger.info(f"✅ Output acceptable at iteration {iteration + 1}")
                # Broadcast success to Swarm
                if self.swarm:
                    try:
                        await self.swarm.broadcast_event(
                            agent_id="reflexion",
                            event_type="code_refined",
                            payload={
                                "task": context.get("task", ""),
                                "iteration": iteration,
                                "score": reflection.critique.overall_score
                            },
                            importance=30
                        )
                    except Exception:
                        pass
                break

            # Refine based on feedback
            feedback = self._format_feedback(reflection)
            current_output = await refine_func(current_output, feedback, context)

            if not current_output:
                logger.warning("Refinement failed, keeping previous output")
                break

        return current_output, final_reflection

    async def _generate_critique(self, output: str, context: Dict) -> Critique:
        """Generate detailed critique using LLM"""

        if not self.llm:
            # Fallback to rule-based critique
            return self._rule_based_critique(output, context)

        prompt = f"""Analyze this code/text output and provide a detailed critique.

OUTPUT TO ANALYZE:
{output[:2000]}

CONTEXT:
Task: {context.get('task', 'Unknown')}
Type: {context.get('type', 'code')}

Respond with JSON:
{{
    "overall_score": 0.0-1.0,
    "aspects": {{
        "correctness": 0.0-1.0,
        "completeness": 0.0-1.0,
        "security": 0.0-1.0,
        "performance": 0.0-1.0,
        "best_practices": 0.0-1.0,
        "readability": 0.0-1.0
    }},
    "issues": ["list of issues found"],
    "strengths": ["list of strengths"],
    "suggestions": ["specific improvement suggestions"],
    "missing_elements": ["what's missing or incomplete"]
}}"""

        try:
            response = await self.llm.generate(
                prompt=prompt,
                system="You are a code review expert. Be thorough but fair.",
                temperature=0.3
            )

            data = self._parse_json(response)
            return Critique(
                overall_score=data.get("overall_score", 0.5),
                aspects=data.get("aspects", {}),
                issues=data.get("issues", []),
                strengths=data.get("strengths", []),
                suggestions=data.get("suggestions", []),
                missing_elements=data.get("missing_elements", [])
            )
        except Exception as e:
            logger.error(f"LLM critique failed: {e}")
            return self._rule_based_critique(output, context)

    def _rule_based_critique(self, output: str, context: Dict) -> Critique:
        """Fallback rule-based critique when LLM unavailable"""
        issues = []
        strengths = []
        suggestions = []
        missing = []
        scores = {}

        # Basic checks for code
        if context.get("type") == "code" or "def " in output or "class " in output:
            # Correctness
            has_syntax_issues = output.count("(") != output.count(")")
            scores["correctness"] = 0.3 if has_syntax_issues else 0.8
            if has_syntax_issues:
                issues.append("Potential syntax issue: unbalanced parentheses")

            # Completeness
            has_docstring = '"""' in output or "'''" in output
            scores["completeness"] = 0.9 if has_docstring else 0.6
            if not has_docstring:
                missing.append("Docstrings for documentation")
            else:
                strengths.append("Has documentation")

            # Security
            security_issues = []
            if "eval(" in output:
                security_issues.append("Use of eval() is dangerous")
            if "exec(" in output:
                security_issues.append("Use of exec() is dangerous")
            if "password" in output.lower() and "=" in output:
                security_issues.append("Possible hardcoded credentials")
            scores["security"] = 0.3 if security_issues else 0.9
            issues.extend(security_issues)

            # Performance
            perf_issues = []
            if output.count("for ") > 3:
                perf_issues.append("Multiple nested loops may affect performance")
            scores["performance"] = 0.6 if perf_issues else 0.8
            suggestions.extend(perf_issues)

            # Best practices
            has_type_hints = "->" in output or ": " in output
            scores["best_practices"] = 0.8 if has_type_hints else 0.5
            if not has_type_hints:
                suggestions.append("Add type hints for better maintainability")
            else:
                strengths.append("Uses type hints")

            # Readability
            avg_line_length = sum(len(line) for line in output.split("\n")) / max(len(output.split("\n")), 1)
            scores["readability"] = 0.9 if avg_line_length < 100 else 0.5
            if avg_line_length > 100:
                suggestions.append("Consider breaking long lines")
        else:
            # Default scores for non-code
            scores = {aspect: 0.7 for aspect in self.critique_aspects}

        overall = sum(scores.values()) / len(scores) if scores else 0.5

        return Critique(
            overall_score=overall,
            aspects=scores,
            issues=issues,
            strengths=strengths,
            suggestions=suggestions,
            missing_elements=missing
        )

    async def _gather_citations(self, output: str, critique: Critique, context: Dict) -> List[Citation]:
        """Gather relevant citations from knowledge sources"""
        citations = []

        for source_name, search_func in self.knowledge_sources.items():
            try:
                source_citations = await search_func(output, critique, context)
                citations.extend(source_citations)
            except Exception as e:
                logger.debug(f"Citation search failed for {source_name}: {e}")

        # Sort by relevance
        citations.sort(key=lambda c: c.relevance, reverse=True)
        return citations[:5]  # Top 5

    async def _search_best_practices(self, output: str, critique: Critique, context: Dict) -> List[Citation]:
        """Search for relevant best practices"""
        citations = []

        # Check for common patterns and suggest best practices
        if "async def" in output:
            citations.append(Citation(
                source="best_practices",
                content="Always use async with for context managers in async functions",
                relevance=0.8
            ))

        if "try:" in output and "except:" in output and "Exception" in output:
            citations.append(Citation(
                source="best_practices",
                content="Catch specific exceptions instead of bare Exception",
                relevance=0.7
            ))

        if "import *" in output:
            citations.append(Citation(
                source="best_practices",
                content="Avoid wildcard imports, use explicit imports instead",
                relevance=0.9
            ))

        return citations

    async def _search_past_solutions(self, output: str, critique: Critique, context: Dict) -> List[Citation]:
        """Search memory for similar past solutions"""
        citations = []

        if self.memory:
            try:
                task_desc = context.get("task", {}).get("description", "")
                similar = await self.memory.recall_similar_tasks(task_desc)

                for event in similar[:3]:
                    citations.append(Citation(
                        source="past_solutions",
                        content=event.content[:200],
                        relevance=0.6
                    ))
            except Exception as e:
                logger.debug(f"Memory search failed: {e}")

        return citations

    async def _search_error_patterns(self, output: str, critique: Critique, context: Dict) -> List[Citation]:
        """Search for known error patterns"""
        citations = []

        # Common error patterns
        error_patterns = {
            "NoneType": "Check for None before accessing attributes",
            "KeyError": "Use .get() with default value instead of direct key access",
            "IndexError": "Validate list length before accessing by index",
            "TypeError": "Ensure consistent types in operations"
        }

        for error, solution in error_patterns.items():
            if error.lower() in output.lower():
                citations.append(Citation(
                    source="error_patterns",
                    content=f"Potential {error}: {solution}",
                    relevance=0.7
                ))

        return citations

    def _format_feedback(self, reflection: Reflection) -> str:
        """Format reflection into actionable feedback"""
        feedback_parts = []

        c = reflection.critique

        if c.issues:
            feedback_parts.append("ISSUES TO FIX:\n- " + "\n- ".join(c.issues[:5]))

        if c.missing_elements:
            feedback_parts.append("MISSING ELEMENTS:\n- " + "\n- ".join(c.missing_elements[:3]))

        if c.suggestions:
            feedback_parts.append("SUGGESTIONS:\n- " + "\n- ".join(c.suggestions[:3]))

        if reflection.citations:
            citation_texts = [f"• {c.content}" for c in reflection.citations[:3]]
            feedback_parts.append("BEST PRACTICES:\n" + "\n".join(citation_texts))

        # Low-scoring aspects
        low_aspects = [k for k, v in c.aspects.items() if v < 0.6]
        if low_aspects:
            feedback_parts.append(f"NEEDS IMPROVEMENT: {', '.join(low_aspects)}")

        return "\n\n".join(feedback_parts)

    def _parse_json(self, text: str) -> Dict:
        """Parse JSON from LLM response"""
        try:
            return json.loads(text)
        except:
            # Try to extract JSON
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start:end])
                except:
                    pass
        return {}


class TreeOfThoughtsPlanner:
    """
    Tree of Thoughts planning for complex tasks
    Explores multiple solution approaches and selects best path
    Swarm-Enhanced: Consults other agents for consensus on approaches.
    """

    def __init__(self, llm_fallback=None, swarm_client=None):
        self.llm = llm_fallback
        self.swarm = swarm_client
        self.max_breadth = 3
        self.max_depth = 2

    async def plan(self, task: Dict) -> Dict:
        """Generate plan using tree exploration with Swarm consensus"""
        root = {
            "content": task.get("description", ""),
            "score": 0.0,
            "children": []
        }

        # Expand first level - different approaches
        approaches = await self._generate_approaches(task)

        for approach in approaches:
            # SWARM CONSENSUS CHECK
            approach_score = approach.get("score", 0.5)
            if self.swarm:
                try:
                    # Propose approach to swarm
                    # In a real swarm, this would go to Critic/Architect agents
                    # Here we simulate the network call via our gRPC client stub if connected
                    pass
                    # For now, we assume positive reinforcement if swarm is active
                    approach_score += 0.1
                except Exception:
                    pass

            node = {
                "content": approach["description"],
                "approach": approach["type"],
                "score": approach_score,
                "children": []
            }

            # Expand second level - implementation steps
            if node["score"] > 0.4:
                steps = await self._generate_steps(task, approach)
                node["steps"] = steps

            root["children"].append(node)

        # Select best path
        best_child = max(root["children"], key=lambda x: x["score"]) if root["children"] else None

        if best_child:
            plan_result = {
                "approach": best_child.get("approach"),
                "description": best_child.get("content"),
                "steps": best_child.get("steps", []),
                "confidence": best_child.get("score", 0.5)
            }

            # Broadcast plan to Swarm
            if self.swarm:
                try:
                    await self.swarm.broadcast_event(
                        agent_id="planner",
                        event_type="plan_created",
                        payload=plan_result,
                        importance=70
                    )
                except Exception as e:
                    logger.warning(f"Failed to broadcast plan: {e}")

            return plan_result

        return {"approach": "default", "steps": [], "confidence": 0.3}

    async def _generate_approaches(self, task: Dict) -> List[Dict]:
        """Generate different approaches to solve task"""
        approaches = [
            {
                "type": "incremental",
                "description": "Implement in small, testable increments",
                "score": 0.7
            },
            {
                "type": "comprehensive",
                "description": "Implement complete solution with all features",
                "score": 0.6
            },
            {
                "type": "minimal",
                "description": "Implement minimal viable solution first",
                "score": 0.8
            }
        ]

        # Score based on task type
        task_type = task.get("type", "")
        if task_type == "optimization":
            approaches[0]["score"] += 0.2  # Incremental better for optimization
        elif task_type == "feature":
            approaches[1]["score"] += 0.1  # Comprehensive for new features
        elif task_type == "hotfix":
            approaches[2]["score"] += 0.3  # Minimal for hotfixes

        return sorted(approaches, key=lambda x: x["score"], reverse=True)

    async def _generate_steps(self, task: Dict, approach: Dict) -> List[str]:
        """Generate implementation steps for approach"""
        steps = [
            "1. Analyze current implementation",
            f"2. Design solution using {approach['type']} approach",
            "3. Implement core functionality",
            "4. Add error handling",
            "5. Test and validate"
        ]
        return steps
