{{- define "rtb-engine.fullname" -}}
{{- printf "%s-rtb-engine" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- define "rtb-engine.labels" -}}
app.kubernetes.io/name: rtb-engine
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: predator-analytics
{{- end }}
{{- define "rtb-engine.selectorLabels" -}}
app.kubernetes.io/name: rtb-engine
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
