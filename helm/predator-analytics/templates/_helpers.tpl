{{/*
Expand the name of the chart.
*/}}
{{- define "predator-analytics.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "predator-analytics.fullname" -}}
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
{{- define "predator-analytics.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "predator-analytics.labels" -}}
helm.sh/chart: {{ include "predator-analytics.chart" . }}
{{ include "predator-analytics.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "predator-analytics.selectorLabels" -}}
app.kubernetes.io/name: {{ include "predator-analytics.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "predator-analytics.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "predator-analytics.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create static IP for LoadBalancer
*/}}
{{- define "predator-analytics.staticIP" -}}
{{- .Values.global.staticIP }}
{{- end }}

{{/*
Create domain name
*/}}
{{- define "predator-analytics.domain" -}}
{{- .Values.global.domain }}
{{- end }}

{{/*
Create database URL
*/}}
{{- define "predator-analytics.databaseURL" -}}
postgresql+asyncpg://predator:{{ .Values.postgresql.auth.postgresPassword }}@{{ .Release.Name }}-postgresql:5432/{{ .Values.postgresql.auth.database }}
{{- end }}

{{/*
Create image name
*/}}
{{- define "predator-analytics.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $repository := .repository -}}
{{- $tag := .tag | default .Values.global.imageTag -}}
{{- if .Values.global }}
{{- $registry = .Values.global.imageRegistry -}}
{{- end }}
{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- end }}
