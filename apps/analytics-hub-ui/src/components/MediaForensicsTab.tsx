import React, { useState, useRef } from 'react';
import { Camera, FileAudio, FileVideo, Search, Map, Sparkles, UploadCloud, AlertTriangle, Play, FileText, Image as ImageIcon, Video, Bot, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function MediaForensicsTab() {
  const [activeMode, setActiveMode] = useState<'analysis' | 'generation' | 'grounding'>('analysis');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Vision processing states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [boxes, setBoxes] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPreviewImage(evt.target?.result as string);
        setBoxes([]);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateClientVision = async () => {
    setIsScanning(true);
    setBoxes([]);
    // Simulate processing time
    await new Promise(r => setTimeout(r, 1500));
    
    // Generate some mock bounding boxes
    setBoxes([
      { id: 1, x: 25, y: 30, w: 20, h: 25, label: "FACE MATCH 98%" },
      { id: 2, x: 60, y: 15, w: 15, h: 10, label: "TEXT: 'KYIV'" },
      { id: 3, x: 10, y: 70, w: 40, h: 20, label: "VEHICLE (MILITARY)" }
    ]);
    setIsScanning(false);
  };

  const handleRunTask = async () => {
    setLoading(true);
    setResult(null);
    
    if (activeMode === 'analysis' && previewImage) {
      await simulateClientVision();
    }
    
    try {
      const res = await fetch('/api/media-forensics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode: activeMode, 
          prompt: prompt,
          image: activeMode === 'analysis' && previewImage ? previewImage.split(',')[1] : undefined,
          config: {
            type: activeMode === 'generation' ? (prompt.toLowerCase().includes('відео') ? 'video' : 'image') : undefined,
            aspectRatio: '16:9'
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process');
      setResult({
        text: data.text,
        type: data.type || 'success',
        image: data.imageBase64
      });
    } catch(err: any) {
      setResult({ text: "Помилка: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-fuchsia-400" />
            Media Forensics & AI Synthesis
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            Центр аналізу медіа-даних та генеративного інтелекту. Дозволяє транскрибувати аудіо, аналізувати відео-матеріали на наявність deepfake, генерувати реконструкції подій (Veo 3, Imagen 3) та перевіряти дані через Google Search & Maps Grounding.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-300">Veo 3.1 Fast</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-slate-300">Grounding</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800">
        <button
          onClick={() => { setActiveMode('analysis'); setPreviewImage(null); setBoxes([]); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'analysis' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <FileAudio className="w-4 h-4" />
          Аналіз Медіа (Video/Audio/Image)
        </button>
        <button
          onClick={() => { setActiveMode('generation'); setPreviewImage(null); setBoxes([]); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'generation' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Реконструкція (Генерація)
        </button>
        <button
          onClick={() => { setActiveMode('grounding'); setPreviewImage(null); setBoxes([]); setResult(null); }}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeMode === 'grounding' ? 'border-fuchsia-500 text-fuchsia-400' : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Map className="w-4 h-4" />
          Google Search & Maps Grounding
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Параметри завдання</h3>
            
            {activeMode === 'analysis' && (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,video/*,audio/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-700 transition-colors cursor-pointer bg-slate-950/50"
                >
                  <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-sm font-medium text-slate-300">
                    {previewImage ? "Змінити файл" : "Завантажити файл"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">MP4, MP3, WAV, JPG, PNG (Max 50MB)</span>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Тип аналізу</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>Комплексний аналіз (Gemini 3.1 Pro)</option>
                    <option>Транскрибація аудіо (Gemini 3.5 Flash)</option>
                    <option>Глибокий роздум (High Thinking)</option>
                  </select>
                </div>
              </div>
            )}
            {activeMode === 'generation' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Тип генерації</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>Зображення (Imagen 3 Pro)</option>
                    <option>Відео (Veo 3.1 Fast)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Співвідношення сторін</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>16:9 (Landscape)</option>
                    <option>9:16 (Portrait)</option>
                    <option>1:1 (Square)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Базове зображення (опціонально)</label>
                  <div className="border border-dashed border-slate-800 rounded-lg p-3 flex items-center justify-center cursor-pointer hover:border-slate-700 bg-slate-950/50">
                    <span className="text-xs text-slate-400 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Додати референс</span>
                  </div>
                </div>
              </div>
            )}
            {activeMode === 'grounding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Джерело Grounding</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500">
                    <option>Google Search (Останні новини)</option>
                    <option>Google Maps (Геодані та відгуки)</option>
                    <option>Search + Maps (Комбіновано)</option>
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-200/80 leading-relaxed">
                    Grounding підключає Gemini 3.5 Flash до реальних сервісів Google для забезпечення максимальної достовірності даних без галюцинацій.
                  </p>
                </div>
              </div>
            )}
            <div className="mt-5 pt-5 border-t border-slate-800">
              <label className="block text-xs text-slate-500 mb-1.5">Запит / Інструкція (Prompt)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500 resize-none"
                placeholder={activeMode === 'analysis' ? "Що саме шукати в цьому медіа?" : "Опишіть, що потрібно згенерувати..."}
              />
            </div>
            <button
              onClick={handleRunTask}
              disabled={loading}
              className="w-full mt-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(217,70,239,0.2)]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Виконати
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-2">
          <div className="bg-slate-950 border border-slate-800 rounded-xl h-[600px] overflow-hidden flex flex-col relative">
            <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between z-10 relative">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Результат обробки
              </span>
              {loading && (
                <span className="text-[10px] text-fuchsia-400 font-mono animate-pulse flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></div> PROCESSING...
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto relative p-6">
              {!result && !loading && !previewImage && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                  <Bot className="w-16 h-16 mb-4 text-slate-600" />
                  <p className="text-sm">Очікування завдання...</p>
                </div>
              )}

              {/* Image Preview with Client-Side Vision Overlay */}
              {previewImage && activeMode === 'analysis' && (
                <div className="mb-6 relative rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                  <img src={previewImage} alt="Preview" className="max-h-[400px] object-contain w-full" />
                  
                  {/* Scanning Animation */}
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-fuchsia-500/10 mix-blend-overlay"></div>
                      <motion.div 
                        initial={{ y: "0%" }}
                        animate={{ y: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute top-0 left-0 right-0 h-1 bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.8)]"
                      />
                      <div className="absolute top-4 left-4 flex items-center gap-2 text-fuchsia-400 font-mono text-xs">
                        <Scan className="w-4 h-4 animate-spin-slow" />
                        CLIENT-SIDE VISION SCAN ACTIVE
                      </div>
                    </div>
                  )}

                  {/* Bounding Boxes */}
                  <AnimatePresence>
                    {boxes.map((box) => (
                      <motion.div
                        key={box.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          height: `${box.h}%`
                        }}
                      >
                        <div className="absolute -top-6 left-[-2px] bg-red-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 whitespace-nowrap">
                          {box.label}
                        </div>
                        {/* Target reticles */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-400"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-400"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-400"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-400"></div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {loading && !isScanning && !previewImage && (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 border border-fuchsia-500/30 rounded-full animate-ping"></div>
                    <div className="w-16 h-16 rounded-full border border-fuchsia-500/50 flex items-center justify-center bg-fuchsia-500/5">
                      <Sparkles className="w-6 h-6 text-fuchsia-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-mono text-fuchsia-400">Ініціалізація нейромережі...</p>
                    <p className="text-xs text-slate-500">Виділення тензорних ядер для обробки {activeMode}</p>
                  </div>
                </div>
              )}
              
              <AnimatePresence>
                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {result.image && (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                         <img src={`data:image/jpeg;base64,${result.image}`} alt="Generated" className="max-h-[400px] object-contain w-full" />
                      </div>
                    )}
                    
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                      <p className="text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                        {result.text}
                      </p>
                    </div>
                    {/* Placeholder for generated images or video */}
                    {activeMode === 'generation' && !result.image && (
                      <div className="aspect-video bg-black border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden relative group">
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                           <span className="text-xs text-white font-mono bg-black/50 px-2 py-1 rounded">Generated by Veo 3.1</span>
                         </div>
                         <Video className="w-12 h-12 text-slate-700" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
