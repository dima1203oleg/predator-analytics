import React from "react";
import ReactECharts from "@/components/ECharts";
import { useEchartsTheme } from "@/hooks/useEchartsTheme";

type ReactEChartsProps = React.ComponentProps<typeof ReactECharts>;

const ECharts: React.FC<ReactEChartsProps> = ({ theme: _theme, ...props }) => {
  const theme = useEchartsTheme();
  return <ReactECharts {...props} theme={theme} key={theme} />;
};

export default ECharts;
