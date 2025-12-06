{{- define "backend.name" -}}
backend
{{- end -}}

{{- define "backend.fullname" -}}
{{ .Release.Name }}-{{ include "backend.name" . }}
{{- end -}}

{{- define "backend.labels" -}}
app.kubernetes.io/name: {{ include "backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "backend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
