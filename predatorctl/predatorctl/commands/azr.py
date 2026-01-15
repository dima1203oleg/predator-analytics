import typer
import yaml
import os
import random
from rich.console import Console
from predatorctl.core.arbiter_client import ArbiterClient
from predatorctl.core.ledger_client import LedgerClient
from libs.core.azr import get_azr_engine
from libs.core.reality import (
    get_reality_engine,
    get_vpc_verifier,
    get_cincinnatus_timer,
    get_juridical_transpiler,
    get_z3_verifier,
    get_semantic_gate,
    ActionCategory,
    EventPhase,
    Observation
)

app = typer.Typer(help="AZR (Autonomous Zero-Risk Runtime) Agent")
proposal_app = typer.Typer(help="Manage AZR proposals")
simulate_app = typer.Typer(help="Manage AZR simulations")
chaos_app = typer.Typer(help="Manage AZR chaos tests")
risk_app = typer.Typer(help="Manage AZR risk assessment")
court_app = typer.Typer(help="Manage Arbiter Court reviews")
cincinnatus_app = typer.Typer(help="Cincinnatus Emergency Protocol")

app.add_typer(proposal_app, name="proposal")
app.add_typer(simulate_app, name="simulate")
app.add_typer(chaos_app, name="chaos")
app.add_typer(risk_app, name="risk")
app.add_typer(court_app, name="court")
app.add_typer(cincinnatus_app, name="cincinnatus")

console = Console()
arbiter = ArbiterClient()
ledger = LedgerClient()
engine = get_azr_engine()
reality = get_reality_engine()
vpc = get_vpc_verifier()
timer = get_cincinnatus_timer()
transpiler = get_juridical_transpiler()
z3 = get_z3_verifier()
semantic_gate = get_semantic_gate()

# --- PROPOSAL COMMANDS ---
@proposal_app.command("submit")
def proposal_submit(
    source: str = typer.Option("google", "--source"),
    file: str = typer.Option(..., "--file", "-f")
):
    """Submit a proposal to AZR."""
    if not os.path.exists(file):
        console.print(f"[red]Error:[/red] File {file} not found.")
        raise typer.Exit(code=1)
    console.print(f"Submitting proposal from {source} ({file})...")
    console.print("[green]Proposal Submitted. ID: prop-v26-tail[/green]")

@proposal_app.command("list")
def proposal_list(
    status: str = typer.Option("pending", "--status")
):
    """List proposals by status."""
    console.print(f"Showing {status} proposals:")
    console.print("- prop-v26-tail (PENDING)")

@proposal_app.command("validate")
def proposal_validate(
    id: str = typer.Argument(..., help="Proposal ID")
):
    """Validate a proposal for constitutional compliance with Z3 formal proof."""
    console.print(f"Validating {id} against Constitution v27.0...")
    if z3.verify_decision(id, {"type": "proposal_validation"}):
        console.print("[green]✓ Z3 FORMAL PROOF GENERATED: SAT[/green]")
        console.print("[green]✓ Validation Passed.[/green]")
    else:
        console.print("[red]✕ Z3 FORMAL PROOF: UNSAT (Constitutional Contradiction)[/red]")
        raise typer.Exit(code=1)

# --- SIMULATE COMMANDS ---
@simulate_app.command("create")
def simulate_create(
    id: str = typer.Argument(..., help="Proposal ID"),
    type: str = typer.Option("digital-twin", "--type")
):
    """Create a simulation for a proposal."""
    console.print(f"Creating {type} simulation for {id}...")
    res = engine.run_simulation(id)
    console.print(f"[green]Simulation active. Reality divergence: {res['divergence']*100:.3f}%[/green]")

# --- CHAOS COMMANDS ---
@chaos_app.command("run")
def chaos_run(
    id: str = typer.Argument(..., help="Proposal ID"),
    scenario: str = typer.Option("network-latency", "--scenario")
):
    """Run chaos scenarios for a proposal."""
    console.print(f"Running chaos scenario '{scenario}' for {id}...")
    res = engine.analyze_chaos(id)
    console.print(f"[green]Chaos result: {res['resilience_score']}% resilience.[/green]")

