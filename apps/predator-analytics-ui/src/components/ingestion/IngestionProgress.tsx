"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    CheckCircle,
    Database,
    FileSearch,
    Loader2,
    PartyPopper,
    Scissors,
    Sparkles,
    Upload,
    XCircle
} from "lucide-react"
import { useEffect, useState } from "react"

interface IngestionProgressProps {
  jobId: string
  onComplete?: () => void
}

interface ProgressData {
  status: string
  stage: string
  percent: number
  current: number
  total: number
  message: string
  error?: string
}

const stageIcons: Record<string, React.ReactNode> = {
  uploading: <Upload className="h-5 w-5 animate-bounce" />,
  uploaded: <Upload className="h-5 w-5" />,
  validating: <FileSearch className="h-5 w-5 animate-pulse" />,
  parsing: <FileSearch className="h-5 w-5 animate-pulse" />,
  chunking: <Scissors className="h-5 w-5 animate-pulse" />,
  embedding: <Sparkles className="h-5 w-5 animate-pulse" />,
  indexing: <Database className="h-5 w-5 animate-pulse" />,
  ready: <PartyPopper className="h-5 w-5" />,
  failed: <XCircle className="h-5 w-5" />
}

const stageLabels: Record<string, string> = {
  uploading: "Завантаження",
  uploaded: "Завантажено",
  validating: "Валідація",
  parsing: "Парсинг",
  chunking: "Чанкування",
  embedding: "Створення embeddings",
  indexing: "Індексація",
  ready: "Готово!",
  failed: "Помилка"
}

export function IngestionProgress({ jobId, onComplete }: IngestionProgressProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) return

    // SSE connection for real-time updates
    // Assuming the API is proxied or absolute URL is handled
    const eventSource = new EventSource(`/api/v1/ingestion/stream/${jobId}`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.status === 'not_found') {
             setError("Job not found")
             eventSource.close()
             return
        }

        setProgress(data)

        // Close connection if finished
        if (data.status === "ready" || data.status === "failed") {
          eventSource.close()
          if (data.status === "ready" && onComplete) {
            onComplete()
          }
        }
      } catch (e) {
        console.error("Failed to parse SSE data:", e)
      }
    }

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err)
      // Check if we already finished, sometimes error fires on close
      if (progress?.status !== 'ready' && progress?.status !== 'failed') {
          setError("Втрачено з'єднання з сервером")
      }
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [jobId, onComplete]) // Listen to progress to avoid stale closures if needed

  if (error) {
    return (
      <Card className="border-red-500">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-500">
            <XCircle className="h-6 w-6" />
            <span>{error}</span>
          </div>
          {progress?.error && (
            <p className="text-sm text-red-400 mt-2 ml-9">{progress.error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Підключення до потоку даних...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isComplete = progress.status === "ready"
  const isFailed = progress.status === "failed"

  return (
    <Card className={`w-full transition-colors duration-500 ${
      isComplete ? "border-green-500 bg-green-50/10" :
      isFailed ? "border-red-500 bg-red-50/10" : ""
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {stageIcons[progress.stage] || <Loader2 className="h-5 w-5 animate-spin"/>}
            {stageLabels[progress.stage] || progress.stage}
          </CardTitle>
          <Badge variant={
            isComplete ? "default" :
            isFailed ? "destructive" :
            "secondary"
          }>
            {Math.round(progress.percent)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress
          value={progress.percent}
          className={`h-2 transition-all ${
            isComplete ? "[&>div]:bg-green-500" :
            isFailed ? "[&>div]:bg-red-500" : ""
          }`}
        />

        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">{progress.message}</span>
          {progress.total > 0 && (
            <span className="text-muted-foreground font-mono text-xs">
              {progress.current} / {progress.total}
            </span>
          )}
        </div>

        {/* Timeline Visualization */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t relative">
            {/* Connecting Line */}
            <div className="absolute top-[2.2rem] left-4 right-4 h-0.5 bg-muted -z-10" />

            {["validating", "parsing", "chunking", "embedding", "indexing", "ready"].map((stage, i) => {
            const stages = ["validating", "parsing", "chunking", "embedding", "indexing", "ready"]
            const currentIndex = stages.indexOf(progress.stage === 'failed' ? 'failed' : progress.stage)
            const stageIndex = i

            // Should fill if passed or current
            // If failed, we don't necessarily fill future steps
            const isCompletedStep = stageIndex < currentIndex || isComplete
            const isCurrentStep = stage === progress.stage

            return (
              <div
                key={stage}
                className={`flex flex-col items-center gap-2 bg-background z-10 px-1 ${
                  isCurrentStep ? "text-primary font-medium" :
                  isCompletedStep ? "text-green-600" :
                  "text-muted-foreground opacity-50"
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrentStep ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110" :
                  isCompletedStep ? "bg-green-100 text-green-600 ring-2 ring-green-100" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {isCompletedStep ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : isCurrentStep ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px]">{i + 1}</span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-wider">{stageLabels[stage]?.split(' ')[0]}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
