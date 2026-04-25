"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
    Activity,
    Bot,
    Brain,
    CheckCircle2,
    Database,
    Eye,
    FileJson,
    FileText,
    MoreHorizontal,
    Play,
    Search,
    Sparkles,
    Table as TableIcon,
    Upload,
    XCircle
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"

import { PageTransition } from "@/components/layout/PageTransition"
import { DataPulse } from "@/components/ui/DataPulse"
import { NeuralPulse } from "@/components/ui/NeuralPulse"
import NumberTicker from "@/components/ui/number-ticker"
import { TiltCard } from "@/components/ui/tilt-card"

// Mock data with expanded metadata
const datasets = [
  {
    id: "1",
    name: "Митні декларації 2024 (Q4)",
    type: "customs",
    format: "CSV",
    records: 1250000,
    size: "2.3 GB",
    status: "active",
    qualityScore: 94,
    composition: { text: 60, numbers: 30, dates: 10 },
    isTraining: true,
    isTemplate: false,
    updatedAt: "2026-02-01",
    columns: ["id", "company_name", "hs_code", "declared_value", "date"]
  },
  {
    id: "2",
    name: "Реєстр компаній UA",
    type: "companies",
    format: "JSONL",
    records: 500000,
    size: "890 MB",
    status: "active",
    qualityScore: 98,
    composition: { text: 80, numbers: 10, dates: 10 },
    isTraining: false,
    isTemplate: true,
    updatedAt: "2026-01-28",
    columns: ["edrpou", "name", "address", "director", "status"]
  },
  {
    id: "3",
    name: "Судові Рішення (NLP)",
    type: "legal",
    format: "PDF/OCR",
    records: 12400,
    size: "4.1 GB",
    status: "processing",
    qualityScore: 72,
    composition: { text: 95, numbers: 0, dates: 5 },
    isTraining: false,
    isTemplate: false,
    updatedAt: "2026-02-04",
    columns: ["case_number", "content_vector", "judge", "court_id"]
  }
]

