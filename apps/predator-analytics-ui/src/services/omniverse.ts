import axios from 'axios';

const API_BASE = '/api/v1/omniverse';

export interface SchemaInferenceRequest {
  file_name: string;
  sample_data: any[];
}

export interface SchemaDefinition {
  target_table: string;
  column_mapping: Record<string, string>;
  clickhouse_schema: Array<{ name: string; type: string }>;
  neo4j_ontology: {
    nodes: Array<{ label: string; key_field: string; properties: string[] }>;
    relationships: Array<{
      source_node_label: string;
      source_key_field: string;
      target_node_label: string;
      target_key_field: string;
      relationship_type: string;
    }>;
  };
}

export interface IngestionRequest {
  job_id: string;
  file_name: string;
  s3_path: string;
  schema_definition: SchemaDefinition;
}

export const omniverseService = {
  inferSchema: async (data: SchemaInferenceRequest): Promise<SchemaDefinition> => {
    const response = await axios.post(`${API_BASE}/schema/infer`, data);
    return response.data;
  },

  startIngestion: async (data: IngestionRequest): Promise<{ job_id: string; status: string }> => {
    const response = await axios.post(`${API_BASE}/ingest`, data);
    return response.data;
  }
};
