import { useAppStore } from "@/store/useAppStore";

export const useEchartsTheme = () => {
  const highVisibility = useAppStore((state) => state.highVisibility);
  return highVisibility ? "predator-contrast-hi" : "predator-contrast";
};