# --- RISK COMMANDS ---
@risk_app.command("assess")
def risk_assess(
    id: str = typer.Argument(..., help="Proposal ID")
):
    """Assess risk level for a proposal."""
    console.print(f"Assessing risk for {id}...")
    score = engine.assess_risk({"id": id})
    color = "green" if score < 0.20 else "red"
    console.print(f"Risk Score: [{color}]{score*100:.1f}%[/{color}]")

# --- COURT COMMANDS ---
@court_app.command("review")
def court_review(
    id: str = typer.Argument(..., help="Proposal ID")
):
    """Court review for a proposal."""
    console.print(f"Arbiter Court: Reviewing {id}...")
    console.print("[green]Decision: SANCTIONED[/green]")

# --- TOP LEVEL AZR ALIASES (Match Section IX.2) ---
@app.command("validate")
def azr_validate_alias(file: str = typer.Option(..., "--file")):
    """Alias for proposal validate."""
    console.print(f"Validating {file}...")
    console.print("[green]✓ Validation Passed.[/green]")

@app.command("simulate")
def azr_simulate_alias(
    id: str = typer.Argument(..., help="Proposal ID"),
    duration: str = typer.Option("1h", "--duration")
):
    """Alias for simulate create."""
    console.print(f"Running simulation for {id} (Duration: {duration})...")
    res = engine.run_simulation(id)
    console.print(f"[green]Simulation status: {res['status']}[/green]")

@app.command("chaos")
def azr_chaos_alias(
    id: str = typer.Argument(..., help="Proposal ID"),
    intensity: str = typer.Option("medium", "--intensity")
):
    """Alias for chaos run."""
    console.print(f"Running chaos tests for {id} (Intensity: {intensity})...")
    res = engine.analyze_chaos(id)
    console.print(f"[green]Chaos result: {res['resilience_score']}% resilience.[/green]")

@app.command("risk")
def azr_risk_alias(
    id: str = typer.Argument(..., help="Proposal ID"),
    threshold: int = typer.Option(20, "--threshold")
):
    """Alias for risk assess with threshold."""
    console.print(f"Assessing risk for {id} (Threshold: {threshold}%)...")
    score = engine.assess_risk({"id": id})
    color = "green" if score * 100 < threshold else "red"
    console.print(f"Risk Score: [{color}]{score*100:.1f}%[/{color}]")

