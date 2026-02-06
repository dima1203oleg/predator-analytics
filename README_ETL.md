# Predator Customs ETL & Graph Sync (v28.8)

## 🎯 Project Goals Achieved
* [x] **Production ETL Pipeline**: Implemented `CustomsExcelParser` with dynamic Regex mapping and strict validation.
* [x] **Customs Schema**: Created `customs` schema in PostgreSQL with tables for Declarations, Goods, Participants, and Telegram Links.
* [x] **Telegram Sync**: Implemented `analyze_customs_intel` task to link Telegram mentions to official declarations.
* [x] **Knowledge Graph (Neo4j)**: Integrated Neo4j synchronization into the extraction pipeline.
* [x] **UI Integration**: Updated `PipelineMonitor`, `EntityGraphView`, and `CustomsIntelligenceView` to show real data.

## 🚀 How to Execute the Import

### Option A: Standard (Requires Docker Socket Access)
```bash
./scripts/execute_customs_import.sh ./data_staging/Березень_2024.xlsx
```

### Option B: Magic API Import (Bypasses Docker CLI)
If you have permission issues with Docker socket, use this method. It uploads the file directly to the running backend via HTTP.

```bash
# 1. Ensure backend is running
# 2. Run the magic script
./scripts/magic_import.sh ./data_staging/Березень_2024.xlsx
```

The system will:
1. Parse the Excel file using the new production parser.
2. Ingest data into the `customs` schema.
3. Trigger the `analyze_customs_intel` worker to scan for Telegram mentions.
4. Sync discovered entities (Companies, Declarations) to Neo4j.

## 📊 Monitoring
* **Pipeline Monitor**: View real-time stats (Success/Rejected/Anomalies) during import.
* **Customs Registry**: View the Gold Layer registry with all declarations.
* **Entity Graph**: View relationships between companies and their declarations.

## 🛠 Technical Stack
* **Backend**: FastAPI, Celery, AsyncPG, Neo4j Driver.
* **NLP**: Regex-based entity extraction + Sentiment analysis.
* **Database**: PostgreSQL (TimescaleDB) + Neo4j.
* **Frontend**: React + Framer Motion + Recharts.
