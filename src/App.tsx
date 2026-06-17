import { useReducer } from 'react';
import { canvasReducer, initialState } from './store/canvasReducer';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';

export default function App() {
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar dispatch={dispatch} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Toolbar state={state} />
        <Canvas state={state} dispatch={dispatch} />
      </div>
    </div>
  );
}
