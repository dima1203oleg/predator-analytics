{{/*
🦅 PREDATOR Analytics UI - Helm Helper Templates
Version: v55.1.0
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "predator-frontend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "predator-frontend.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "predator-frontend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "predator-frontend.labels" -}}
helm.sh/chart: {{ include "predator-frontend.chart" . }}
{{ include "predator-frontend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Common annotations
*/}}
{{- define "predator-frontend.annotations" -}}
{{- if .Values.commonAnnotations }}
{{ toYaml .Values.commonAnnotations }}
{{- end }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "predator-frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "predator-frontend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "predator-frontend.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "predator-frontend.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the image name
*/}}
{{- define "predator-frontend.image" -}}
{{- $registry := .Values.frontend.image.registry -}}
{{- $repository := .Values.frontend.image.repository -}}
{{- $tag := .Values.frontend.image.tag | default .Chart.AppVersion -}}
{{- if .Values.global.imageRegistry }}
{{- $registry = .Values.global.imageRegistry -}}
{{- end }}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end }}

{{/*
Create the config map name
*/}}
{{- define "predator-frontend.configMapName" -}}
{{- if .Values.configMap.enabled }}
{{- default (include "predator-frontend.fullname" .) .Values.configMap.name }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Create the secret name
*/}}
{{- define "predator-frontend.secretName" -}}
{{- if .Values.secret.enabled }}
{{- default (include "predator-frontend.fullname" .) .Values.secret.name }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the proper Docker Image Registry Secret Names
*/}}
{{- define "predator-frontend.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.frontend.image) "global" .Values.global) -}}
{{- end }}

{{/*
Create a default fully qualified app name for monitoring
*/}}
{{- define "predator-frontend.monitoring.fullname" -}}
{{- if .Values.monitoring.enabled }}
{{- printf "%s-monitoring" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the monitoring labels
*/}}
{{- define "predator-frontend.monitoring.labels" -}}
{{- if .Values.monitoring.enabled }}
helm.sh/chart: {{ include "predator-frontend.chart" . }}
{{ include "predator-frontend.selectorLabels" . }}
app.kubernetes.io/component: monitoring
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.monitoring.labels }}
{{ toYaml . }}
{{- end }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Validate values
*/}}
{{- define "predator-frontend.validateValues" -}}
{{- $messages := list -}}
{{- if not .Values.frontend.image.repository }}
{{- $messages = append $messages (printf "frontend.image.repository is required") -}}
{{- end }}
{{- if not .Values.frontend.image.tag }}
{{- $messages = append $messages (printf "frontend.image.tag is required") -}}
{{- end }}
{{- if $messages }}
{{- printf "\nVALUES VALIDATION:\n%s" (join "\n" $messages) | fail -}}
{{- end }}
{{- end }}

{{/*
Return the service monitor name
*/}}
{{- define "predator-frontend.serviceMonitorName" -}}
{{- if .Values.monitoring.serviceMonitor.enabled }}
{{- default (include "predator-frontend.fullname" .) .Values.monitoring.serviceMonitor.name }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the prometheus rule name
*/}}
{{- define "predator-frontend.prometheusRuleName" -}}
{{- if .Values.monitoring.prometheusRule.enabled }}
{{- default (include "predator-frontend.fullname" .) .Values.monitoring.prometheusRule.name }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the grafana dashboard name
*/}}
{{- define "predator-frontend.grafanaDashboardName" -}}
{{- if .Values.monitoring.grafanaDashboard.enabled }}
{{- default (include "predator-frontend.fullname" .) .Values.monitoring.grafanaDashboard.name }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the backup name
*/}}
{{- define "predator-frontend.backupName" -}}
{{- if .Values.backup.enabled }}
{{- printf "%s-backup" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the network policy name
*/}}
{{- define "predator-frontend.networkPolicyName" -}}
{{- if .Values.networkPolicy.enabled }}
{{- printf "%s-network-policy" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the pod disruption budget name
*/}}
{{- define "predator-frontend.podDisruptionBudgetName" -}}
{{- if .Values.podDisruptionBudget.enabled }}
{{- printf "%s-pdb" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the HPA name
*/}}
{{- define "predator-frontend.hpaName" -}}
{{- if .Values.hpa.enabled }}
{{- printf "%s-hpa" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the VPA name
*/}}
{{- define "predator-frontend.vpaName" -}}
{{- if .Values.vpa.enabled }}
{{- printf "%s-vpa" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the RBAC names
*/}}
{{- define "predator-frontend.rbacName" -}}
{{- if .Values.rbac.create }}
{{- printf "%s-rbac" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the priority class name
*/}}
{{- define "predator-frontend.priorityClassName" -}}
{{- if .Values.priorityClass.enabled }}
{{- .Values.priorityClass.name }}
{{- else }}
{{- "" }}
{{- end }}
{{- end }}

