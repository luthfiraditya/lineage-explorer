import { tasks as tasksJson } from './tasks';
export type Task = typeof tasksJson[0];

import lineageJson from './lineage.json';

export interface LineageNode {
  id: string;
  label: string;
  layer: string;
  col: number;
  pages: string[];
}

export interface LineageEdge {
  source: string;
  target: string;
}

export interface LineageData {
  nodes: LineageNode[];
  edges: LineageEdge[];
  pages: string[];
}

export const lineageData = lineageJson as LineageData;
export const tasks = tasksJson;

