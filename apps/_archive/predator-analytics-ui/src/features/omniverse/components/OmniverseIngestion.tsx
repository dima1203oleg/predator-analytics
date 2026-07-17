import { Button } from '@/components/ui/button';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Database, Zap, CheckCircle, AlertTriangle, Code, Play } from 'lucide-react';
import { omniverseService, SchemaDefinition } from '../../../services/omniverse';

export const OmniverseIngestion: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<SchemaDefinition | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [status, setStatus] = useState<string>('IDLE');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setLoading(true);
    setStatus('ANALYZING_SCHEMA');

    try {
      // 1. Read sample data (first 10 rows for CSV/JSON)
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        let sample_data: any[] = [];
        
        if (selectedFile.name.endsWith('.json')) {
          sample_data = JSON.parse(content).slice(0, 10);
        } else if (selectedFile.name.endsWith('.csv')) {
          // Simple CSV parse for sample
          const lines = content.split('\n').slice(0, 11);
          const headers = lines[0].split(',');
          sample_data = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj: any, header, i) => {
              obj[header.trim()] = values[i]?.trim();
              return obj;
            }, {});
          });
        }

        // 2. Infer schema via AI
        const inferredSchema = await omniverseService.inferSchema({
          file_name: selectedFile.name,
          sample_data
        });
        
        setSchema(inferredSchema);
        setStatus('SCHEMA_READY');
        setLoading(false);
      };
      
      if (selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.csv')) {
        reader.readAsText(selectedFile);
      } else {
        // For Excel etc we'd need more logic, but for MVP CSV/JSON is fine
        setStatus('ERROR');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setLoading(false);
    }
  };

  const startUniversalIngestion = async () => {
    if (!file || !schema) return;
    
    setIngesting(true);
    setStatus('INGESTING');
    
    try {
      const jobId = crypto.randomUUID();
      // In a real app, we'd upload the file to S3/MinIO first.
      // For this demo, we assume the file is somehow accessible or we'd trigger a real upload.
      
      await omniverseService.startIngestion({
          job_id: jobId,
          file_name: file.name,
          s3_path: `raw-uploads/${file.name}`,
          schema_definition: schema
      });
      
      setStatus('COMPLETED');
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-950/50 rounded-xl border border-emerald-500/20 ">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2">
            <Database className="text-emerald-400" />
            OMNIVERSE UNIVERSAL INGESTION
          </h2>
          <p className="text-emerald-400/60 font-mono text-xs">DYNAMIC SCHEMA INFERENCE ENGINE v70.0</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
            status === 'COMPLETED' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
            status === 'ERROR' ? 'bg-cyan-500/20 border-cyan-500 text-rose-400' :
            'bg-blue-500/20 border-blue-500 text-blue-400'
          }`}>
            STATUS: {status}
          </div>
        </div>
      </div>

      {!file && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/20 rounded-2xl py-20 group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden"
        >
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleFileUpload}
            accept=".csv,.json"
          />
          <div className="p-4 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all mb-4">
            <Upload className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold">ЗАВАНТАЖИТИ ДАНІ (CSV / JSON)</p>
            <p className="text-emerald-400/50 text-sm">AI автоматично розпізнає структуру та побудує онтологію</p>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-emerald-400 font-mono ">AI ANALYZING DATA STRUCTURE...</p>
        </div>
      )}

      <AnimatePresence>
        {schema && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* ClickHouse Table Schema */}
            <div className="bg-slate-900/80 p-5 rounded-xl border border-cyan-500/30">
              <h3 className="text-cyan-400 font-bold mb-4 flex items-center gap-2">
                <Database size={18} /> CLICKHOUSE ANALYTICS SCHEMA
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                {schema.clickhouse_schema.map((col, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs font-mono">
                    <span className="text-white">{col.name}</span>
                    <span className="text-cyan-400">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Neo4j Graph Ontology */}
            <div className="bg-slate-900/80 p-5 rounded-xl border border-purple-500/30">
              <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
                <Zap size={18} /> NEO4J GRAPH ONTOLOGY
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-[10px] uppercase font-bold mb-2 tracking-widest">Nodes Identified</p>
                  <div className="flex flex-wrap gap-2">
                    {schema.neo4j_ontology.nodes.map((node, idx) => (
                      <div key={idx} className="px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-[10px] text-purple-300">
                        ({node.label} : {node.key_field})
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white/60 text-[10px] uppercase font-bold mb-2 tracking-widest">Relationships Mapping</p>
                  <div className="space-y-2">
                    {schema.neo4j_ontology.relationships.map((rel, idx) => (
                      <div key={idx} className="p-2 bg-white/5 rounded border border-white/5 text-[10px] font-mono flex items-center gap-2">
                        <span className="text-purple-300">{rel.source_node_label}</span>
                        <span className="text-white/30">-{rel.relationship_type}{"->"}</span>
                        <span className="text-purple-300">{rel.target_node_label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-4">
              <Button variant="cyber" 
                onClick={() => setFile(null)}
                className="px-6 py-2 border border-cyan-500/50 text-cyan-500 rounded font-bold hover:bg-cyan-500/10 transition-all uppercase text-xs"
              >
                Cancel
              </Button>
              <Button variant="cyber" 
                onClick={startUniversalIngestion}
                disabled={ingesting}
                className="px-8 py-2 bg-emerald-500 text-slate-950 rounded font-black hover:bg-emerald-400 transition-all uppercase text-xs flex items-center gap-2 "
              >
                {ingesting ? <><div className="w-3 h-3 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" /> INGESTING...</> : <><Play size={14} /> EXECUTE UNIVERSAL INGESTION</>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'COMPLETED' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 flex flex-col items-center bg-emerald-500/10 border border-emerald-500/50 rounded-2xl"
        >
          <div className="p-4 rounded-full bg-emerald-500/20 mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tighter">DATA SUCCESSFULLY INGESTED</h3>
          <p className="text-emerald-400/70 text-center max-w-md mb-6">
            Ваші дані були успішно завантажені, нормалізовані та інтегровані в ClickHouse та Neo4j.
            Тепер ви можете досліджувати їх через Omniverse Explorer.
          </p>
          <Button variant="cyber" className="px-10 py-3 bg-emerald-500 text-slate-950 font-black rounded-lg hover:scale-105 transition-all">
            ПЕРЕЙТИ ДО АНАЛІТИКИ
          </Button>
        </motion.div>
      )}
    </div>
  );
};