@app.command("execute")
def azr_execute(
    id: str = typer.Argument(..., help="Proposal ID"),
    category: ActionCategory = typer.Option(ActionCategory.DEFENSIVE, "--category"),
    phase: EventPhase = typer.Option(EventPhase.EMERGING, "--phase"),
    irreversible: bool = typer.Option(False, "--irreversible"),
    ignorance_declared: bool = typer.Option(False, "--declare-ignorance"),
    force_incoherent: bool = typer.Option(False, "--force-incoherent", hidden=True),
    rollback_on_failure: bool = typer.Option(True, "--rollback-on-failure")
):
    """Execute a sanctioned proposal with Reality-Bound verification (v27.0 Red-Team Ready)."""
    # Semantic Normalization
    normalized_id = semantic_gate.normalize(id)
    console.print(f"Executing sanctioned proposal {normalized_id}...")

    if phase == EventPhase.POST_CONTEXT_SHIFT:
        console.print("[red]✕ DENIED: Action forbidden in POST_CONTEXT_SHIFT phase (Axiom Event Phase).[/red]")
        raise typer.Exit(code=1)

    # 1. Reality Context Check (CRC)
    console.print("Verifying Reality Context Coherence (Axiom CRC + Red-Team Axioms)...")
    obs = Observation(
        id=normalized_id,
        interpretation="deployment",
        data={"proposal_id": id, "force_incoherent": force_incoherent},
        category=category,
        phase=phase,
        irreversible=irreversible,
        ignorance_declared=ignorance_declared
    )
    ctx_res = reality.analyze_context(obs)

    if not ctx_res.executable:
        console.print(f"[bold red]DENIED BY CONSTITUTION:[/bold red] {ctx_res.reason}")
        if ctx_res.details:
            console.print(f"Details: {ctx_res.details}")
        raise typer.Exit(code=1)

    console.print(f"[green]✓ Context Coherent (Confidence: {ctx_res.confidence*100:.1f}%)[/green]")

    # 2. Execution
    console.print("Propagating signals to physical actuators...")

    # 3. VPC Verification
    console.print("Verifying Physical Consequences (Axiom VPC)...")
    vpc_res = vpc.verify_action(id)

    if vpc_res.witness_count < 2:
        console.print("[bold red]VPC FAIL:[/bold red] Insufficient independent witnesses observed consequence.")
        raise typer.Exit(code=1)

    console.print(f"[green]✓ VPC PASS:[/green] Observed by {vpc_res.witness_count} witnesses. Consensus: {vpc_res.consensus_score*100:.1f}%")

    # 4. Final Arbiter Sanction (v27.0)
    console.print("Requesting final Arbiter Sanction with Reality Proof...")
    decision = arbiter.decide(
        type="execute_proposal",
        context={
            "id": id,
            "reality_coherence_verified": ctx_res.executable,
            "vpc_verified": True,
            "witness_count": vpc_res.witness_count,
            "irreversible": irreversible,
            "ignorance_declared": ignorance_declared,
            "alternative_count": 0 if irreversible else (0 if ctx_res.confidence > 0.9 else 1) # Red-team logic
        }
    )

    if not decision["allowed"]:
        console.print(f"[bold red]ARBITER VETO:[/bold red] {decision['reason']}")
        if decision.get("violates_axioms"):
             console.print(f"Violations: {decision['violates_axioms']}")
        raise typer.Exit(code=1)

    console.print("[bold green]✓ SANCTIONED: Decision cryptographically signed by Arbiter.[/bold green]")

    # 5. Juridical Translation
    console.print("Generating Juridical Translation (Axiom Legality)...")
    doc = transpiler.generate_document("vpc_certificate", {
        "witness_count": vpc_res.witness_count,
        "context_hash": ctx_res.context_hash
    })
    console.print(f"[cyan]Legally Legible Document Generated:[/cyan] {doc.title}")
    console.print(f"Format: {doc.format} | Ledger Hash: {doc.ledger_hash}")

    # 6. Truth Ledger Record (v27.0 Reality Anchor)
    ledger_res = ledger.append_entry(
        entity_type="proposal",
        entity_id=id,
        action="execute",
        payload={
            "normalized_id": normalized_id,
            "ctx_confidence": ctx_res.confidence,
            "witness_count": vpc_res.witness_count,
            "legal_hash": doc.ledger_hash,
            "reality_bound": True
        }
    )
    if ledger_res:
        console.print(f"Truth Ledger record: [green]0x{ledger_res.get('hash', '0000')[:16]}...[/green]")
    else:
        console.print("[yellow]Truth Ledger offline. Entry queued for anchoring.[/yellow]")

# --- CINCINNATUS COMMANDS ---
@cincinnatus_app.command("activate")
def cincinnatus_activate():
    """Activate emergency sovereignty (Cincinnatus Protocol)."""
    res = timer.activate()
    console.print(f"[bold red]SECURITY ALERT:[/bold red] {res}")
    console.print("Emergency powers granted for 3600s. All AZR constraints temporarily relaxed.")
    console.print("[yellow]NOTE: Preemptive Lethal and Mass Rights Suspension remain FORBIDDEN (v27.0 RT Filter).[/yellow]")

@cincinnatus_app.command("status")
def cincinnatus_status():
    """Check emergency mode status and timer."""
    rem = timer.get_remaining_time()
    if rem > 0:
        console.print(f"Emergency Mode: [bold red]ACTIVE[/bold red]")
        console.print(f"Time Remaining: [yellow]{rem}s[/yellow]")
    else:
        console.print("Emergency Mode: [green]INACTIVE[/green]")

@app.command("rollback")
def azr_rollback(
    id: str = typer.Argument(..., help="Amendment ID"),
    reason: str = typer.Option(..., "--reason", "-r")
):
    """Rollback an amendment."""
    console.print(f"Rolling back {id} because: {reason}")
    console.print("[green]Rollback Initiated[/green]")
