{{- define "frontend.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end -}}

{{- define "frontend.fullname" -}}
{{- printf "%s-%s" (include "frontend.name" .) .Release.Name -}}
{{- end -}}
