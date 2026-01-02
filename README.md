# Workflow Builder - Visual Workflow Design Tool

A visual workflow builder with interactive node-based editing for creating automation workflows.

## Features

- **Visual Workflow Canvas**: Interactive canvas with a clean grid background
- **Node Types**: 
  - **Start**: Root node (green) - cannot be deleted
  - **Action**: Single-step task node (blue) - one outgoing connection
  - **Branch**: Conditional decision node (amber) - multiple outgoing connections (True/False)
  - **End**: Terminal node (red) - no outgoing connections
- **Interactions**:
  - Click **+** on any node to add a new node
  - Double-click labels to edit inline
  - Click trash icon to delete nodes (with automatic reconnection)
- **Bonus Features**:
  - **Save**: Logs workflow JSON to browser console
  - **Undo/Redo**: Full history support for all changes

## Technology Stack

- **React 19** with functional components and hooks
- **Next.js 15** App Router
- **TypeScript** for type safety
- **Pure CSS** for styling (no UI component libraries)
- **Tailwind CSS** for utility classes only
- **lucide-react** for icons

> ⚠️ **No prohibited libraries used**: This project intentionally avoids ReactFlow, shadcn/ui, Material UI, Chakra UI, and animation libraries as per assignment requirements.

## Installation

```bash
# Clone the repository
git clone https://github.com/bjornleonhenry/workflow-builder.git
cd workflow-builder

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
workflow-builder/
├── app/
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── WorkflowCanvas.tsx  # Main canvas component
│   └── WorkflowCanvas.css  # Canvas styles
├── hooks/
│   └── useWorkflow.ts      # Workflow state management with undo/redo
├── lib/
│   ├── types.ts            # TypeScript definitions
│   └── workflow-utils.ts   # Node operations and layout algorithm
```

## Data Model

```typescript
type NodeType = 'start' | 'action' | 'branch' | 'end';

interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  children: string[];
  branchLabels?: { [childId: string]: string }; // "True" | "False"
}

interface Workflow {
  nodes: { [id: string]: WorkflowNode };
  rootId: string;
}
```

## Build

```bash
pnpm build
pnpm start
```

## License

MIT
