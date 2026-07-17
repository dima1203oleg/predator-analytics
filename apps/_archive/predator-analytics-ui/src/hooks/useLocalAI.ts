import { useState, useCallback } from "react";
import { useAppStore } from "../store";
import { aiApi } from "../services/api/ai";

interface MessagePayload {
  text: string;
  sender: "USER" | "AI";
  timestamp: string;
}

export const useLocalAI = (audioElement: HTMLAudioElement | null, initAnalyser: (el: HTMLAudioElement) => void) => {
  const [chatHistory, setChatHistory] = useState<MessagePayload[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<"HEALTHY" | "RISK">("HEALTHY");

  const submitCommand = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || isProcessing || !audioElement) return;

    setIsProcessing(true);
    const timeNow = new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    
    const userMessage: MessagePayload = {
      text: userPrompt,
      sender: "USER",
      timestamp: timeNow
    };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      let aiTextResponse = "Аналізую команду...";
      try {
        const response = await aiApi.chat([
          { role: 'system', content: 'Ти — суверенний ШІ PREDATOR. Твоя відповідь має бути лаконічною, чіткою та українською мовою.' },
          { role: 'user', content: userPrompt }
        ]);

        if (response && response.choices && response.choices.length > 0) {
          aiTextResponse = response.choices[0].message.content;
          aiTextResponse = aiTextResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        } else {
          throw new Error("Invalid response format from Core API");
        }
      } catch (apiError) {
        console.warn("Core API offline, using fallback response", apiError);
        aiTextResponse = "Зв'язок із когнітивним ядром недоступний. Працюю в автономному режимі. Ви сказали: " + userPrompt;
      }

      // Динамічний сканер ключових загрози для перемикання кольору матриці
      if (aiTextResponse.toUpperCase().includes("РИЗИК") || aiTextResponse.toUpperCase().includes("ЗАГРОЗА")) {
        setSystemStatus("RISK");
      } else {
        setSystemStatus("HEALTHY");
      }

      let audioUrl = "";
      try {
        const ttsResponse = await fetch("http://localhost:8000/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: aiTextResponse, voice: "authoritative_bass" })
        });

        if (!ttsResponse.ok) throw new Error("TTS Engine offline");
        const audioBlob = await ttsResponse.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        
        // Ініціалізація шини аналізатора та запуск Lip-Sync
        initAnalyser(audioElement);
        audioElement.src = audioUrl;
        
        const aiMessage: MessagePayload = {
          text: aiTextResponse,
          sender: "AI",
          timestamp: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
        };
        
        setChatHistory((prev) => [...prev, aiMessage]);
        
        audioElement.onplay = () => useAppStore.setState((s: any) => ({ aiState: { ...s.aiState, isSpeaking: true } }));
        audioElement.onended = () => useAppStore.setState((s: any) => ({ aiState: { ...s.aiState, isSpeaking: false } }));
        await audioElement.play();

      } catch (ttsError) {
        console.warn("Local TTS offline, using native browser SpeechSynthesis (uk-UA) fallback", ttsError);
        
        const aiMessage: MessagePayload = {
          text: aiTextResponse,
          sender: "AI",
          timestamp: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
        };
        setChatHistory((prev) => [...prev, aiMessage]);

        // Native Browser Fallback (Ідеальна українська вимова без серверу)
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiTextResponse);
          utterance.lang = 'uk-UA';
          utterance.rate = 1.05;
          utterance.pitch = 0.9;
          
          utterance.onstart = () => useAppStore.setState((s: any) => ({ aiState: { ...s.aiState, isSpeaking: true } }));
          utterance.onend = () => useAppStore.setState((s: any) => ({ aiState: { ...s.aiState, isSpeaking: false } }));
          
          window.speechSynthesis.speak(utterance);
        }
      }

    } catch (error) {
      console.error("PREDATOR INTEL CORE ERROR:", error);
      setSystemStatus("RISK");
      
      // Додаємо fallback повідомлення про помилку
      const errorMsg: MessagePayload = {
        text: "⚠ Помилка зв'язку з Когнітивним Ядром. Сервіс недоступний.",
        sender: "AI",
        timestamp: new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, audioElement, initAnalyser]);

  return { chatHistory, isProcessing, systemStatus, submitCommand };
};
