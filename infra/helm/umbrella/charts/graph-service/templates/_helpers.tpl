{{- define "graph-service.fullname" -}}
{{- printf "%s-graph-service" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "graph-service.labels" -}}
app.kubernetes.io/name: graph-service
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: predator-analytics
{{- end }}
{{- define "graph-service.selectorLabels" -}}
app.kubernetes.io/name: graph-service
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
