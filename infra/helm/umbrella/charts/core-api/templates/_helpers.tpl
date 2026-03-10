{{- define "core-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "core-api.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "core-api.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "core-api.labels" -}}
app.kubernetes.io/name: {{ include "core-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/component: backend
app.kubernetes.io/part-of: predator-analytics
{{- end }}

{{- define "core-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "core-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
