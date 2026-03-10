{{- define "cerebro.fullname" -}}
{{- printf "%s-cerebro" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "cerebro.labels" -}}
app.kubernetes.io/name: cerebro
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: predator-analytics
{{- end }}
{{- define "cerebro.selectorLabels" -}}
app.kubernetes.io/name: cerebro
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
