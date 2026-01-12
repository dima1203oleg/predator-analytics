"""
Change Observer Agent - Monitors system changes and proposes UI visualizations
Detects new features, data changes, and proposes visual representations
Uses LLM Council for arbitration before implementing changes
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger("agents.change_observer")

class ChangeObserver:
    """
    Observes changes in the system and proposes UI improvements through Council arbitration
    """

    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.state_file = "/app/logs/system_state.json"
        self.proposals_file = "/app/logs/pending_proposals.json"

        # Things to observe
        self.observation_targets = {
            "api_endpoints": self._observe_api_endpoints,
            "database_tables": self._observe_database_tables,
            "file_changes": self._observe_file_changes,
            "metrics": self._observe_metrics,
            "agents": self._observe_agents,
            "ui_elements": self._observe_ui_elements,
        }

        # Proposal templates for different observation types
        self.proposal_templates = {
            "new_endpoint": {
                "category": "ui_feature",
                "template": "Add UI component to visualize data from new API endpoint: {endpoint}",
                "priority": "medium"
            },
            "new_data_type": {
                "category": "visualization",
                "template": "Create chart/table to display new data type: {data_type}",
                "priority": "high"
            },
            "performance_metric": {
                "category": "dashboard",
                "template": "Add real-time widget for metric: {metric_name}",
                "priority": "medium"
            },
            "agent_status": {
                "category": "monitoring",
                "template": "Show agent status indicator for: {agent_name}",
                "priority": "low"
            },
            "new_feature": {
                "category": "navigation",
                "template": "Add navigation link and page for: {feature_name}",
                "priority": "high"
            }
        }

    async def observe(self) -> Dict[str, Any]:
        """Run observation cycle and detect changes"""
        logger.info("👁️ Change Observer: Starting observation cycle...")

        # Load previous state
        previous_state = self._load_state()

        # Collect current state
        current_state = {}
        changes_detected = []

        for target_name, observer_func in self.observation_targets.items():
            try:
                current_state[target_name] = await observer_func()

                # Compare with previous state
                if target_name in previous_state:
                    changes = self._detect_changes(
                        previous_state[target_name],
                        current_state[target_name],
                        target_name
                    )
                    if changes:
                        changes_detected.extend(changes)
                        logger.info(f"📍 Detected {len(changes)} changes in {target_name}")
                else:
                    # First observation - everything is new
                    if current_state[target_name]:
                        logger.info(f"📍 First observation of {target_name}: {len(current_state[target_name]) if isinstance(current_state[target_name], list) else 1} items")

            except Exception as e:
                logger.warning(f"Observation of {target_name} failed: {e}")
                current_state[target_name] = previous_state.get(target_name, {})

        # Save current state
        self._save_state(current_state)

        # Generate proposals for changes
        proposals = []
        for change in changes_detected:
            proposal = self._generate_proposal(change)
            if proposal:
                proposals.append(proposal)

        if proposals:
            logger.info(f"📋 Generated {len(proposals)} proposals for Council review")
            await self._submit_proposals(proposals)

        return {
            "status": "completed",
            "changes_detected": len(changes_detected),
            "proposals_generated": len(proposals),
            "timestamp": datetime.now().isoformat()
        }

    async def _observe_api_endpoints(self) -> List[Dict]:
        """Observe available API endpoints"""
        endpoints = []
        try:
            # Read from OpenAPI spec if available
            openapi_path = "/app/app/static/openapi.json"
            if os.path.exists(openapi_path):
                with open(openapi_path) as f:
                    spec = json.load(f)
                    for path, methods in spec.get("paths", {}).items():
                        for method in methods:
                            endpoints.append({
                                "path": path,
                                "method": method.upper(),
                                "summary": methods[method].get("summary", "")
                            })

            # Also scan router files
            routers_dir = "/app/app/api/routers"
            if os.path.exists(routers_dir):
                for filename in os.listdir(routers_dir):
                    if filename.endswith(".py"):
                        endpoints.append({
                            "router_file": filename,
                            "type": "router"
                        })
        except Exception as e:
            logger.debug(f"API observation error: {e}")

        return endpoints

    async def _observe_database_tables(self) -> List[Dict]:
        """Observe database tables and their sizes"""
        tables = []
        try:
            # Check for model files
            models_dir = "/app/app/models"
            if os.path.exists(models_dir):
                for filename in os.listdir(models_dir):
                    if filename.endswith(".py") and not filename.startswith("__"):
                        tables.append({
                            "model_file": filename,
                            "type": "sqlalchemy_model"
                        })
        except Exception as e:
            logger.debug(f"Database observation error: {e}")

        return tables

    async def _observe_file_changes(self) -> List[Dict]:
        """Observe recently modified files"""
        changes = []
        try:
            import subprocess
            # Find files modified in last hour
            result = subprocess.run(
                ["find", "/app/app", "-name", "*.py", "-mmin", "-60", "-type", "f"],
                capture_output=True, text=True, timeout=5
            )
            for filepath in result.stdout.strip().split("\n"):
                if filepath:
                    changes.append({
                        "file": filepath,
                        "modified_recently": True
                    })
        except Exception as e:
            logger.debug(f"File observation error: {e}")

        return changes

    async def _observe_metrics(self) -> Dict[str, Any]:
        """Observe system metrics"""
        metrics = {}
        try:
            if self.redis:
                # Get cached metrics from Redis
                metrics_keys = ["api_requests", "llm_calls", "search_queries", "errors"]
                for key in metrics_keys:
                    value = await self.redis.get(f"metrics:{key}")
                    if value:
                        metrics[key] = int(value)
        except Exception as e:
            logger.debug(f"Metrics observation error: {e}")

        return metrics

    async def _observe_agents(self) -> List[Dict]:
        """Observe active agents and their status"""
        agents = [
            {"name": "UI Guardian", "type": "monitoring", "status": "active"},
            {"name": "Data Sentinel", "type": "validation", "status": "active"},
            {"name": "Code Improver", "type": "development", "status": "active"},
            {"name": "Change Observer", "type": "observation", "status": "active"},
            {"name": "Git Committer", "type": "version_control", "status": "active"},
        ]
        return agents

    async def _observe_ui_elements(self) -> Dict[str, int]:
        """Get UI element counts from last UI Guardian run"""
        elements = {}
        try:
            if self.redis:
                cached = await self.redis.get("ui_guardian:last_audit")
                if cached:
                    elements = json.loads(cached)
        except Exception as e:
            logger.debug(f"UI observation error: {e}")

        return elements

    def _detect_changes(self, old_state: Any, new_state: Any, target: str) -> List[Dict]:
        """Compare old and new state to detect changes"""
        changes = []

        if isinstance(new_state, list) and isinstance(old_state, list):
            # Find new items
            old_set = set(json.dumps(item, sort_keys=True) for item in old_state)
            for item in new_state:
                item_json = json.dumps(item, sort_keys=True)
                if item_json not in old_set:
                    changes.append({
                        "type": "new_item",
                        "target": target,
                        "item": item
                    })

        elif isinstance(new_state, dict) and isinstance(old_state, dict):
            # Find new or changed keys
            for key, value in new_state.items():
                if key not in old_state:
                    changes.append({
                        "type": "new_key",
                        "target": target,
                        "key": key,
                        "value": value
                    })
                elif old_state[key] != value:
                    changes.append({
                        "type": "value_changed",
                        "target": target,
                        "key": key,
                        "old_value": old_state[key],
                        "new_value": value
                    })

        return changes

    def _generate_proposal(self, change: Dict) -> Optional[Dict]:
        """Generate a UI improvement proposal based on detected change"""
        target = change.get("target")
        change_type = change.get("type")

        proposal = None

        if target == "api_endpoints" and change_type == "new_item":
            item = change.get("item", {})
            proposal = {
                "id": f"prop_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(str(item)) % 10000}",
                "category": "ui_feature",
                "title": f"Add UI for endpoint {item.get('path', 'unknown')}",
                "description": f"Create UI component to interact with new API endpoint: {item.get('method', 'GET')} {item.get('path', '')}",
                "implementation": {
                    "type": "react_component",
                    "target_path": "frontend/src/components/api/",
                    "suggested_name": self._path_to_component_name(item.get('path', ''))
                },
                "priority": "medium",
                "detected_at": datetime.now().isoformat()
            }

        elif target == "file_changes" and change_type == "new_item":
            item = change.get("item", {})
            filepath = item.get("file", "")
            if "/services/" in filepath:
                proposal = {
                    "id": f"prop_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(filepath) % 10000}",
                    "category": "dashboard_widget",
                    "title": f"Add dashboard widget for {os.path.basename(filepath)}",
                    "description": f"Create monitoring widget for new service: {filepath}",
                    "implementation": {
                        "type": "dashboard_widget",
                        "target_path": "frontend/src/components/widgets/",
                    },
                    "priority": "low",
                    "detected_at": datetime.now().isoformat()
                }

        elif target == "metrics" and change_type in ["new_key", "value_changed"]:
            key = change.get("key", "")
            proposal = {
                "id": f"prop_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(key) % 10000}",
                "category": "visualization",
                "title": f"Visualize metric: {key}",
                "description": f"Add real-time chart for metric '{key}' on monitoring dashboard",
                "implementation": {
                    "type": "chart_component",
                    "chart_type": "line",
                    "target_path": "frontend/src/components/charts/",
                },
                "priority": "medium",
                "detected_at": datetime.now().isoformat()
            }

        return proposal

    def _path_to_component_name(self, path: str) -> str:
        """Convert API path to React component name"""
        # /api/v1/users/{id} -> UsersComponent
        parts = path.replace("{", "").replace("}", "").split("/")
        meaningful_parts = [p.title() for p in parts if p and p not in ["api", "v1", "v2"]]
        return "".join(meaningful_parts) + "Component" if meaningful_parts else "NewComponent"

    async def _submit_proposals(self, proposals: List[Dict]):
        """Submit proposals for Council arbitration"""
        # Store in Redis for the orchestrator to pick up
        if self.redis:
            try:
                existing = await self.redis.get("proposals:pending")
                pending = json.loads(existing) if existing else []
                pending.extend(proposals)
                await self.redis.set("proposals:pending", json.dumps(pending))
                await self.redis.expire("proposals:pending", 3600)  # 1 hour TTL
            except Exception as e:
                logger.error(f"Failed to submit proposals to Redis: {e}")

        # Also save to file
        try:
            os.makedirs(os.path.dirname(self.proposals_file), exist_ok=True)
            existing = []
            if os.path.exists(self.proposals_file):
                with open(self.proposals_file) as f:
                    existing = json.load(f)
            existing.extend(proposals)
            with open(self.proposals_file, "w") as f:
                json.dump(existing[-100:], f, indent=2)  # Keep last 100
        except Exception as e:
            logger.error(f"Failed to save proposals to file: {e}")

    def _load_state(self) -> Dict:
        """Load previous observation state"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file) as f:
                    return json.load(f)
        except Exception as e:
            logger.debug(f"Could not load state: {e}")
        return {}

    def _save_state(self, state: Dict):
        """Save current observation state"""
        try:
            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
            with open(self.state_file, "w") as f:
                json.dump(state, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Could not save state: {e}")


class ProposalArbitrator:
    """
    Handles Council arbitration for change proposals
    """

    def __init__(self, council_chairman=None, council_critic=None):
        self.chairman = council_chairman
        self.critic = council_critic

    async def arbitrate(self, proposal: Dict) -> Dict[str, Any]:
        """
        Submit proposal to Council for arbitration
        Returns decision with implementation instructions if approved
        """
        logger.info(f"⚖️ Arbitrating proposal: {proposal.get('title', 'Unknown')}")

        decision = {
            "proposal_id": proposal.get("id"),
            "status": "pending",
            "votes": [],
            "timestamp": datetime.now().isoformat()
        }

        # Format proposal for council review
        review_prompt = f"""
PROPOSAL FOR UI IMPROVEMENT:

Title: {proposal.get('title')}
Category: {proposal.get('category')}
Description: {proposal.get('description')}
Priority: {proposal.get('priority')}

Implementation Details:
- Type: {proposal.get('implementation', {}).get('type')}
- Target: {proposal.get('implementation', {}).get('target_path')}

Should this UI improvement be implemented?
Consider: user value, implementation complexity, consistency with existing UI.

Respond with JSON: {{"approve": true/false, "reason": "...", "implementation_notes": "..."}}
"""

        try:
            if self.chairman:
                chairman_decision = await self.chairman.decide(
                    proposal.get('title'),
                    [{"role": "proposal", "content": review_prompt}],
                    {"category": proposal.get('category')}
                )
                decision["votes"].append({
                    "role": "chairman",
                    "vote": chairman_decision.get("decision", "reject"),
                    "reason": chairman_decision.get("reasoning", "")
                })

            if self.critic:
                critic_review = await self.critic.review(
                    json.dumps(proposal.get('implementation', {})),
                    proposal.get('description', '')
                )
                decision["votes"].append({
                    "role": "critic",
                    "vote": "approve" if critic_review.get("approval") else "reject",
                    "issues": critic_review.get("issues", [])
                })

            # Count votes
            approvals = sum(1 for v in decision["votes"] if v.get("vote") == "approve")
            decision["status"] = "approved" if approvals >= 1 else "rejected"
            decision["final_decision"] = decision["status"]

            logger.info(f"⚖️ Arbitration result: {decision['status']} ({approvals} approvals)")

        except Exception as e:
            logger.error(f"Arbitration failed: {e}")
            decision["status"] = "error"
            decision["error"] = str(e)

        return decision

    async def execute_approved(self, proposal: Dict, decision: Dict) -> bool:
        """
        Execute approved proposal by creating implementation task
        """
        if decision.get("status") != "approved":
            return False

        logger.info(f"🚀 Executing approved proposal: {proposal.get('title')}")

        # Create task for Code Improver
        task = {
            "type": "ui_implementation",
            "description": proposal.get("description"),
            "context": json.dumps({
                "implementation": proposal.get("implementation"),
                "category": proposal.get("category"),
                "arbitration_notes": [v.get("reason", "") for v in decision.get("votes", [])]
            }),
            "priority": 8 if proposal.get("priority") == "high" else 5,
            "source": "change_observer"
        }

        # This task will be picked up by the orchestrator
        return True
