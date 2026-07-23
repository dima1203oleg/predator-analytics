export interface KnowledgePattern {
  id: string;
  name: string;
  score?: number;
  status?: string;
  [key: string]: any;
}

export interface TrainingEpochData {
  epoch: number;
  loss: number;
  accuracy: number;
}
