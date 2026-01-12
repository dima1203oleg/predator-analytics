{{- define "backend.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end -}}

{{- define "backend.fullname" -}}
{{- printf "%s-%s" (include "backend.name" .) .Release.Name -}}
{{- end -}}
