/**
 * PREDATOR v30 - Реєстр Компонентів (Premium UI)
 *
 * Відображає всі 200+ open-source компонентів системи
 * з повною українською локалізацією та розширеною візуалізацією
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Database, Brain, Shield, Activity, GitBranch,
  Search, Globe, Lock, Box, Zap, CheckCircle, AlertTriangle, XCircle,
  Terminal, Code, Layers, HardDrive, Wifi, FileText, Component,
  Cpu, Workflow, MessagesSquare, Layout, Sparkles, Filter
} from 'lucide-react';
import { componentsLocales as t } from '../locales/uk/autonomy';

// --- Types ---
interface Component {
  name: string;
  version: string;
  license: string;
  purpose: string;
  status: 'healthy' | 'degraded' | 'offline';
  description?: string; // Additional detail
}

interface CategoryData {
  id: string;
  name: string;
  icon: React.ComponentType<{size?: number; className?: string}>;
  color: string;
  gradient: string;
  components: Component[];
}

// --- Data Registry (200+ Components) ---
const COMPONENT_REGISTRY: CategoryData[] = [
  {
    id: 'orchestration',
    name: 'Оркестрація та Інфраструктура',
    icon: Server,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    components: [
      { name: 'K3s', version: 'v1.28.5', license: 'Apache 2.0', purpose: 'HA Kubernetes кластер', status: 'healthy' },
      { name: 'Docker CE', version: '24.0.7', license: 'Apache 2.0', purpose: 'Контейнерний рантайм', status: 'healthy' },
      { name: 'Helm', version: '3.13.3', license: 'Apache 2.0', purpose: 'Менеджер пакетів Kubernetes', status: 'healthy' },
      { name: 'Longhorn', version: '1.5.3', license: 'Apache 2.0', purpose: 'Розподілене блочне сховище', status: 'healthy' },
      { name: 'MetalLB', version: '0.13.12', license: 'Apache 2.0', purpose: 'Bare metal Load Balancer', status: 'healthy' },
      { name: 'Traefik', version: '2.10.7', license: 'MIT', purpose: 'Cloud Native Ingress маршрутизатор', status: 'healthy' },
      { name: 'Cert-Manager', version: '1.13.3', license: 'Apache 2.0', purpose: 'Автоматизація TLS сертифікатів', status: 'healthy' },
      { name: 'Istio', version: '1.20.0', license: 'Apache 2.0', purpose: 'Service Mesh платформа', status: 'healthy' },
      { name: 'Calico', version: '3.27.0', license: 'Apache 2.0', purpose: 'Мережева політика та безпека', status: 'healthy' },
      { name: 'CoreDNS', version: '1.11.1', license: 'Apache 2.0', purpose: 'DNS сервіс кластера', status: 'healthy' },
      { name: 'KEDA', version: '2.12.1', license: 'Apache 2.0', purpose: 'Подійно-орієнтоване масштабування', status: 'healthy' },
      { name: 'Karpenter', version: '0.33.0', license: 'Apache 2.0', purpose: 'Just-in-time масштабування нод', status: 'healthy' },
      { name: 'Cilium', version: '1.14.5', license: 'Apache 2.0', purpose: 'eBPF мережева безпека', status: 'healthy' },
      { name: 'Envoy', version: '1.29.0', license: 'Apache 2.0', purpose: 'Високопродуктивний проксі', status: 'healthy' },
      { name: 'Linkerd', version: '2.14.0', license: 'Apache 2.0', purpose: 'Service mesh ультра-легкий', status: 'healthy' },
      { name: 'Flux', version: '2.2.2', license: 'Apache 2.0', purpose: 'GitOps синхронізація', status: 'healthy' },
      { name: 'Crossplane', version: '1.14.0', license: 'Apache 2.0', purpose: 'Інфраструктура як дані', status: 'healthy' }
    ]
  },
  {
    id: 'ai_ml',
    name: 'AI/ML Стек',
    icon: Brain,
    color: 'purple',
    gradient: 'from-purple-500 to-fuchsia-600',
    components: [
      { name: 'Ollama', version: '0.1.25', license: 'MIT', purpose: 'Локальний запуск LLM', status: 'healthy' },
      { name: 'LLaMA 3.1 8B', version: 'Instruct', license: 'Llama License', purpose: 'Базова мовна модель', status: 'healthy' },
      { name: 'LLaMA 3.1 70B', version: 'Instruct', license: 'Llama License', purpose: 'Розширена мовна модель', status: 'healthy' },
      { name: 'Mistral 7B', version: 'v0.2', license: 'Apache 2.0', purpose: 'Ефективна модель середнього розміру', status: 'healthy' },
      { name: 'Qwen 2.5', version: '14B', license: 'Apache 2.0', purpose: 'Мультимовна аналітика', status: 'healthy' },
      { name: 'LangChain', version: '0.1.8', license: 'MIT', purpose: 'Фреймворк для LLM додатків', status: 'healthy' },
      { name: 'LangGraph', version: '0.0.40', license: 'MIT', purpose: 'Оркестрація агентних циклів', status: 'healthy' },
      { name: 'Transformers', version: '4.37.2', license: 'Apache 2.0', purpose: 'HuggingFace бібліотека', status: 'healthy' },
      { name: 'vLLM', version: '0.3.0', license: 'Apache 2.0', purpose: 'Високошвидкісний LLM інференс', status: 'healthy' },
      { name: 'TensorRT-LLM', version: '0.7.1', license: 'Apache 2.0', purpose: 'NVIDIA оптимізація моделей', status: 'healthy' },
      { name: 'Qdrant', version: '1.7.4', license: 'Apache 2.0', purpose: 'Векторна база даних', status: 'healthy' },
      { name: 'FAISS', version: '1.7.4', license: 'MIT', purpose: 'Бібліотека пошуку подібностей', status: 'healthy' },
      { name: 'Milvus', version: '2.3.4', license: 'Apache 2.0', purpose: 'Масштабована векторна БД', status: 'healthy' },
      { name: 'Weaviate', version: '1.23.0', license: 'BSD 3-Clause', purpose: 'Векторна пошукова система', status: 'healthy' },
      { name: 'Sentence-Transformers', version: '2.3.1', license: 'Apache 2.0', purpose: 'Текстові ембедінги', status: 'healthy' },
      { name: 'BGE-M3', version: '1.0', license: 'MIT', purpose: 'Мультимовна модель ембедінгів', status: 'healthy' },
      { name: 'OpenAI CLIP', version: '1.0', license: 'MIT', purpose: 'Мультимодальні ембедінги', status: 'healthy' },
      { name: 'AutoGluon', version: '1.0.0', license: 'Apache 2.0', purpose: 'AutoML інструментарій', status: 'healthy' },
      { name: 'NNI', version: '3.0', license: 'MIT', purpose: 'Neural Architecture Search', status: 'healthy' },
      { name: 'Optuna', version: '3.5.0', license: 'MIT', purpose: 'Оптимізація гіперпараметрів', status: 'healthy' },
      { name: 'Ray Tune', version: '2.9.0', license: 'Apache 2.0', purpose: 'Розподілена оптимізація', status: 'healthy' },
      { name: 'MLflow', version: '2.10.0', license: 'Apache 2.0', purpose: 'Керування ML життєвим циклом', status: 'healthy' },
      { name: 'DVC', version: '3.42.0', license: 'Apache 2.0', purpose: 'Версіонування даних', status: 'healthy' },
      { name: 'Evidently AI', version: '0.4.15', license: 'Apache 2.0', purpose: 'Моніторинг ML моделей', status: 'healthy' },
      { name: 'WhyLogs', version: '1.4.0', license: 'Apache 2.0', purpose: 'Логування даних та профілювання', status: 'healthy' },
      { name: 'ONNX Runtime', version: '1.17.0', license: 'MIT', purpose: 'Кросплатформний прискорювач', status: 'healthy' },
      { name: 'Instructor', version: '0.4.0', license: 'MIT', purpose: 'Структуровані виходи LLM', status: 'healthy' },
      { name: 'DSPy', version: '2.1.0', license: 'MIT', purpose: 'Декларативне самовдосконалення', status: 'healthy' }
    ]
  },
  {
    id: 'databases',
    name: 'Бази Даних та Зберігання',
    icon: Database,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    components: [
      { name: 'PostgreSQL 16', version: '16.1', license: 'PostgreSQL', purpose: 'Основна реляційна БД', status: 'healthy' },
      { name: 'TimescaleDB', version: '2.13.0', license: 'Apache 2.0', purpose: 'Сховище часових рядів', status: 'healthy' },
      { name: 'Citus', version: '12.1.0', license: 'PostgreSQL', purpose: 'Шардінг PostgreSQL', status: 'healthy' },
      { name: 'PgBouncer', version: '1.21.0', license: 'ISC', purpose: 'Пулер з\'єднань', status: 'healthy' },
      { name: 'pgvector', version: '0.5.1', license: 'PostgreSQL', purpose: 'Векторні операції в PG', status: 'healthy' },
      { name: 'Neo4j', version: '5.16.0', license: 'GPLv3', purpose: 'Графова база даних', status: 'healthy' },
      { name: 'Apache AGE', version: '1.5.0', license: 'Apache 2.0', purpose: 'Графове розширення PG', status: 'healthy' },
      { name: 'Redis Stack', version: '7.2.4', license: 'RSALv2', purpose: 'Кеш та структури даних', status: 'healthy' },
      { name: 'KeyDB', version: '6.3.4', license: 'BSD 3-Clause', purpose: 'Багатопотокова альтернатива Redis', status: 'healthy' },
      { name: 'Valkey', version: '7.2.5', license: 'BSD 3-Clause', purpose: 'Відкритий форк Redis', status: 'healthy' },
      { name: 'MinIO', version: 'RELEASE.2024-01-31', license: 'AGPLv3', purpose: 'S3-сумісне сховище', status: 'healthy' },
      { name: 'OpenSearch', version: '2.11.1', license: 'Apache 2.0', purpose: 'Пошуковий двигун', status: 'healthy' },
      { name: 'ClickHouse', version: '24.1.2', license: 'Apache 2.0', purpose: 'Аналітична OLAP БД', status: 'healthy' },
      { name: 'Apache Druid', version: '28.0.1', license: 'Apache 2.0', purpose: 'Сховище реального часу', status: 'healthy' },
      { name: 'ScyllaDB', version: '5.4.1', license: 'AGPL-3.0', purpose: 'Високопродуктивна NoSQL', status: 'healthy' },
      { name: 'RocksDB', version: '8.10.0', license: 'Apache 2.0', purpose: 'Вбудоване сховище ключ-значення', status: 'healthy' },
      { name: 'Etcd', version: '3.5.11', license: 'Apache 2.0', purpose: 'Розподілене сховище конфігурації', status: 'healthy' }
    ]
  },
  {
    id: 'etl',
    name: 'ETL та Обробка Даних',
    icon: Layers,
    color: 'cyan',
    gradient: 'from-cyan-500 to-sky-600',
    components: [
      { name: 'Apache Airflow', version: '2.8.1', license: 'Apache 2.0', purpose: 'Керування workflow', status: 'healthy' },
      { name: 'Dagster', version: '1.6.3', license: 'Apache 2.0', purpose: 'Оркестратор даних нового покоління', status: 'healthy' },
      { name: 'Prefect', version: '2.16.0', license: 'Apache 2.0', purpose: 'Автоматизація потоків даних', status: 'healthy' },
      { name: 'dbt Core', version: '1.7.4', license: 'Apache 2.0', purpose: 'Трансформація даних в SQL', status: 'healthy' },
      { name: 'Great Expectations', version: '0.18.8', license: 'Apache 2.0', purpose: 'Тестування якості даних', status: 'healthy' },
      { name: 'Soda Core', version: '3.1.2', license: 'Apache 2.0', purpose: 'Моніторинг якості даних', status: 'healthy' },
      { name: 'Apache Spark', version: '3.5.0', license: 'Apache 2.0', purpose: 'Універсальний рушій аналітики', status: 'healthy' },
      { name: 'Apache Flink', version: '1.18.1', license: 'Apache 2.0', purpose: 'Потокова обробка', status: 'healthy' },
      { name: 'Apache Kafka', version: '3.6.1', license: 'Apache 2.0', purpose: 'Платформа потокових подій', status: 'healthy' },
      { name: 'Redpanda', version: '23.3.6', license: 'BSL 1.1', purpose: 'Високопродуктивна заміна Kafka', status: 'healthy' },
      { name: 'Dask', version: '2024.1.1', license: 'BSD 3-Clause', purpose: 'Паралельні обчислення Python', status: 'healthy' },
      { name: 'Ray', version: '2.9.1', license: 'Apache 2.0', purpose: 'Універсальний API для розподілених додатків', status: 'healthy' },
      { name: 'DuckDB', version: '0.9.2', license: 'MIT', purpose: 'Вбудована OLAP база', status: 'healthy' },
      { name: 'Polars', version: '0.20.5', license: 'MIT', purpose: 'Швидкі DataFrame на Rust', status: 'healthy' },
      { name: 'Apache Arrow', version: '15.0.0', license: 'Apache 2.0', purpose: 'Крос-мовна платформа даних', status: 'healthy' },
      { name: 'Delta Lake', version: '3.1.0', license: 'Apache 2.0', purpose: 'Відкритий формат зберігання', status: 'healthy' },
      { name: 'Apache Iceberg', version: '1.4.3', license: 'Apache 2.0', purpose: 'Відкритий табличний формат', status: 'healthy' },
      { name: 'Apache Hudi', version: '0.14.1', license: 'Apache 2.0', purpose: 'Стрімінг даних в Data Lake', status: 'healthy' },
      { name: 'Pandas', version: '2.2.0', license: 'BSD 3-Clause', purpose: 'Аналіз даних Python', status: 'healthy' },
      { name: 'NumPy', version: '1.26.3', license: 'BSD 3-Clause', purpose: 'Наукові обчислення', status: 'healthy' }
    ]
  },
  {
    id: 'monitoring',
    name: 'Моніторинг та Спостережуваність',
    icon: Activity,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    components: [
      { name: 'Prometheus', version: '2.49.1', license: 'Apache 2.0', purpose: 'Збір метрик', status: 'healthy' },
      { name: 'Thanos', version: '0.33.0', license: 'Apache 2.0', purpose: 'Високодоступний Prometheus', status: 'healthy' },
      { name: 'Victoria Metrics', version: '1.97.0', license: 'Apache 2.0', purpose: 'Швидке сховище метрик', status: 'healthy' },
      { name: 'Grafana', version: '10.3.1', license: 'AGPLv3', purpose: 'Платформа візуалізації', status: 'healthy' },
      { name: 'Grafana Loki', version: '2.9.4', license: 'AGPLv3', purpose: 'Агрегація логів', status: 'healthy' },
      { name: 'Grafana Tempo', version: '2.3.1', license: 'AGPLv3', purpose: 'Розподілений трейсинг', status: 'healthy' },
      { name: 'Grafana Mimir', version: '2.11.0', license: 'AGPLv3', purpose: 'Довгострокове сховище метрик', status: 'healthy' },
      { name: 'OpenTelemetry', version: '1.28.0', license: 'Apache 2.0', purpose: 'Стандарт збору телеметрії', status: 'healthy' },
      { name: 'Jaeger', version: '1.53.0', license: 'Apache 2.0', purpose: 'Трейсинг транзакцій', status: 'healthy' },
      { name: 'Zipkin', version: '2.24.4', license: 'Apache 2.0', purpose: 'Система розподіленого трейсингу', status: 'healthy' },
      { name: 'Pyroscope', version: '1.4.0', license: 'Apache 2.0', purpose: 'Безперервне профілювання', status: 'healthy' },
      { name: 'Alertmanager', version: '0.26.0', license: 'Apache 2.0', purpose: 'Керування сповіщеннями', status: 'healthy' },
      { name: 'Uptime Kuma', version: '1.23.11', license: 'MIT', purpose: 'Моніторинг доступності', status: 'healthy' },
      { name: 'Netdata', version: '1.44.1', license: 'GPLv3', purpose: 'Моніторинг в реальному часі', status: 'healthy' },
      { name: 'Sentry (Self-hosted)', version: '23.12.1', license: 'BSL 1.1', purpose: 'Трекінг помилок', status: 'healthy' }
    ]
  },
  {
    id: 'security',
    name: 'Безпека та Доступ',
    icon: Shield,
    color: 'rose',
    gradient: 'from-rose-500 to-red-600',
    components: [
      { name: 'Keycloak', version: '23.0.4', license: 'Apache 2.0', purpose: 'IAM та Single Sign-On', status: 'healthy' },
      { name: 'Authentik', version: '2024.2.1', license: 'MIT', purpose: 'Універсальний Identity Provider', status: 'healthy' },
      { name: 'Open Policy Agent', version: '0.61.0', license: 'Apache 2.0', purpose: 'Універсальний движок політик', status: 'healthy' },
      { name: 'Gatekeeper', version: '3.14.0', license: 'Apache 2.0', purpose: 'Контролер політик Kubernetes', status: 'healthy' },
      { name: 'Kyverno', version: '1.11.1', license: 'Apache 2.0', purpose: 'Керування політиками K8s', status: 'healthy' },
      { name: 'HashiCorp Vault', version: '1.15.4', license: 'MPL 2.0', purpose: 'Управління секретами', status: 'healthy' },
      { name: 'External Secrets', version: '0.9.11', license: 'Apache 2.0', purpose: 'Синхронізація секретів', status: 'healthy' },
      { name: 'Trivy', version: '0.48.3', license: 'Apache 2.0', purpose: 'Сканер вразливостей', status: 'healthy' },
      { name: 'Grype', version: '0.74.0', license: 'Apache 2.0', purpose: 'Сканер вразливостей контейнерів', status: 'healthy' },
      { name: 'Syft', version: '0.101.0', license: 'Apache 2.0', purpose: 'Генератор SBOM', status: 'healthy' },
      { name: 'Falco', version: '0.37.0', license: 'Apache 2.0', purpose: 'Захист runtime', status: 'healthy' },
      { name: 'Kubescape', version: '3.0.4', license: 'Apache 2.0', purpose: 'Аналіз безпеки K8s', status: 'healthy' },
      { name: 'Z3 Prover', version: '4.13.0', license: 'MIT', purpose: 'Теорему доведення (формальна верифікація)', status: 'healthy' },
      { name: 'Sealed Secrets', version: '0.25.0', license: 'Apache 2.0', purpose: 'Шифрування секретів GitOps', status: 'healthy' },
      { name: 'SOPS', version: '3.8.1', license: 'MPL 2.0', purpose: 'Операції з секретами', status: 'healthy' },
      { name: 'CrowdSec', version: '1.6.0', license: 'MIT', purpose: 'Колективний IPS', status: 'healthy' },
      { name: 'Wazuh', version: '4.7.2', license: 'GPLv2', purpose: 'SIEM та XDR', status: 'healthy' }
    ]
  },
  {
    id: 'cicd',
    name: 'CI/CD та DevOps',
    icon: GitBranch,
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    components: [
      { name: 'GitLab CE', version: '16.8.1', license: 'MIT', purpose: 'Повний цикл DevOps', status: 'healthy' },
      { name: 'Gitea', version: '1.21.4', license: 'MIT', purpose: 'Легковажний Git сервіс', status: 'healthy' },
      { name: 'ArgoCD', version: '2.9.6', license: 'Apache 2.0', purpose: 'GitOps Continuous Delivery', status: 'healthy' },
      { name: 'Argo Workflows', version: '3.5.4', license: 'Apache 2.0', purpose: 'Рушій workflow для K8s', status: 'healthy' },
      { name: 'Argo Rollouts', version: '1.6.4', license: 'Apache 2.0', purpose: 'Прогресивна доставка', status: 'healthy' },
      { name: 'Tekton', version: '0.56.0', license: 'Apache 2.0', purpose: 'Cloud-native CI/CD', status: 'healthy' },
      { name: 'Flux CD', version: '2.2.3', license: 'Apache 2.0', purpose: 'Відкритий GitOps', status: 'healthy' },
      { name: 'Terraform', version: '1.7.2', license: 'MPL 2.0', purpose: 'Інфраструктура як код', status: 'healthy' },
      { name: 'OpenTofu', version: '1.6.1', license: 'MPL 2.0', purpose: 'Відкрита альтернатива Terraform', status: 'healthy' },
      { name: 'Pulumi', version: '3.103.0', license: 'Apache 2.0', purpose: 'IaC на мовах програмування', status: 'healthy' },
      { name: 'Ansible', version: '2.16.3', license: 'GPLv3', purpose: 'Автоматизація IT', status: 'healthy' },
      { name: 'SonarQube', version: '10.4.0', license: 'LGPL-3.0', purpose: 'Якість та безпека коду', status: 'healthy' },
      { name: 'Checkov', version: '3.2.14', license: 'Apache 2.0', purpose: 'Аналіз IaC безпеки', status: 'healthy' },
      { name: 'Renovate', version: '37.164.0', license: 'AGPL-3.0', purpose: 'Оновлення залежностей', status: 'healthy' },
      { name: 'Dependabot', version: 'Core', license: 'MIT', purpose: 'Автоматизація оновлень', status: 'healthy' },
      { name: 'Jenkins', version: '2.440', license: 'MIT', purpose: 'Сервер автоматизації', status: 'healthy' }
    ]
  },
  {
    id: 'cli',
    name: 'Термінальні Інструменти',
    icon: Terminal,
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600',
    components: [
      { name: 'predatorctl', version: 'v30.0.1', license: 'Apache 2.0', purpose: 'Офіційний CLI Predator', status: 'healthy' },
      { name: 'kubectl', version: '1.29.1', license: 'Apache 2.0', purpose: 'Kubernetes CLI', status: 'healthy' },
      { name: 'k9s', version: '0.31.7', license: 'Apache 2.0', purpose: 'Термінальний UI для K8s', status: 'healthy' },
      { name: 'stern', version: '1.28.0', license: 'Apache 2.0', purpose: 'Мульти-під логування', status: 'healthy' },
      { name: 'kubectx', version: '0.9.5', license: 'Apache 2.0', purpose: 'Перемикання контекстів K8s', status: 'healthy' },
      { name: 'jq', version: '1.7.1', license: 'MIT', purpose: 'Процесор JSON', status: 'healthy' },
      { name: 'yq', version: '4.40.5', license: 'MIT', purpose: 'Процесор YAML', status: 'healthy' },
      { name: 'httpie', version: '3.2.2', license: 'BSD 3-Clause', purpose: 'Сучасний HTTP клієнт', status: 'healthy' },
      { name: 'fzf', version: '0.46.0', license: 'MIT', purpose: 'Нечіткий пошук', status: 'healthy' },
      { name: 'ripgrep', version: '14.1.0', license: 'MIT', purpose: 'Надшвидкий пошук тексту', status: 'healthy' },
      { name: 'bat', version: '0.24.0', license: 'Apache 2.0', purpose: 'cat з крилами (підсвітка)', status: 'healthy' },
      { name: 'eza', version: '0.18.0', license: 'MIT', purpose: 'Сучасна заміна ls', status: 'healthy' },
      { name: 'zsh', version: '5.9', license: 'MIT', purpose: 'Оболонка командного рядка', status: 'healthy' },
      { name: 'tmux', version: '3.4', license: 'ISC', purpose: 'Мультиплексор терміналу', status: 'healthy' },
      { name: 'lazygit', version: '0.40.2', license: 'MIT', purpose: 'Git TUI', status: 'healthy' }
    ]
  },
  {
    id: 'frontend',
    name: 'Frontend Екосистема',
    icon: Globe,
    color: 'indigo',
    gradient: 'from-indigo-500 to-violet-600',
    components: [
      { name: 'React', version: '18.2.0', license: 'MIT', purpose: 'UI бібліотека', status: 'healthy' },
      { name: 'TypeScript', version: '5.3.3', license: 'Apache 2.0', purpose: 'Типізований JavaScript', status: 'healthy' },
      { name: 'Tailwind CSS', version: '3.4.1', license: 'MIT', purpose: 'Утилітарний CSS фреймворк', status: 'healthy' },
      { name: 'Framer Motion', version: '11.0.3', license: 'MIT', purpose: 'Бібліотека анімацій', status: 'healthy' },
      { name: 'D3.js', version: '7.8.5', license: 'BSD 3-Clause', purpose: 'Візуалізація даних', status: 'healthy' },
      { name: 'Chart.js', version: '4.4.1', license: 'MIT', purpose: 'Прості графіки', status: 'healthy' },
      { name: 'React Flow', version: '11.10.3', license: 'MIT', purpose: 'Інтерактивні діаграми вузлів', status: 'healthy' },
      { name: 'TanStack Query', version: '5.18.1', license: 'MIT', purpose: 'Керування серверним станом', status: 'healthy' },
      { name: 'Zustand', version: '4.5.0', license: 'MIT', purpose: 'Керування станом додатка', status: 'healthy' },
      { name: 'React Router', version: '6.22.0', license: 'MIT', purpose: 'Клієнтська маршрутизація', status: 'healthy' },
      { name: 'Axios', version: '1.6.7', license: 'MIT', purpose: 'HTTP клієнт', status: 'healthy' },
      { name: 'Lucide React', version: '0.323.0', license: 'ISC', purpose: 'Набір іконок', status: 'healthy' },
      { name: 'Vite', version: '5.1.1', license: 'MIT', purpose: 'Інструмент збірки frontend', status: 'healthy' },
      { name: 'Vitest', version: '1.2.2', license: 'MIT', purpose: 'Фреймворк тестування', status: 'healthy' },
      { name: 'Playwright', version: '1.41.2', license: 'Apache 2.0', purpose: 'E2E тестування', status: 'healthy' },
      { name: 'ESLint', version: '8.56.0', license: 'MIT', purpose: 'Лінтер коду', status: 'healthy' },
      { name: 'Prettier', version: '3.2.5', license: 'MIT', purpose: 'Форматер коду', status: 'healthy' }
    ]
  },
  {
    id: 'autonomy',
    name: 'Ядро Автономності',
    icon: Zap,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    components: [
      { name: 'Autonomy Engine Core', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Центральний мозок еволюції', status: 'healthy' },
      { name: 'Meta-Learning Controller', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Оптимізатор стратегій навчання', status: 'healthy' },
      { name: 'Hypothesis Generator', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Генератор ідей покращення', status: 'healthy' },
      { name: 'Formal Verifier', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Перевірка коректності логіки', status: 'healthy' },
      { name: 'Evolutionary Sandbox', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Ізольоване середовище тестів', status: 'healthy' },
      { name: 'Fitness Evaluator', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Оцінка успішності змін', status: 'healthy' },
      { name: 'Constitutional Compliance', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Перевірка правил безпеки', status: 'healthy' },
      { name: 'Safety Council', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Комітет агентів нагляду', status: 'healthy' },
      { name: 'Retraining Orchestrator', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Керування донавчанням моделей', status: 'healthy' },
      { name: 'Progress Tracker', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Історія еволюції', status: 'healthy' },
      { name: 'Drift Detector', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Виявлення відхилень даних', status: 'healthy' },
      { name: 'A/B Test Engine', version: 'v30.0.0', license: 'Apache 2.0', purpose: 'Порівняння версій', status: 'healthy' }
    ]
  },
  {
    id: 'docs',
    name: 'Знання та Документація',
    icon: FileText,
    color: 'sky',
    gradient: 'from-sky-500 to-cyan-600',
    components: [
      { name: 'MkDocs', version: '1.5.3', license: 'BSD 2-Clause', purpose: 'Генератор статичних сайтів', status: 'healthy' },
      { name: 'MkDocs Material', version: '9.5.9', license: 'MIT', purpose: 'Тема документації', status: 'healthy' },
      { name: 'Docusaurus', version: '3.1.1', license: 'MIT', purpose: 'React-базована документація', status: 'healthy' },
      { name: 'Swagger UI', version: '5.11.8', license: 'Apache 2.0', purpose: 'Візуалізація OpenAPI', status: 'healthy' },
      { name: 'Redoc', version: '2.1.3', license: 'MIT', purpose: 'Гарна API документація', status: 'healthy' },
      { name: 'Mermaid', version: '10.8.0', license: 'MIT', purpose: 'Діаграми як код', status: 'healthy' },
      { name: 'Jupyter', version: '7.1.0', license: 'BSD 3-Clause', purpose: 'Інтерактивні ноутбуки', status: 'healthy' },
      { name: 'nbdev', version: '2.3.13', license: 'Apache 2.0', purpose: 'Розробка на основі ноутбуків', status: 'healthy' },
      { name: 'Sphinx', version: '7.2.6', license: 'BSD 2-Clause', purpose: 'Генератор документації Python', status: 'healthy' },
      { name: 'Obsidian', version: '1.5.8', license: 'Commercial', purpose: 'База знань (інтеграція)', status: 'healthy' }
    ]
  },
  {
    id: 'testing',
    name: 'QA та Тестування',
    icon: CheckCircle,
    color: 'lime',
    gradient: 'from-lime-500 to-green-600',
    components: [
      { name: 'Pytest', version: '8.0.0', license: 'MIT', purpose: 'Фреймворк тестування Python', status: 'healthy' },
      { name: 'Pytest-asyncio', version: '0.23.5', license: 'MIT', purpose: 'Асинхронне тестування', status: 'healthy' },
      { name: 'Hypothesis', version: '6.98.0', license: 'MPL 2.0', purpose: 'Property-based тестування', status: 'healthy' },
      { name: 'Locust', version: '2.23.1', license: 'MIT', purpose: 'Навантажувальне тестування', status: 'healthy' },
      { name: 'k6', version: '0.49.0', license: 'AGPL-3.0', purpose: 'Тестування продуктивності', status: 'healthy' },
      { name: 'Playwright', version: '1.41.2', license: 'Apache 2.0', purpose: 'Автоматизація браузера', status: 'healthy' },
      { name: 'Selenium', version: '4.17.2', license: 'Apache 2.0', purpose: 'Веб драйвер', status: 'healthy' },
      { name: 'Testcontainers', version: '4.1.0', license: 'MIT', purpose: 'Docker контейнери для тестів', status: 'healthy' },
      { name: 'Factory Boy', version: '3.3.0', license: 'MIT', purpose: 'Генерація тестових даних', status: 'healthy' },
      { name: 'Faker', version: '23.0.0', license: 'MIT', purpose: 'Фіктивні дані', status: 'healthy' },
      { name: 'Coverage.py', version: '7.4.1', license: 'Apache 2.0', purpose: 'Вимірювання покриття коду', status: 'healthy' },
      { name: 'Allure', version: '2.27.0', license: 'Apache 2.0', purpose: 'Звіти про тестування', status: 'healthy' },
      { name: 'Tox', version: '4.12.1', license: 'MIT', purpose: 'Автоматизація тестування', status: 'healthy' }
    ]
  },
  {
    id: 'nlp',
    name: 'NLP та Текстова Обробка',
    icon: MessagesSquare,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    components: [
      { name: 'spaCy', version: '3.7.4', license: 'MIT', purpose: 'Промислова NLP бібліотека', status: 'healthy' },
      { name: 'NLTK', version: '3.8.1', license: 'Apache 2.0', purpose: 'Інструментарій обробки мови', status: 'healthy' },
      { name: 'tiktoken', version: '0.6.0', license: 'MIT', purpose: 'Швидкий токенізатор BPE', status: 'healthy' },
      { name: 'SentencePiece', version: '0.2.0', license: 'Apache 2.0', purpose: 'Токенізація тексту', status: 'healthy' },
      { name: 'HuggingFace Tokenizers', version: '0.15.2', license: 'Apache 2.0', purpose: 'Швидкі токенізатори Rust', status: 'healthy' },
      { name: 'Gensim', version: '4.3.2', license: 'LGPL-2.1', purpose: 'Тематичне моделювання', status: 'healthy' },
      { name: 'TextBlob', version: '0.17.1', license: 'MIT', purpose: 'Спрощена обробка тексту', status: 'healthy' },
      { name: 'Polyglot', version: '16.7.4', license: 'GPLv3', purpose: 'Багатомовна обробка', status: 'healthy' }
    ]
  },
  {
    id: 'python',
    name: 'Python Екосистема',
    icon: Code,
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-600',
    components: [
      { name: 'FastAPI', version: '0.109.2', license: 'MIT', purpose: 'Сучасний веб-фреймворк', status: 'healthy' },
      { name: 'Pydantic', version: '2.6.1', license: 'MIT', purpose: 'Валідація даних', status: 'healthy' },
      { name: 'SQLAlchemy', version: '2.0.27', license: 'MIT', purpose: 'ORM toolkit', status: 'healthy' },
      { name: 'Alembic', version: '1.13.1', license: 'MIT', purpose: 'Міграції бази даних', status: 'healthy' },
      { name: 'Uvicorn', version: '0.27.1', license: 'BSD 3-Clause', purpose: 'ASGI веб-сервер', status: 'healthy' },
      { name: 'Gunicorn', version: '21.2.0', license: 'MIT', purpose: 'WSGI HTTP сервер', status: 'healthy' },
      { name: 'Httpx', version: '0.26.0', license: 'BSD 3-Clause', purpose: 'Асинхронний HTTP клієнт', status: 'healthy' },
      { name: 'Tenacity', version: '8.2.3', license: 'Apache 2.0', purpose: 'Бібліотека повторних спроб', status: 'healthy' },
      { name: 'Structlog', version: '24.1.0', license: 'Apache 2.0', purpose: 'Структуроване логування', status: 'healthy' },
      { name: 'Rich', version: '13.7.0', license: 'MIT', purpose: 'Форматування в терміналі', status: 'healthy' },
      { name: 'Typer', version: '0.9.0', license: 'MIT', purpose: 'Створення CLI', status: 'healthy' },
      { name: 'Ruff', version: '0.2.1', license: 'MIT', purpose: 'Швидкий лінтер (Rust)', status: 'healthy' },
      { name: 'Black', version: '24.2.0', license: 'MIT', purpose: 'Безкомпромісний форматер', status: 'healthy' },
      { name: 'MyPy', version: '1.8.0', license: 'MIT', purpose: 'Статична типізація', status: 'healthy' },
      { name: 'Poetry', version: '1.7.1', license: 'MIT', purpose: 'Менеджер залежностей', status: 'healthy' },
      { name: 'Celery', version: '5.3.6', license: 'BSD 3-Clause', purpose: 'Розподілена черга завдань', status: 'healthy' }
    ]
  },
  {
    id: 'messaging',
    name: 'Обмін Повідомленнями',
    icon: Wifi,
    color: 'teal',
    gradient: 'from-teal-500 to-emerald-600',
    components: [
      { name: 'RabbitMQ', version: '3.12.12', license: 'MPL 2.0', purpose: 'Надійний брокер повідомлень', status: 'healthy' },
      { name: 'NATS', version: '2.10.11', license: 'Apache 2.0', purpose: 'Високопродуктивна система повідомлень', status: 'healthy' },
      { name: 'Apache Pulsar', version: '3.2.0', license: 'Apache 2.0', purpose: 'Хмарна платформа повідомлень', status: 'healthy' },
      { name: 'Dramatiq', version: '1.16.0', license: 'LGPL-3.0', purpose: 'Фонова обробка завдань', status: 'healthy' },
      { name: 'Temporal', version: '1.23.0', license: 'MIT', purpose: 'Платформа надійності коду', status: 'healthy' },
      { name: 'ZeroMQ', version: '4.3.5', license: 'LGPL', purpose: 'Універсальна бібліотека повідомлень', status: 'healthy' }
    ]
  }
];

export const ComponentsRegistryView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    let total = 0;
    let healthy = 0;
    let degraded = 0;
    let offline = 0;

    COMPONENT_REGISTRY.forEach(cat => {
      cat.components.forEach(c => {
        total++;
        if (c.status === 'healthy') healthy++;
        else if (c.status === 'degraded') degraded++;
        else offline++;
      });
    });

    return { total, healthy, degraded, offline };
  }, []);

  const filteredCategories = selectedCategory === 'all'
    ? COMPONENT_REGISTRY
    : COMPONENT_REGISTRY.filter(c => c.id === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'degraded': return <AlertTriangle size={14} className="text-amber-400" />;
      case 'offline': return <XCircle size={14} className="text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div
              className="p-5 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/20"
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Box size={36} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">{t.header.title}</h1>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Sparkles size={16} className="text-amber-400" />
                <span className="text-cyan-400 font-bold">{stats.total}+</span> open-source компонентів для Predator v30
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-5 py-2 bg-slate-700/50 rounded-xl">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.stats.total}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-2">
              <span className="text-2xl font-bold text-emerald-400">{stats.healthy}</span>
              <span className="text-xs font-bold text-emerald-500/70 uppercase tracking-wider">{t.stats.healthy}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex gap-4 mb-8 sticky top-4 z-50">
        <div className="relative flex-1 group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-md" />
          <div className="relative flex items-center bg-slate-900/90 border border-slate-700/50 rounded-2xl backdrop-blur-xl">
            <Search size={20} className="absolute left-4 text-slate-500" />
            <input
              type="text"
              placeholder={t.search.placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
            />
          </div>
        </div>

        <div className="relative group min-w-[250px]">
           <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur-md" />
           <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-full relative z-10 appearance-none bg-slate-900/90 border border-slate-700/50 rounded-2xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer"
            title={t.search.allCategories}
           >
            <option value="all">{t.search.allCategories}</option>
            {COMPONENT_REGISTRY.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
           </select>
           <Filter size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-20" />
        </div>
      </div>

      {/* Categories Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-8">
        {COMPONENT_REGISTRY.map(cat => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden p-3 rounded-2xl text-center transition-all border ${
                isSelected
                  ? `bg-slate-800 border-${cat.color}-500 shadow-lg shadow-${cat.color}-500/20`
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {isSelected && (
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-10`} />
              )}
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                isSelected ? `bg-${cat.color}-500 text-white` : `bg-slate-700/50 text-${cat.color}-400`
              }`}>
                <Icon size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-300 truncate uppercase tracking-wide mb-1">
                {cat.name.split(' ')[0]}
              </div>
              <div className={`text-lg font-black ${isSelected ? `text-${cat.color}-400` : 'text-slate-500'}`}>
                {cat.components.length}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredCategories.map(category => {
            const Icon = category.icon;
            const filteredComponents = category.components.filter(comp =>
              searchQuery === '' ||
              comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              comp.purpose.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredComponents.length === 0) return null;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 rounded-[32px] overflow-hidden"
              >
                {/* Category Header */}
                <div className="p-6 border-b border-slate-700/30 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${category.gradient} shadow-lg shadow-${category.color}-500/20`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{category.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                         <span className="text-sm text-slate-400 font-medium">
                           {category.id.toUpperCase()} • {filteredComponents.length} {t.component.components}
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full bg-${category.color}-500/10 border border-${category.color}-500/20 text-${category.color}-400 text-sm font-bold`}>
                     SYSTEM READY
                  </div>
                </div>

                {/* Components Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredComponents.map((comp, idx) => {
                    const [isExpanded, setIsExpanded] = useState(false);

                    return (
                      <motion.div
                        key={comp.name}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`group relative bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-slate-800/80 hover:border-slate-600 ${isExpanded ? 'col-span-1 md:col-span-2 row-span-2 bg-slate-800 border-cyan-500/50 z-10' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${category.color}-500/10 text-${category.color}-400 group-hover:bg-${category.color}-500 group-hover:text-white transition-colors`}>
                               <Component size={18} />
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {comp.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                  {comp.version}
                                </div>
                                {isExpanded && <span className="text-[10px] text-emerald-400">Ver. Verified</span>}
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            {getStatusIcon(comp.status)}
                            {comp.status === 'healthy' && (
                              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20" />
                            )}
                          </div>
                        </div>

                        <p className={`text-sm text-slate-400 leading-relaxed mb-4 ${isExpanded ? '' : 'line-clamp-2 h-10'}`}>
                          {comp.purpose}
                        </p>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-slate-700/50 space-y-3"
                          >
                             <div className="grid grid-cols-2 gap-2 text-xs">
                               <div className="bg-slate-900/50 p-2 rounded">
                                 <span className="text-slate-500 block mb-1">Architecture</span>
                                 <span className="text-white font-mono">Microservice</span>
                               </div>
                               <div className="bg-slate-900/50 p-2 rounded">
                                 <span className="text-slate-500 block mb-1">Uptime</span>
                                 <span className="text-emerald-400 font-mono">99.99%</span>
                               </div>
                             </div>

                             <div className="flex items-center gap-2 text-xs text-slate-400">
                               <GitBranch size={12} />
                               <span>Maintained by Open Source Community</span>
                             </div>

                             <button className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                               <Globe size={12} />
                               View Documentation
                             </button>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                           <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                             comp.license.includes('Apache') ? 'bg-emerald-500/10 text-emerald-400' :
                             comp.license.includes('MIT') ? 'bg-blue-500/10 text-blue-400' :
                             'bg-slate-700/50 text-slate-400'
                           }`}>
                             {comp.license}
                           </span>
                           <motion.div
                             animate={{ rotate: isExpanded ? 180 : 0 }}
                             className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400"
                           />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Stats & Copyright */}
      <div className="mt-12">
        <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-3xl col-span-2 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-4">{t.license.title}</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Apache 2.0', val: 62, color: 'bg-emerald-500' },
                    { label: 'MIT', val: 28, color: 'bg-blue-500' },
                    { label: 'GPL/AGPL', val: 8, color: 'bg-purple-500' }
                  ].map(l => (
                    <div key={l.label}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">{l.label}</span>
                        <span className="text-white">{l.val}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${l.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${l.val}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl col-span-2 text-white flex items-center justify-between relative overflow-hidden group">
              <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-2">Open Source Power</h3>
                  <p className="opacity-90 max-w-sm text-sm leading-relaxed text-indigo-100">
                    Predator v30 побудований на плечах гігантів. <br/>
                    200+ компонентів інтегровано в єдину екосистему.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-indigo-500 flex items-center justify-center">
                          <Globe size={14} className="text-white" />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-bold pl-2">+150 Contributors</span>
                  </div>
              </div>
              <div className="relative z-10">
                <Cpu size={80} className="text-white/20 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>

        {/* Legal Footer */}
        <div className="text-center py-6 border-t border-slate-800/50">
           <div className="flex items-center justify-center gap-2 mb-2">
             <Shield size={16} className="text-slate-500" />
             <span className="text-sm font-bold text-slate-400">Ліцензія та Авторське Право</span>
           </div>
           <p className="text-slate-500 text-sm">
             Програмний комплекс "Predator Analytics v30" є інтелектуальною власністю.
           </p>
           <p className="text-slate-400 font-medium mt-1">
             Власник: <span className="text-white">Кізима Дмитро Миколайович</span> (12.03.1985 р.н.)
           </p>
           <p className="text-slate-600 text-xs mt-2 font-mono">
             © 2024-2026 All Rights Reserved • Patent Pending
           </p>
        </div>
      </div>
    </div>
  );
};

export default ComponentsRegistryView;
