'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { WorkflowNode, NODE_CONFIG, NodeType } from '@/lib/types';
import { useWorkflow } from '@/hooks/useWorkflow';
import {
    Undo2,
    Redo2,
    Save,
    Upload,
    RotateCcw,
    Plus,
    Trash2,
    X,
    Circle,
    GitBranch,
    Square,
    Zap,
    Check,
    ZoomIn,
    ZoomOut,
    Move,
    Maximize2
} from 'lucide-react';
import './WorkflowCanvas.css';

interface AddNodeMenuProps {
    parentId: string;
    parentType: NodeType;
    onAddNode: (parentId: string, type: NodeType, branchLabel?: string) => void;
    onClose: () => void;
    position: { x: number; y: number };
}

const AddNodeMenu: React.FC<AddNodeMenuProps> = ({
    parentId,
    parentType,
    onAddNode,
    onClose,
    position
}) => {
    const nodeOptions: { type: NodeType; label: string; icon: React.ReactNode }[] = [
        { type: 'action', label: 'Action', icon: <Zap size={16} /> },
        { type: 'branch', label: 'Branch', icon: <GitBranch size={16} /> },
        { type: 'end', label: 'End', icon: <Square size={16} /> },
    ];

    const handleAddNode = (type: NodeType, branchLabel?: string) => {
        onAddNode(parentId, type, branchLabel);
        onClose();
    };

    // For branch nodes, show which branch to add to
    if (parentType === 'branch') {
        return (
            <div
                className="add-node-menu"
                style={{ left: position.x, top: position.y }}
            >
                <div className="add-node-menu-header">
                    <span>Add to branch</span>
                    <button onClick={onClose} className="close-btn">
                        <X size={14} />
                    </button>
                </div>
                <div className="branch-options">
                    <div className="branch-label">True Path</div>
                    {nodeOptions.map(opt => (
                        <button
                            key={`true-${opt.type}`}
                            className="menu-item"
                            onClick={() => handleAddNode(opt.type, 'True')}
                        >
                            {opt.icon}
                            <span>{opt.label}</span>
                        </button>
                    ))}
                    <div className="branch-label">False Path</div>
                    {nodeOptions.map(opt => (
                        <button
                            key={`false-${opt.type}`}
                            className="menu-item"
                            onClick={() => handleAddNode(opt.type, 'False')}
                        >
                            {opt.icon}
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className="add-node-menu"
            style={{ left: position.x, top: position.y }}
        >
            <div className="add-node-menu-header">
                <span>Add Node</span>
                <button onClick={onClose} className="close-btn">
                    <X size={14} />
                </button>
            </div>
            {nodeOptions.map(opt => (
                <button
                    key={opt.type}
                    className="menu-item"
                    onClick={() => handleAddNode(opt.type)}
                >
                    {opt.icon}
                    <span>{opt.label}</span>
                </button>
            ))}
        </div>
    );
};

interface NodeComponentProps {
    node: WorkflowNode;
    onDelete: (id: string) => void;
    onEditLabel: (id: string, label: string) => void;
    onAddClick: (id: string, position: { x: number; y: number }) => void;
    onDragStart: (id: string, e: React.MouseEvent) => void;
    branchLabel?: string;
    isDragging: boolean;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
    node,
    onDelete,
    onEditLabel,
    onAddClick,
    onDragStart,
    branchLabel,
    isDragging
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(node.label);
    const inputRef = useRef<HTMLInputElement>(null);
    const config = NODE_CONFIG[node.type];

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setEditValue(node.label);
    }, [node.label]);

    const handleDoubleClick = () => {
        if (node.type !== 'start') {
            setIsEditing(true);
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== node.label) {
            onEditLabel(node.id, editValue.trim());
        } else {
            setEditValue(node.label);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setEditValue(node.label);
            setIsEditing(false);
        }
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        onAddClick(node.id, { x: rect.left, y: rect.bottom + 5 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't start drag if clicking on buttons or editing
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input') ||
            isEditing
        ) {
            return;
        }
        e.preventDefault();
        onDragStart(node.id, e);
    };

    const getIcon = () => {
        switch (node.type) {
            case 'start':
                return <Circle size={18} />;
            case 'action':
                return <Zap size={18} />;
            case 'branch':
                return <GitBranch size={18} />;
            case 'end':
                return <Square size={18} />;
        }
    };

    return (
        <div
            className={`workflow-node ${isDragging ? 'dragging' : ''}`}
            style={{
                left: node.position.x,
                top: node.position.y,
                borderColor: config.borderColor,
                backgroundColor: config.bgColor,
            }}
            onMouseDown={handleMouseDown}
        >
            {branchLabel && (
                <div
                    className="branch-path-label"
                    style={{ color: branchLabel === 'True' ? '#22c55e' : '#ef4444' }}
                >
                    {branchLabel}
                </div>
            )}

            {/* Target handle (top) */}
            {node.type !== 'start' && (
                <div className="handle handle-target" style={{ backgroundColor: config.color }} />
            )}

            <div className="node-content">
                <div className="node-icon" style={{ color: config.color, backgroundColor: `${config.color}20` }}>
                    {getIcon()}
                </div>
                <div className="node-info">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="node-label-input"
                        />
                    ) : (
                        <div
                            className="node-label"
                            onDoubleClick={handleDoubleClick}
                            title="Double-click to edit"
                        >
                            {node.label}
                        </div>
                    )}
                    <div className="node-type">{node.type}</div>
                </div>

                {config.canDelete && (
                    <button
                        className="delete-btn"
                        onClick={() => onDelete(node.id)}
                        title="Delete node"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Drag indicator */}
            <div className="drag-indicator" title="Drag to move">
                <Move size={12} />
            </div>

            {/* Source handle (bottom) */}
            {config.canAddChildren && (
                <div className="handle-container">
                    {node.type === 'branch' ? (
                        <>
                            <div
                                className="handle handle-source handle-branch-true"
                                style={{ backgroundColor: '#22c55e' }}
                            />
                            <div
                                className="handle handle-source handle-branch-false"
                                style={{ backgroundColor: '#ef4444' }}
                            />
                        </>
                    ) : (
                        <div className="handle handle-source" style={{ backgroundColor: config.color }} />
                    )}
                    <button
                        className="add-btn"
                        onClick={handleAddClick}
                        title="Add node"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

interface ConnectionLineProps {
    fromNode: WorkflowNode;
    toNode: WorkflowNode;
    branchLabel?: string;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({ fromNode, toNode, branchLabel }) => {
    const fromConfig = NODE_CONFIG[fromNode.type];

    // Node width is 180px, but nodes are translated -50% so position.x is the center
    const nodeWidth = 180;
    const nodeHeight = 80; // Approximate node height including handles

    // Start point - bottom center of from node
    let startX = fromNode.position.x;
    const startY = fromNode.position.y + nodeHeight;

    // For branch nodes, offset the start point to true/false handle positions
    if (fromNode.type === 'branch') {
        const handleOffset = nodeWidth / 4; // 25% from center for true, 75% for false
        startX = fromNode.position.x + (branchLabel === 'True' ? -handleOffset : handleOffset);
    }

    // End point - top center of to node
    const endX = toNode.position.x;
    const endY = toNode.position.y;

    // Create a smooth bezier curve
    const midY = (startY + endY) / 2;
    const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

    const lineColor = branchLabel === 'True' ? '#22c55e' :
        branchLabel === 'False' ? '#ef4444' :
            fromConfig.color;

    return (
        <g>
            <path
                d={path}
                fill="none"
                stroke={lineColor}
                strokeWidth="2"
                className="connection-line"
            />
            {/* Arrow marker */}
            <polygon
                points={`${endX},${endY} ${endX - 5},${endY - 10} ${endX + 5},${endY - 10}`}
                fill={lineColor}
            />
        </g>
    );
};

export default function WorkflowCanvas() {
    const {
        workflow,
        addNode,
        deleteNode,
        editLabel,
        updateNodePosition,
        undo,
        redo,
        canUndo,
        canRedo,
        saveWorkflow,
        loadWorkflow,
        resetWorkflow,
        saveStatus,
    } = useWorkflow();

    const [menuState, setMenuState] = useState<{
        isOpen: boolean;
        parentId: string;
        parentType: NodeType;
        position: { x: number; y: number };
    } | null>(null);

    // Zoom and pan state
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Drag state
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleAddClick = useCallback((parentId: string, position: { x: number; y: number }) => {
        const parent = workflow.nodes[parentId];
        if (parent) {
            setMenuState({
                isOpen: true,
                parentId,
                parentType: parent.type,
                position,
            });
        }
    }, [workflow.nodes]);

    const handleAddNode = useCallback((parentId: string, type: NodeType, branchLabel?: string) => {
        addNode(parentId, type, branchLabel);
    }, [addNode]);

    const handleCloseMenu = useCallback(() => {
        setMenuState(null);
    }, []);

    // Close menu when clicking outside
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('canvas-content')) {
            setMenuState(null);
        }
    }, []);

    const handleReset = useCallback(() => {
        if (confirm('Are you sure you want to reset the workflow? This cannot be undone.')) {
            resetWorkflow();
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
    }, [resetWorkflow]);

    // Zoom handling with mouse wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(Math.max(zoom + delta, 0.25), 2);

        // Zoom towards mouse position
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Adjust pan to zoom towards mouse
            const zoomRatio = newZoom / zoom;
            const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
            const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

            setPan({ x: newPanX, y: newPanY });
        }

        setZoom(newZoom);
    }, [zoom, pan]);

    // Pan start (middle mouse button or canvas drag)
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        // Middle mouse button or if clicking on empty canvas area
        if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).classList.contains('canvas-content'))) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    }, [pan]);

    // Node drag start
    const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
        const node = workflow.nodes[nodeId];
        if (!node) return;

        setDraggingNodeId(nodeId);

        // Calculate offset from mouse to node position
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;
            setDragOffset({
                x: mouseX - node.position.x,
                y: mouseY - node.position.y,
            });
        }
    }, [workflow.nodes, pan, zoom]);

    // Mouse move for panning and dragging
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        } else if (draggingNodeId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;

            updateNodePosition(draggingNodeId, {
                x: mouseX - dragOffset.x,
                y: mouseY - dragOffset.y,
            });
        }
    }, [isPanning, panStart, draggingNodeId, dragOffset, pan, zoom, updateNodePosition]);

    // Mouse up to stop panning/dragging
    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
        setDraggingNodeId(null);
    }, []);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        setZoom(z => Math.min(z + 0.25, 2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(z => Math.max(z - 0.25, 0.25));
    }, []);

    const handleResetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    // Add global mouse events for dragging outside canvas
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsPanning(false);
            setDraggingNodeId(null);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    // Render connection lines
    const renderConnections = () => {
        const connections: React.ReactNode[] = [];

        Object.values(workflow.nodes).forEach(node => {
            node.children.forEach(childId => {
                const childNode = workflow.nodes[childId];
                if (childNode) {
                    const branchLabel = node.branchLabels?.[childId];
                    connections.push(
                        <ConnectionLine
                            key={`${node.id}-${childId}`}
                            fromNode={node}
                            toNode={childNode}
                            branchLabel={branchLabel}
                        />
                    );
                }
            });
        });

        return connections;
    };

    // Render nodes
    const renderNodes = () => {
        return Object.values(workflow.nodes).map(node => {
            // Find parent to get branch label
            let branchLabel: string | undefined;
            for (const parentNode of Object.values(workflow.nodes)) {
                if (parentNode.children.includes(node.id) && parentNode.branchLabels) {
                    branchLabel = parentNode.branchLabels[node.id];
                    break;
                }
            }

            return (
                <NodeComponent
                    key={node.id}
                    node={node}
                    onDelete={deleteNode}
                    onEditLabel={editLabel}
                    onAddClick={handleAddClick}
                    onDragStart={handleNodeDragStart}
                    branchLabel={branchLabel}
                    isDragging={draggingNodeId === node.id}
                />
            );
        });
    };

    const getSaveButtonContent = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <>
                        <div className="spinner" />
                        <span>Saving...</span>
                    </>
                );
            case 'saved':
                return (
                    <>
                        <Check size={18} />
                        <span>Saved!</span>
                    </>
                );
            default:
                return (
                    <>
                        <Save size={18} />
                        <span>Save</span>
                    </>
                );
        }
    };

    return (
        <div className="workflow-builder">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-title">
                    <h1>Workflow Builder</h1>
                </div>
                <div className="toolbar-actions">
                    <button
                        className="toolbar-btn"
                        onClick={undo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={redo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 size={18} />
                    </button>
                    <div className="toolbar-divider" />

                    {/* Zoom controls */}
                    <button
                        className="toolbar-btn"
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.25}
                        title="Zoom out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                    <button
                        className="toolbar-btn"
                        onClick={handleZoomIn}
                        disabled={zoom >= 2}
                        title="Zoom in"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={handleResetView}
                        title="Reset view"
                    >
                        <Maximize2 size={18} />
                    </button>

                    <div className="toolbar-divider" />
                    <button
                        className="toolbar-btn"
                        onClick={loadWorkflow}
                        title="Load saved workflow"
                    >
                        <Upload size={18} />
                        <span>Load</span>
                    </button>
                    <button
                        className="toolbar-btn"
                        onClick={handleReset}
                        title="Reset workflow"
                    >
                        <RotateCcw size={18} />
                        <span>Reset</span>
                    </button>
                    <div className="toolbar-divider" />
                    <button
                        className={`toolbar-btn primary ${saveStatus === 'saved' ? 'success' : ''}`}
                        onClick={saveWorkflow}
                        title="Save workflow (localStorage + console)"
                    >
                        {getSaveButtonContent()}
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className={`workflow-canvas ${isPanning ? 'panning' : ''} ${draggingNodeId ? 'dragging-node' : ''}`}
                onWheel={handleWheel}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Transform container for zoom and pan */}
                <div
                    ref={contentRef}
                    className="canvas-content"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: '0 0',
                    }}
                    onClick={handleCanvasClick}
                >
                    {/* Grid background */}
                    <div className="canvas-grid" />

                    {/* SVG layer for connections */}
                    <svg className="connections-layer">
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                            </marker>
                        </defs>
                        {renderConnections()}
                    </svg>

                    {/* Nodes layer */}
                    <div className="nodes-layer">
                        {renderNodes()}
                    </div>
                </div>

                {/* Add node menu */}
                {menuState?.isOpen && (
                    <AddNodeMenu
                        parentId={menuState.parentId}
                        parentType={menuState.parentType}
                        onAddNode={handleAddNode}
                        onClose={handleCloseMenu}
                        position={menuState.position}
                    />
                )}
            </div>

            {/* Instructions */}
            <div className="instructions">
                <span><Move size={12} /> Drag nodes to move</span>
                <span>Scroll to zoom</span>
                <span>Click + drag canvas to pan</span>
                <span>Click <Plus size={12} /> to add nodes</span>
                <span>Double-click labels to edit</span>
            </div>
        </div>
    );
}
