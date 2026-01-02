'use client';

import { useState, useCallback, useEffect } from 'react';
import { Workflow, NodeType, HistoryState } from '@/lib/types';
import {
    createInitialWorkflow,
    addNodeToWorkflow,
    deleteNodeFromWorkflow,
    updateNodeLabel,
    calculateLayout,
} from '@/lib/workflow-utils';

const MAX_HISTORY = 50;
const STORAGE_KEY = 'workflow-builder-data';

export function useWorkflow() {
    // Always start with a fresh workflow to avoid hydration mismatch
    const [history, setHistory] = useState<HistoryState>(() => {
        const initial = createInitialWorkflow();
        return {
            past: [],
            present: calculateLayout(initial),
            future: [],
        };
    });

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage AFTER hydration (client-side only)
    useEffect(() => {
        if (isLoaded) return;

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validate that parsed data has required structure
                if (parsed.nodes && parsed.rootId) {
                    setHistory({
                        past: [],
                        present: calculateLayout(parsed),
                        future: [],
                    });
                }
            } catch (e) {
                console.error('Failed to parse saved workflow:', e);
            }
        }
        setIsLoaded(true);
    }, [isLoaded]);

    const workflow = history.present;

    const pushHistory = useCallback((newWorkflow: Workflow) => {
        setHistory(prev => ({
            past: [...prev.past.slice(-MAX_HISTORY + 1), prev.present],
            present: calculateLayout(newWorkflow),
            future: [],
        }));
    }, []);

    const addNode = useCallback((parentId: string, type: NodeType, branchLabel?: string) => {
        const newWorkflow = addNodeToWorkflow(workflow, parentId, type, branchLabel);
        if (newWorkflow !== workflow) {
            pushHistory(newWorkflow);
        }
    }, [workflow, pushHistory]);

    const deleteNode = useCallback((nodeId: string) => {
        const newWorkflow = deleteNodeFromWorkflow(workflow, nodeId);
        if (newWorkflow !== workflow) {
            pushHistory(newWorkflow);
        }
    }, [workflow, pushHistory]);

    const editLabel = useCallback((nodeId: string, newLabel: string) => {
        const newWorkflow = updateNodeLabel(workflow, nodeId, newLabel);
        if (newWorkflow !== workflow) {
            pushHistory(newWorkflow);
        }
    }, [workflow, pushHistory]);

    const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
        const node = workflow.nodes[nodeId];
        if (!node) return;

        const newWorkflow = {
            ...workflow,
            nodes: {
                ...workflow.nodes,
                [nodeId]: {
                    ...node,
                    position,
                },
            },
        };
        // Don't push to history for drag operations (too many states)
        setHistory(prev => ({
            ...prev,
            present: newWorkflow,
        }));
    }, [workflow]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const previous = prev.past[prev.past.length - 1];
            return {
                past: prev.past.slice(0, -1),
                present: previous,
                future: [prev.present, ...prev.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const next = prev.future[0];
            return {
                past: [...prev.past, prev.present],
                present: next,
                future: prev.future.slice(1),
            };
        });
    }, []);

    const saveWorkflow = useCallback(() => {
        setSaveStatus('saving');

        // Save to localStorage
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }

        // Also log to console as per assignment requirement
        console.log('=== Workflow Data Structure ===');
        console.log(JSON.stringify(workflow, null, 2));
        console.log('===============================');

        // Show "Saved" status briefly
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);

        return workflow;
    }, [workflow]);

    const loadWorkflow = useCallback(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.nodes && parsed.rootId) {
                    setHistory({
                        past: [],
                        present: calculateLayout(parsed),
                        future: [],
                    });
                    return true;
                }
            } catch (e) {
                console.error('Failed to load workflow:', e);
            }
        }
        return false;
    }, []);

    const resetWorkflow = useCallback(() => {
        const initial = createInitialWorkflow();
        setHistory({
            past: [],
            present: calculateLayout(initial),
            future: [],
        });
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    return {
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
    };
}