export default function DatasetsPage() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId)

  return (
    <PageTransition>
      <div className="space-y-8 p-6 lg:p-10 min-h-screen bg-transparent text-slate-200 relative">
        <div className="absolute inset-0 pointer-events-none z-0">
            <NeuralPulse color="rgba(59, 130, 246, 0.2)" size={1000} />
        </div>
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
            >
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">DATA LAB v45.1</Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">AI READY</Badge>
            </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">
            Центр <span className="text-blue-500">Даних</span>
          </h1>
          <p className="text-slate-400 max-w-xl">
            Центральний хаб управління даними. Завантажуйте сирі дані, верифікуйте структуру та готуйте їх для навчання AI моделей.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest px-6 h-11">
            <Sparkles className="mr-2 h-4 w-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            Згенерувати Дані
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] text-[10px] font-black uppercase tracking-widest px-6 h-11">
            <Upload className="mr-2 h-4 w-4" />
            Імпортувати Датасет
          </Button>
        </div>
      </div>

        {/* Stats Cards with 3D Tilt */}
        <div className="grid gap-6 md:grid-cols-4 relative z-10 font-bold uppercase tracking-tight">
          {[
              { label: "Всього Датасетів", value: 12, icon: Database, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
              { label: "Активні Канали", value: 8, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "AI Тренування", value: 3, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              { label: "Якість Даних", value: 94, icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", unit: "%" }
          ].map((stat, i) => (
              <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="z-10"
              >
                  <TiltCard className={`h-full holographic-card border ${stat.border} rounded-xl shadow-2xl`}>
                      <div className="p-6">
                        <div className="flex flex-row items-center justify-between pb-2">
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{stat.label}</div>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-white font-mono mt-2">
                           <NumberTicker value={stat.value} />{stat.unit}
                        </div>
                    </div>
                </TiltCard>
            </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Main List */}
        <div className="flex-1 space-y-4">
            <Card className="bg-slate-950/60 border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 flex gap-4 bg-slate-900/20">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            placeholder="Пошук датасетів..."
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            title="Пошук датасетів"
                            aria-label="Пошук датасетів"
                        />
                    </div>
                </div>
                <Table>
                <TableHeader>
                    <TableRow className="border-white/5 hover:bg-white/5 bg-slate-950/40">
                    <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500 py-6">ID / Назва</TableHead>
                    <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500">DNA Структура</TableHead>
                    <TableHead className="text-xs uppercase font-black tracking-widest text-slate-500 text-center">Об'єм</TableHead>
                    <TableHead className="text-center text-xs uppercase font-black tracking-widest text-slate-500">Статус</TableHead>
                    <TableHead className="text-center text-xs uppercase font-black tracking-widest text-slate-500">Авто-Тренування</TableHead>
                    <TableHead className="text-center text-xs uppercase font-black tracking-widest text-slate-500">Дії</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {datasets.map((dataset) => (
                    <TableRow
                        key={dataset.id}
                        className={`cursor-pointer transition-all border-white/5 group relative overflow-hidden ${selectedDatasetId === dataset.id ? 'bg-blue-600/10' : 'hover:bg-white/5'}`}
                        onClick={() => setSelectedDatasetId(dataset.id)}
                    >
                        {selectedDatasetId === dataset.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] z-20" />
                        )}
                        <TableCell className="py-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-lg ${
                                    dataset.format === 'CSV' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    dataset.format === 'JSONL' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                    {dataset.format === 'CSV' ? <TableIcon size={20} /> :
                                     dataset.format === 'JSONL' ? <FileJson size={20} /> : <FileText size={20} />}
                                </div>
                                <div>
                                    <div className="font-black text-sm text-white group-hover:text-blue-400 transition-colors tracking-tight uppercase">{dataset.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                        <Badge variant="outline" className="text-[8px] h-4 border-white/5 px-1">{dataset.format}</Badge>
                                        <span>{dataset.size}</span>
                                        <span className="opacity-30">|</span>
                                        <span>{dataset.updatedAt}</span>
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            {/* DNA Bar & Pulse */}
                            <div className="flex items-center gap-4">
                                <div className="w-32 h-2 bg-black/40 rounded-full overflow-hidden flex shadow-2xl border border-white/5">
                                    <div
                                        className="h-full bg-blue-500 dynamic-width-bar shadow-[0_0_10px_#3b82f6] transition-all duration-1000"
                                        style={{ ['--w' as any]: `${dataset.composition.text}%` }}
                                        title={`Текст: ${dataset.composition.text}%`}
                                    />
                                    <div
                                        className="h-full bg-emerald-500 dynamic-width-bar shadow-[0_0_10px_#10b981] transition-all duration-1000"
                                        style={{ ['--w' as any]: `${dataset.composition.numbers}%` }}
                                        title={`Числа: ${dataset.composition.numbers}%`}
                                    />
                                    <div
                                        className="h-full bg-purple-500 dynamic-width-bar shadow-[0_0_10px_#a855f7] transition-all duration-1000"
                                        style={{ ['--w' as any]: `${dataset.composition.dates}%` }}
                                        title={`Дати: ${dataset.composition.dates}%`}
                                    />
                                </div>
                                <div className="flex flex-col items-center">
                                    <DataPulse color={dataset.qualityScore > 90 ? "#10b981" : "#f59e0b"} />
                                    <span className={`text-[8px] font-black mt-1 ${dataset.qualityScore > 90 ? "text-emerald-500" : "text-amber-500"}`}>{dataset.qualityScore}%</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-center">
                            <span className="text-white font-bold">{dataset.records.toLocaleString()}</span>
                            <div className="text-[8px] text-slate-600 uppercase tracking-widest mt-0.5">Кластери Векторів</div>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant={dataset.status === "active" ? "default" : "secondary"} className={
                                dataset.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                dataset.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse' :
                                'bg-slate-800 text-slate-400 border border-white/5'
                            }>
                                {dataset.status === 'active' ? 'АКТИВНИЙ' : 
                                 dataset.status === 'processing' ? 'ОБРОБКА' : 'ОЧІКУВАННЯ'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                            <Switch checked={dataset.isTraining} onCheckedChange={() => {}} title="Авто-Тренування" aria-label="Перемкнути Авто-Тренування" />
                        </TableCell>
                        <TableCell className="text-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl" title="Більше Дій" aria-label="Більше Дій">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white z-50 p-2 rounded-xl backdrop-blur-xl">
                                <DropdownMenuItem className="rounded-lg focus:bg-blue-500/10 focus:text-blue-400 cursor-pointer">
                                    <Play className="mr-2 h-4 w-4 text-emerald-400" /> Перевірити Ядро
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg focus:bg-purple-500/10 focus:text-purple-400 cursor-pointer">
                                    <Bot className="mr-2 h-4 w-4 text-purple-400" /> Тренувати AI
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </Card>
        </div>

        {/* Detail Panel with 3D elements */}
        <AnimatePresence>
            {selectedDataset && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-full lg:w-[400px]"
                >
                    <TiltCard intensity={5} className="h-full sticky top-6">
                        <div className="bg-slate-900/60 border border-white/10 backdrop-blur-xl h-full rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                            <div className="h-32 bg-gradient-to-br from-blue-900/20 via-slate-900/20 to-purple-900/20 relative p-6 flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                                <div className="flex justify-between items-start z-10">
                                    <Badge className="bg-slate-950/50 border-white/10 text-slate-300 backdrop-blur-md">ID: {selectedDataset.id}</Badge>
                                    <Button size="icon" variant="ghost" onClick={() => setSelectedDatasetId(null)}>
                                        <XCircle className="text-slate-400 hover:text-white transition-colors" />
                                    </Button>
                                </div>
                                <h2 className="text-xl font-black text-white uppercase z-10 leading-tight">{selectedDataset.name}</h2>
                            </div>

                            <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 text-center">
                                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Якість</div>
                                        <div className="text-2xl font-black text-emerald-400">
                                            <NumberTicker value={selectedDataset.qualityScore} />%
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-950/50 rounded-xl border border-white/5 text-center">
                                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">Колонки</div>
                                        <div className="text-2xl font-black text-blue-400">
                                            <NumberTicker value={selectedDataset.columns.length} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                        Структура Даних
                                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">ПЕРЕГЛЯД</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedDataset.columns.map(col => (
                                            <div key={col} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm text-slate-300 font-mono group hover:bg-white/10 transition-colors cursor-default">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:shadow-[0_0_8px_#3b82f6] transition-all" />
                                                    {col}
                                                </div>
                                                <div className="h-1 w-12 bg-slate-700/50 rounded-full overflow-hidden">
                                                    {/* Fake distribution sparkline */}
                                                    <div className="h-full bg-slate-500/50 dynamic-width-bar" style={{ ['--w' as any]: `${Math.random() * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Швидкі Дії</h3>
                                    <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/20">
                                        <Bot className="mr-2 h-4 w-4" /> Тренувати Llama 3.1
                                    </Button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                                            <Play className="mr-2 h-4 w-4" /> Перевірити
                                        </Button>
                                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                                            <Eye className="mr-2 h-4 w-4" /> Огляд
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </TiltCard>
                </motion.div>
            )}
        </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
