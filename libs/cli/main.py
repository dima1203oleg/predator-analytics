#!/usr/bin/env python3
"""
🛡️ Predator Analytics v25.0 CLI
Уніфікований інтерфейс командного рядка для управління системою
"""

import click
import httpx
import asyncio
from pathlib import Path
from typing import Optional
import json
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel

console = Console()


class PredatorClient:
    """HTTP клієнт для Predator API"""

    def __init__(self, base_url: str = "http://localhost:8090"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get(self, endpoint: str):
        """GET запит"""
        url = f"{self.base_url}{endpoint}"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()

    async def post(self, endpoint: str, data: dict = None, files: dict = None):
        """POST запит"""
        url = f"{self.base_url}{endpoint}"
        if files:
            response = await self.client.post(url, files=files)
        else:
            response = await self.client.post(url, json=data)
        response.raise_for_status()
        return response.json()

    async def close(self):
        await self.client.aclose()


@click.group()
@click.option('--api-url', default='http://localhost:8090', help='Predator API URL')
@click.pass_context
def cli(ctx, api_url):
    """🛡️ Predator Analytics CLI v25.0 - Командний центр управління"""
    ctx.ensure_object(dict)
    ctx.obj['API_URL'] = api_url
    ctx.obj['client'] = PredatorClient(api_url)


@cli.command()
@click.argument('filepath', type=click.Path(exists=True))
@click.option('--source-type', default='file', help='Тип джерела (file/api/stream)')
@click.option('--wait', is_flag=True, help='Очікувати завершення обробки')
@click.pass_context
def ingest(ctx, filepath, source_type, wait):
    """📥 Завантажити та обробити файл даних"""
    client = ctx.obj['client']

    async def run():
        file_path = Path(filepath)

        console.print(Panel(
            f"[bold cyan]Завантаження файлу:[/bold cyan] {file_path.name}\n"
            f"[dim]Розмір: {file_path.stat().st_size / 1024:.2f} KB[/dim]",
            title="📥 Data Ingestion"
        ))

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Завантаження...", total=None)

            with open(file_path, 'rb') as f:
                files = {'file': (file_path.name, f)}
                result = await client.post('/api/v25/data/ingest', files=files)

            job_id = result.get('job_id')
            progress.update(task, description=f"✅ Завантажено (Job ID: {job_id})")

        console.print(f"[green]✓[/green] Файл завантажено успішно!")
        console.print(f"[dim]Job ID: {job_id}[/dim]")

        if wait:
            console.print("\n⏳ Очікування завершення обробки...")
            await monitor_job(client, job_id)

        await client.close()

    asyncio.run(run())


@cli.command()
@click.option('--query', '-q', required=True, help='Пошуковий запит')
@click.option('--mode', default='hybrid', type=click.Choice(['semantic', 'keyword', 'hybrid']))
@click.option('--limit', default=10, help='Кількість результатів')
@click.pass_context
def search(ctx, query, mode, limit):
    """🔍 Семантичний пошук по даним"""
    client = ctx.obj['client']

    async def run():
        console.print(Panel(
            f"[bold cyan]Запит:[/bold cyan] {query}\n"
            f"[dim]Режим: {mode} | Ліміт: {limit}[/dim]",
            title="🔍 Semantic Search"
        ))

        with console.status("[bold green]Пошук..."):
            result = await client.post('/api/v1/search', {
                'query': query,
                'mode': mode,
                'limit': limit
            })

        results = result.get('results', [])

        if not results:
            console.print("[yellow]⚠ Результатів не знайдено[/yellow]")
            await client.close()
            return

        # Таблиця результатів
        table = Table(title=f"Знайдено {len(results)} результатів")
        table.add_column("№", style="cyan", width=4)
        table.add_column("Заголовок", style="white")
        table.add_column("Score", style="green", width=8)

        for idx, doc in enumerate(results, 1):
            title = doc.get('title', doc.get('content', '')[:50])
            score = doc.get('score', 0.0)
            table.add_row(str(idx), title, f"{score:.3f}")

        console.print(table)
        await client.close()

    asyncio.run(run())


@cli.command()
@click.pass_context
def status(ctx):
    """📊 Статус всіх сервісів та задач"""
    client = ctx.obj['client']

    async def run():
        console.print(Panel(
            "[bold cyan]Predator Analytics v25.0[/bold cyan]\n"
            "[dim]Системний статус[/dim]",
            title="📊 System Status"
        ))

        # Health check
        with console.status("[bold green]Перевірка сервісів..."):
            try:
                health = await client.get('/health')
                system_status = await client.get('/api/v25/status')
            except Exception as e:
                console.print(f"[red]✗ Помилка з'єднання: {e}[/red]")
                await client.close()
                return

        # Services table
        services_table = Table(title="Сервіси")
        services_table.add_column("Сервіс", style="cyan")
        services_table.add_column("Статус", style="white")

        services = health.get('services', {})
        for service_name, service_status in services.items():
            status_icon = "✓" if service_status == "healthy" else "✗"
            status_color = "green" if service_status == "healthy" else "red"
            services_table.add_row(
                service_name,
                f"[{status_color}]{status_icon} {service_status}[/{status_color}]"
            )

        console.print(services_table)

        # Jobs table
        jobs = system_status.get('jobs', {})
        if jobs:
            console.print("\n")
            jobs_table = Table(title="Активні задачі")
            jobs_table.add_column("Тип", style="cyan")
            jobs_table.add_column("Кількість", style="white")

            for job_type, count in jobs.items():
                jobs_table.add_row(job_type, str(count))

            console.print(jobs_table)

        await client.close()

    asyncio.run(run())


@cli.command()
@click.argument('dataset_id')
@click.option('--model-type', default='automl', type=click.Choice(['automl', 'anomaly', 'classification']))
@click.option('--sync', is_flag=True, help='Синхронне очікування результату')
@click.pass_context
def train(ctx, dataset_id, model_type, sync):
    """🤖 Запустити ML навчання на датасеті"""
    client = ctx.obj['client']

    async def run():
        console.print(Panel(
            f"[bold cyan]Dataset:[/bold cyan] {dataset_id}\n"
            f"[dim]Тип моделі: {model_type}[/dim]",
            title="🤖 ML Training"
        ))

        with console.status("[bold green]Запуск навчання..."):
            result = await client.post('/api/v25/ml-training/start', {
                'dataset_id': dataset_id,
                'model_type': model_type
            })

        job_id = result.get('job_id')
        console.print(f"[green]✓[/green] Навчання запущено!")
        console.print(f"[dim]Job ID: {job_id}[/dim]")

        if sync:
            console.print("\n⏳ Очікування завершення навчання...")
            await monitor_job(client, job_id)

        await client.close()

    asyncio.run(run())


@cli.command()
@click.pass_context
def agents(ctx):
    """🤖 Статус AI агентів"""
    client = ctx.obj['client']

    async def run():
        console.print(Panel(
            "[bold cyan]AI Agent Ecosystem[/bold cyan]",
            title="🤖 Agents"
        ))

        with console.status("[bold green]Завантаження статусу агентів..."):
            try:
                agents_data = await client.get('/api/v25/agents/status')
            except Exception as e:
                console.print(f"[red]✗ Помилка: {e}[/red]")
                await client.close()
                return

        table = Table(title="Активні агенти")
        table.add_column("Агент", style="cyan")
        table.add_column("Статус", style="white")
        table.add_column("Задач виконано", style="green")

        for agent in agents_data.get('agents', []):
            name = agent.get('name', 'Unknown')
            status = agent.get('status', 'idle')
            tasks_completed = agent.get('tasks_completed', 0)

            status_icon = "🟢" if status == "active" else "⚪"
            table.add_row(
                name,
                f"{status_icon} {status}",
                str(tasks_completed)
            )

        console.print(table)
        await client.close()

    asyncio.run(run())


@cli.command()
@click.argument('job_id')
@click.pass_context
def logs(ctx, job_id):
    """📋 Переглянути логи задачі"""
    client = ctx.obj['client']

    async def run():
        console.print(Panel(
            f"[bold cyan]Job ID:[/bold cyan] {job_id}",
            title="📋 Job Logs"
        ))

        with console.status("[bold green]Завантаження логів..."):
            logs_data = await client.get(f'/api/v25/jobs/{job_id}/logs')

        logs = logs_data.get('logs', [])

        for log_entry in logs:
            timestamp = log_entry.get('timestamp', '')
            level = log_entry.get('level', 'INFO')
            message = log_entry.get('message', '')

            color = {
                'ERROR': 'red',
                'WARNING': 'yellow',
                'INFO': 'white',
                'DEBUG': 'dim'
            }.get(level, 'white')

            console.print(f"[dim]{timestamp}[/dim] [{color}]{level}[/{color}] {message}")

        await client.close()

    asyncio.run(run())


async def monitor_job(client: PredatorClient, job_id: str):
    """Моніторинг виконання задачі"""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("Обробка...", total=None)

        while True:
            status_data = await client.get(f'/api/v25/jobs/{job_id}')
            status = status_data.get('status', 'unknown')

            progress.update(task, description=f"Статус: {status}")

            if status in ['completed', 'failed', 'succeeded']:
                break

            await asyncio.sleep(2)

        if status == 'failed':
            console.print(f"[red]✗ Задача завершилась з помилкою[/red]")
            error = status_data.get('error', 'Unknown error')
            console.print(f"[dim]{error}[/dim]")
        else:
            console.print(f"[green]✓ Задача виконана успішно![/green]")


if __name__ == '__main__':
    cli(obj={})
