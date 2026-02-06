"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
    Download,
    Fullscreen,
    Globe,
    Lock,
    Map,
    Network,
    Settings2,
    TrendingUp
} from "lucide-react"
import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"

// Sankey diagram for product flows
import { ResponsiveSankey } from "@nivo/sankey"
// Network graph for connections
import { ResponsiveNetwork } from "@nivo/network"

interface PremiumDashboardProps {
  userId: string
  isPremium?: boolean
}

// Custom Dark Theme for Nivo
const nivoTheme = {
    background: "transparent",
    textColor: "#94a3b8",
    fontSize: 11,
    fontFamily: "monospace",
    axis: {
        domain: {
            line: {
                stroke: "#334155",
                strokeWidth: 1
            }
        },
        ticks: {
            line: {
                stroke: "#334155",
                strokeWidth: 1
            },
            text: {
                fill: "#64748b"
            }
        },
        legend: {
            text: {
                fill: "#94a3b8"
            }
        }
    },
    grid: {
        line: {
            stroke: "#1e293b",
            strokeWidth: 1
        }
    },
    tooltip: {
        container: {
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 12,
            border: "1px solid #334155",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
        }
    }
}

export function PremiumDashboard({ userId, isPremium = true }: PremiumDashboardProps) {
  const [activeChart, setActiveChart] = useState("sankey")

  if (!isPremium) {
    return (
      <div className="relative h-[600px] w-full rounded-3xl overflow-hidden glass-ultra border border-white/5 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b')] bg-cover opacity-10 blur-sm" />
        <div className="relative z-10 text-center space-y-6 max-w-lg p-8 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                <Lock className="text-white h-8 w-8" />
            </div>
          <h3 className="text-2xl font-black font-display tracking-tight text-white uppercase">
            RESTRICTED ACCESS
          </h3>
          <p className="text-slate-400 text-sm font-mono leading-relaxed">
            Advanced analytics modules (Sankey Flows, Entity Resolution Graph, Geo-Spatial Intelligence) require <span className="text-amber-400">COMMANDER</span> clearance level.
          </p>
          <Button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all hover:scale-105">
            Upgrade Clearance
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md"
      >
        <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full sm:w-auto">
          <TabsList className="bg-black/40 border border-white/5 p-1 rounded-xl gap-1">
            <TabsTrigger value="sankey" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg text-xs font-mono uppercase transition-all duration-300">
              <TrendingUp className="h-3 w-3" />
              Flows
            </TabsTrigger>
            <TabsTrigger value="network" className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg text-xs font-mono uppercase transition-all duration-300">
              <Network className="h-3 w-3" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs font-mono uppercase transition-all duration-300">
              <Map className="h-3 w-3" />
              Geo-Intel
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10">
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10">
            <Fullscreen className="h-4 w-4" />
          </Button>
          <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10">
            <Download className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>
      </motion.div>

      {/* Main Visualization Area */}
      <Card className="overflow-hidden border-white/5 bg-[#020617] relative h-[650px] shadow-2xl rounded-[32px]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 opacity-50" />

        <CardContent className="p-0 h-full relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeChart}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="h-full w-full"
                >
                    {activeChart === "sankey" && <SankeyFlowChart />}
                    {activeChart === "network" && <NetworkGraph />}
                    {activeChart === "map" && <GeoMap />}
                </motion.div>
            </AnimatePresence>

            {/* Overlay Grid */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
        </CardContent>
      </Card>
    </div>
  )
}

function SankeyFlowChart() {
  // Enhanced Sankey Data
  const data = {
    nodes: [
      { id: "Китай", nodeColor: "#f59e0b" },
      { id: "Німеччина", nodeColor: "#f59e0b" },
      { id: "Польща", nodeColor: "#f59e0b" },
      { id: "США", nodeColor: "#f59e0b" },
      { id: "Київська М.", nodeColor: "#3b82f6" },
      { id: "Одеська М.", nodeColor: "#3b82f6" },
      { id: "Львівська М.", nodeColor: "#3b82f6" },
      { id: "Електроніка", nodeColor: "#10b981" },
      { id: "Текстиль", nodeColor: "#10b981" },
      { id: "Агро", nodeColor: "#10b981" },
      { id: "ТОВ 'Прайм'", nodeColor: "#a855f7" },
      { id: "ТОВ 'Вектор'", nodeColor: "#a855f7" }
    ],
    links: [
      { source: "Китай", target: "Одеська М.", value: 120 },
      { source: "Китай", target: "Київська М.", value: 80 },
      { source: "Німеччина", target: "Київська М.", value: 60 },
      { source: "Німеччина", target: "Львівська М.", value: 40 },
      { source: "США", target: "Київська М.", value: 50 },
      { source: "Польща", target: "Львівська М.", value: 70 },
      { source: "Одеська М.", target: "Текстиль", value: 80 },
      { source: "Одеська М.", target: "Електроніка", value: 40 },
      { source: "Київська М.", target: "Електроніка", value: 100 },
      { source: "Київська М.", target: "Агро", value: 90 },
      { source: "Львівська М.", target: "Агро", value: 60 },
      { source: "Львівська М.", target: "Текстиль", value: 50 },
      { source: "Електроніка", target: "ТОВ 'Вектор'", value: 80 },
      { source: "Електроніка", target: "ТОВ 'Прайм'", value: 60 },
      { source: "Агро", target: "ТОВ 'Прайм'", value: 150 }
    ]
  }

  return (
    <div className="h-full w-full p-4">
        <ResponsiveSankey
            data={data}
            theme={nivoTheme}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            align="justify"
            colors={(node) => node.nodeColor}
            nodeOpacity={0.8}
            nodeHoverOpacity={1}
            nodeThickness={18}
            nodeSpacing={24}
            nodeBorderWidth={0}
            nodeBorderRadius={4}
            linkOpacity={0.3}
            linkHoverOpacity={0.6}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="inside"
            labelOrientation="horizontal"
            labelPadding={16}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
        />
    </div>
  )
}

function NetworkGraph() {
  const data = {
    nodes: [
      { id: "ROOT", height: 3, size: 32, color: "#3b82f6" },
      { id: "Sub A", height: 1, size: 24, color: "#a855f7" },
      { id: "Sub B", height: 1, size: 24, color: "#a855f7" },
      { id: "Sub C", height: 1, size: 20, color: "#a855f7" },
      { id: "User 1", height: 0, size: 12, color: "#10b981" },
      { id: "User 2", height: 0, size: 12, color: "#10b981" },
      { id: "User 3", height: 0, size: 12, color: "#10b981" },
      { id: "User 4", height: 0, size: 12, color: "#10b981" },
      { id: "Risk Entity", height: 2, size: 28, color: "#ef4444" }
    ],
    links: [
      { source: "ROOT", target: "Sub A", distance: 80 },
      { source: "ROOT", target: "Sub B", distance: 80 },
      { source: "ROOT", target: "Sub C", distance: 100 },
      { source: "Sub A", target: "User 1", distance: 50 },
      { source: "Sub A", target: "User 2", distance: 50 },
      { source: "Sub B", target: "User 3", distance: 50 },
      { source: "Risk Entity", target: "User 2", distance: 120 },
      { source: "Risk Entity", target: "Sub C", distance: 90 }
    ]
  }

  return (
    <div className="h-full w-full p-4">
        <ResponsiveNetwork
            data={data}
            theme={nivoTheme}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            linkDistance={(e: any) => e.distance}
            centeringStrength={0.4}
            repulsivity={120}
            nodeSize={(n: any) => n.size}
            activeNodeSize={(n: any) => 1.3 * n.size}
            nodeColor={(e: any) => e.color}
            nodeBorderWidth={1}
            nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
            linkThickness={2}
            linkColor={() => "#334155"}
            motionConfig="gentle"
        />
    </div>
  )
}

function GeoMap() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated Radar Pulse */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-ping opacity-20" />
            <div className="w-[400px] h-[400px] border border-blue-500/20 rounded-full animate-ping opacity-30 animation-delay-500" />
        </div>

        <Globe size={64} className="text-blue-500/50 mb-6 animate-pulse" />
        <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-2">Global Surveillance</h3>
        <p className="text-slate-500 font-mono text-xs max-w-sm text-center">
            Establishing sat-link connection... <br/>
            Loading vector tiles [Region: EMEA]
        </p>

        <div className="mt-8 flex gap-2">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-2 h-8 bg-blue-500/20 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
        </div>
    </div>
  )
}