{{/*
Return the storage class name
*/}}
{{- define "predator-frontend.storageClassName" -}}
{{- if .Values.global.storageClass }}
{{- .Values.global.storageClass }}
{{- else }}
{{- "standard" }}
{{- end }}
{{- end }}

{{/*
Return the ingress class name
*/}}
{{- define "predator-frontend.ingressClassName" -}}
{{- if .Values.frontend.ingress.className }}
{{- .Values.frontend.ingress.className }}
{{- else }}
{{- "nginx" }}
{{- end }}
{{- end }}

{{/*
Return the TLS secret name
*/}}
{{- define "predator-frontend.tlsSecretName" -}}
{{- if .Values.frontend.ingress.tls }}
{{- .Values.frontend.ingress.tls[0].secretName }}
{{- else }}
{{- printf "%s-tls" (include "predator-frontend.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Return the service type
*/}}
{{- define "predator-frontend.serviceType" -}}
{{- if .Values.frontend.service.type }}
{{- .Values.frontend.service.type }}
{{- else }}
{{- "ClusterIP" }}
{{- end }}
{{- end }}

{{/*
Return the service port
*/}}
{{- define "predator-frontend.servicePort" -}}
{{- if .Values.frontend.service.port }}
{{- .Values.frontend.service.port }}
{{- else }}
{{- 3030 }}
{{- end }}
{{- end }}

{{/*
Return the service target port
*/}}
{{- define "predator-frontend.serviceTargetPort" -}}
{{- if .Values.frontend.service.targetPort }}
{{- .Values.frontend.service.targetPort }}
{{- else }}
{{- 3030 }}
{{- end }}
{{- end }}

{{/*
Return the container port
*/}}
{{- define "predator-frontend.containerPort" -}}
{{- if .Values.frontend.service.targetPort }}
{{- .Values.frontend.service.targetPort }}
{{- else }}
{{- 3030 }}
{{- end }}
{{- end }}

{{/*
Return the health check path
*/}}
{{- define "predator-frontend.healthPath" -}}
{{- "/health" }}
{{- end }}

{{/*
Return the metrics path
*/}}
{{- define "predator-frontend.metricsPath" -}}
{{- "/metrics" }}
{{- end }}

{{/*
Return the readiness probe path
*/}}
{{- define "predator-frontend.readinessPath" -}}
{{- "/health" }}
{{- end }}

{{/*
Return the liveness probe path
*/}}
{{- define "predator-frontend.livenessPath" -}}
{{- "/health" }}
{{- end }}

{{/*
Return the startup probe path
*/}}
{{- define "predator-frontend.startupPath" -}}
{{- "/health" }}
{{- end }}

{{/*
Return the default namespace
*/}}
{{- define "predator-frontend.namespace" -}}
{{- if .Values.namespace }}
{{- .Values.namespace }}
{{- else }}
{{- .Release.Namespace }}
{{- end }}
{{- end }}

{{/*
Return the environment name
*/}}
{{- define "predator-frontend.environment" -}}
{{- if .Values.frontend.env.NODE_ENV }}
{{- .Values.frontend.env.NODE_ENV }}
{{- else }}
{{- "production" }}
{{- end }}
{{- end }}

{{/*
Return the component name
*/}}
{{- define "predator-frontend.component" -}}
{{- "frontend" }}
{{- end }}

{{/*
Return the app version
*/}}
{{- define "predator-frontend.appVersion" -}}
{{- if .Values.frontend.image.tag }}
{{- .Values.frontend.image.tag }}
{{- else }}
{{- .Chart.AppVersion }}
{{- end }}
{{- end }}

{{/*
Return the chart version
*/}}
{{- define "predator-frontend.chartVersion" -}}
{{- .Chart.Version }}
{{- end }}

{{/*
Return the release name
*/}}
{{- define "predator-frontend.releaseName" -}}
{{- .Release.Name }}
{{- end }}

{{/*
Return the release namespace
*/}}
{{- define "predator-frontend.releaseNamespace" -}}
{{- .Release.Namespace }}
{{- end }}

{{/*
Return the release service
*/}}
{{- define "predator-frontend.releaseService" -}}
{{- .Release.Service }}
{{- end }}

{{/*
Return the chart name
*/}}
{{- define "predator-frontend.chartName" -}}
{{- .Chart.Name }}
{{- end }}

{{/*
Return the chart app version
*/}}
{{- define "predator-frontend.chartAppVersion" -}}
{{- .Chart.AppVersion }}
{{- end }}

{{/*
Return the chart description
*/}}
{{- define "predator-frontend.chartDescription" -}}
{{- .Chart.Description }}
{{- end }}

{{/*
Return the chart home
*/}}
{{- define "predator-frontend.chartHome" -}}
{{- .Chart.Home }}
{{- end }}

{{/*
Return the chart sources
*/}}
{{- define "predator-frontend.chartSources" -}}
{{- .Chart.Sources }}
{{- end }}

{{/*
Return the chart maintainers
*/}}
{{- define "predator-frontend.chartMaintainers" -}}
{{- .Chart.Maintainers }}
{{- end }}

{{/*
Return the chart keywords
*/}}
{{- define "predator-frontend.chartKeywords" -}}
{{- .Chart.Keywords }}
{{- end }}

{{/*
Return the chart annotations
*/}}
{{- define "predator-frontend.chartAnnotations" -}}
{{- .Chart.Annotations }}
{{- end }}

{{/*
Return the chart type
*/}}
{{- define "predator-frontend.chartType" -}}
{{- .Chart.Type }}
{{- end }}

{{/*
Return the chart api version
*/}}
{{- define "predator-frontend.chartApiVersion" -}}
{{- .Chart.ApiVersion }}
{{- end }}

{{/*
Return the chart condition
*/}}
{{- define "predator-frontend.chartCondition" -}}
{{- .Chart.Condition }}
{{- end }}

{{/*
Return the chart tags
*/}}
{{- define "predator-frontend.chartTags" -}}
{{- .Chart.Tags }}
{{- end }}

{{/*
Return the chart version
*/}}
{{- define "predator-frontend.chartVersion" -}}
{{- .Chart.Version }}
{{- end }}

{{/*
Return the chart kubeVersion
*/}}
{{- define "predator-frontend.chartKubeVersion" -}}
{{- .Chart.KubeVersion }}
{{- end }}

{{/*
Return the chart dependencies
*/}}
{{- define "predator-frontend.chartDependencies" -}}
{{- .Chart.Dependencies }}
{{- end }}

{{/*
Return the chart icon
*/}}
{{- define "predator-frontend.chartIcon" -}}
{{- .Chart.Icon }}
{{- end }}

{{/*
Return the chart maintainers
*/}}
{{- define "predator-frontend.chartMaintainers" -}}
{{- .Chart.Maintainers }}
{{- end }}

{{/*
Return the chart sources
*/}}
{{- define "predator-frontend.chartSources" -}}
{{- .Chart.Sources }}
{{- end }}

{{/*
Return the chart type
*/}}
{{- define "predator-frontend.chartType" -}}
{{- .Chart.Type }}
{{- end }}

{{/*
Return the chart annotations
*/}}
{{- define "predator-frontend.chartAnnotations" -}}
{{- .Chart.Annotations }}
{{- end }}

{{/*
Return the chart condition
*/}}
{{- define "predator-frontend.chartCondition" -}}
{{- .Chart.Condition }}
{{- end }}

{{/*
Return the chart tags
*/}}
{{- define "predator-frontend.chartTags" -}}
{{- .Chart.Tags }}
{{- end }}

{{/*
Return the chart version
*/}}
{{- define "predator-frontend.chartVersion" -}}
{{- .Chart.Version }}
{{- end }}

{{/*
Return the chart kubeVersion
*/}}
{{- define "predator-frontend.chartKubeVersion" -}}
{{- .Chart.KubeVersion }}
{{- end }}

{{/*
Return the chart dependencies
*/}}
{{- define "predator-frontend.chartDependencies" -}}
{{- .Chart.Dependencies }}
{{- end }}

{{/*
Return the chart icon
*/}}
{{- define "predator-frontend.chartIcon" -}}
{{- .Chart.Icon }}
{{- end }}
