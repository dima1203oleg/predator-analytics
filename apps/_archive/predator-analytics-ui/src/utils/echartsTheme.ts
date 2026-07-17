import * as echarts from "echarts";

let themesRegistered = false;

const baseTheme = {
  color: ["#38bdf8", "#22d3ee", "#f59e0b", "#a3e635", "#f97316", "#e879f9", "#60a5fa"],
  backgroundColor: "transparent",
  textStyle: {
    color: "#e2e8f0",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  title: {
    textStyle: {
      color: "#f8fafc",
      fontWeight: "bold",
    },
  },
  legend: {
    textStyle: {
      color: "#cbd5f5",
    },
  },
  tooltip: {
    backgroundColor: "rgba(2, 6, 23, 0.95)",
    borderColor: "#475569",
    borderWidth: 1,
    textStyle: {
      color: "#e2e8f0",
    },
  },
  axisPointer: {
    lineStyle: {
      color: "#94a3b8",
    },
    crossStyle: {
      color: "#94a3b8",
    },
    label: {
      color: "#e2e8f0",
      backgroundColor: "#0f172a",
    },
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: "#64748b",
      },
    },
    axisLabel: {
      color: "#cbd5f5",
    },
    splitLine: {
      lineStyle: {
        color: "#1f2937",
      },
    },
  },
  yAxis: {
    axisLine: {
      lineStyle: {
        color: "#64748b",
      },
    },
    axisLabel: {
      color: "#cbd5f5",
    },
    splitLine: {
      lineStyle: {
        color: "#1f2937",
      },
    },
  },
  radar: {
    name: {
      textStyle: {
        color: "#cbd5f5",
      },
    },
    splitLine: {
      lineStyle: {
        color: "#334155",
      },
    },
    splitArea: {
      areaStyle: {
        color: ["rgba(15, 23, 42, 0.4)", "rgba(2, 6, 23, 0.2)"],
      },
    },
  },
};

const highVisibilityTheme = {
  ...baseTheme,
  color: ["#7dd3fc", "#67e8f9", "#fbbf24", "#a7f3d0", "#fb923c", "#f0abfc", "#93c5fd"],
  textStyle: {
    color: "#f8fafc",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  legend: {
    textStyle: {
      color: "#f1f5f9",
    },
  },
  tooltip: {
    backgroundColor: "rgba(2, 6, 23, 0.98)",
    borderColor: "#94a3b8",
    borderWidth: 1,
    textStyle: {
      color: "#f8fafc",
    },
  },
  axisPointer: {
    lineStyle: {
      color: "#cbd5f5",
    },
    crossStyle: {
      color: "#cbd5f5",
    },
    label: {
      color: "#f8fafc",
      backgroundColor: "#0b1220",
    },
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: "#cbd5f5",
      },
    },
    axisLabel: {
      color: "#f1f5f9",
    },
    splitLine: {
      lineStyle: {
        color: "#334155",
      },
    },
  },
  yAxis: {
    axisLine: {
      lineStyle: {
        color: "#cbd5f5",
      },
    },
    axisLabel: {
      color: "#f1f5f9",
    },
    splitLine: {
      lineStyle: {
        color: "#334155",
      },
    },
  },
  radar: {
    name: {
      textStyle: {
        color: "#f1f5f9",
      },
    },
    splitLine: {
      lineStyle: {
        color: "#475569",
      },
    },
    splitArea: {
      areaStyle: {
        color: ["rgba(15, 23, 42, 0.5)", "rgba(2, 6, 23, 0.3)"],
      },
    },
  },
};

import worldMap from "../assets/maps/world.json";

export const registerEchartsThemes = () => {
  if (themesRegistered) return;
  
  // Register Maps
  echarts.registerMap('world', worldMap as any);
  
  // Register Themes
  echarts.registerTheme("predator-contrast", baseTheme);
  echarts.registerTheme("predator-contrast-hi", highVisibilityTheme);
  
  themesRegistered = true;
};
