{{- define "policy-engine.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end -}}

{{- define "policy-engine.fullname" -}}
{{- printf "%s-%s" (include "policy-engine.name" .) .Release.Name -}}
{{- end -}}
