{{- define "ingestion-worker.fullname" -}}
{{- printf "%s-ingestion-worker" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "ingestion-worker.labels" -}}
app.kubernetes.io/name: ingestion-worker
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: predator-analytics
{{- end }}
{{- define "ingestion-worker.selectorLabels" -}}
app.kubernetes.io/name: ingestion-worker
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
