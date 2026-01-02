import { WorkflowNode, Workflow, NodeType, NODE_CONFIG } from './types';

let nodeIdCounter = 0;

export const generateNodeId = (): string => {
  nodeIdCounter++;
  return `node-${nodeIdCounter}-${Date.now()}`;
};

export const resetNodeIdCounter = (): void => {
  nodeIdCounter = 0;
};

export const createNode = (
  type: NodeType,
  label: string,
  position: { x: number; y: number } = { x: 0, y: 0 }
): WorkflowNode => {
  const node: WorkflowNode = {
    id: generateNodeId(),
    type,
    label,
    position,
    children: [],
  };

  // Initialize branch labels for branch nodes
  if (type === 'branch') {
    node.branchLabels = {};
  }

  return node;
};

export const createInitialWorkflow = (): Workflow => {
  resetNodeIdCounter();
  const startNode = createNode('start', 'Start', { x: 400, y: 50 });

  return {
    nodes: { [startNode.id]: startNode },
    rootId: startNode.id,
  };
};

export const addNodeToWorkflow = (
  workflow: Workflow,
  parentId: string,
  newNodeType: NodeType,
  branchLabel?: string
): Workflow => {
  const parent = workflow.nodes[parentId];
  if (!parent) return workflow;

  const config = NODE_CONFIG[parent.type];

  // Check if parent can have more children
  if (parent.children.length >= config.maxChildren && parent.type !== 'branch') {
    return workflow;
  }

  // Create new node
  const parentY = parent.position.y;
  const parentX = parent.position.x;

  let newX = parentX;
  let newY = parentY + 120;

  // For branch nodes, position children side by side
  if (parent.type === 'branch') {
    const childIndex = parent.children.length;
    newX = parentX + (childIndex === 0 ? -150 : 150);
  }

  const newNode = createNode(newNodeType, getDefaultLabel(newNodeType), { x: newX, y: newY });

  const updatedParent: WorkflowNode = {
    ...parent,
    children: [...parent.children, newNode.id],
  };

  // Add branch label if it's a branch node
  if (parent.type === 'branch' && branchLabel) {
    updatedParent.branchLabels = {
      ...updatedParent.branchLabels,
      [newNode.id]: branchLabel,
    };
  }

  return {
    ...workflow,
    nodes: {
      ...workflow.nodes,
      [parent.id]: updatedParent,
      [newNode.id]: newNode,
    },
  };
};

export const deleteNodeFromWorkflow = (
  workflow: Workflow,
  nodeId: string
): Workflow => {
  const node = workflow.nodes[nodeId];
  if (!node || node.type === 'start') return workflow;

  // Find parent node
  let parentId: string | null = null;
  for (const [id, n] of Object.entries(workflow.nodes)) {
    if (n.children.includes(nodeId)) {
      parentId = id;
      break;
    }
  }

  const newNodes = { ...workflow.nodes };

  // Remove the node
  delete newNodes[nodeId];

  // Update parent to connect to deleted node's children
  if (parentId) {
    const parent = newNodes[parentId];
    const updatedChildren = parent.children.filter(id => id !== nodeId);

    // For non-branch parents, inherit the deleted node's children
    if (parent.type !== 'branch') {
      updatedChildren.push(...node.children);
    }

    newNodes[parentId] = {
      ...parent,
      children: updatedChildren,
    };
  }

  return {
    ...workflow,
    nodes: newNodes,
  };
};

export const updateNodeLabel = (
  workflow: Workflow,
  nodeId: string,
  newLabel: string
): Workflow => {
  const node = workflow.nodes[nodeId];
  if (!node) return workflow;

  return {
    ...workflow,
    nodes: {
      ...workflow.nodes,
      [nodeId]: {
        ...node,
        label: newLabel,
      },
    },
  };
};

const getDefaultLabel = (type: NodeType): string => {
  switch (type) {
    case 'start':
      return 'Start';
    case 'action':
      return 'Action';
    case 'branch':
      return 'Condition';
    case 'end':
      return 'End';
    default:
      return 'Node';
  }
};

// Calculate positions for all nodes using tree layout
export const calculateLayout = (workflow: Workflow): Workflow => {
  const nodes = { ...workflow.nodes };
  const root = nodes[workflow.rootId];
  if (!root) return workflow;

  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 120;

  const layoutNode = (
    nodeId: string,
    x: number,
    y: number,
    availableWidth: number
  ): void => {
    const node = nodes[nodeId];
    if (!node) return;

    nodes[nodeId] = {
      ...node,
      position: { x, y },
    };

    const children = node.children;
    if (children.length === 0) return;

    const childWidth = availableWidth / children.length;
    const startX = x - (availableWidth / 2) + (childWidth / 2);

    children.forEach((childId, index) => {
      const childX = startX + (index * childWidth);
      layoutNode(childId, childX, y + VERTICAL_SPACING, childWidth);
    });
  };

  layoutNode(workflow.rootId, 400, 50, 800);

  return {
    ...workflow,
    nodes,
  };
};
