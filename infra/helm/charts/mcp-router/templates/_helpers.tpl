{{- define "mcp-router.fullname" -}}
{{- printf "%s-mcp-router" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "mcp-router.labels" -}}
app.kubernetes.io/name: mcp-router
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: predator-analytics
{{- end }}
{{- define "mcp-router.selectorLabels" -}}
app.kubernetes.io/name: mcp-router
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
