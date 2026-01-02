// Workflow Node Types as per assignment requirements
export type NodeType = 'start' | 'action' | 'branch' | 'end';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  children: string[];  // IDs of child nodes
  branchLabels?: { [childId: string]: string }; // For branch nodes: labels for each path
}

export interface Workflow {
  nodes: { [id: string]: WorkflowNode };
  rootId: string;
}

// Node type configurations
export const NODE_CONFIG: Record<NodeType, {
  maxChildren: number;
  color: string;
  bgColor: string;
  borderColor: string;
  canDelete: boolean;
  canAddChildren: boolean;
}> = {
  start: {
    maxChildren: 1,
    color: '#22c55e',
    bgColor: '#dcfce7',
    borderColor: '#22c55e',
    canDelete: false,
    canAddChildren: true,
  },
  action: {
    maxChildren: 1,
    color: '#3b82f6',
    bgColor: '#dbeafe',
    borderColor: '#3b82f6',
    canDelete: true,
    canAddChildren: true,
  },
  branch: {
    maxChildren: 2, // True and False branches
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b',
    canDelete: true,
    canAddChildren: true,
  },
  end: {
    maxChildren: 0,
    color: '#ef4444',
    bgColor: '#fee2e2',
    borderColor: '#ef4444',
    canDelete: true,
    canAddChildren: false,
  },
};

// History state for undo/redo
export interface HistoryState {
  past: Workflow[];
  present: Workflow;
  future: Workflow[];
}
