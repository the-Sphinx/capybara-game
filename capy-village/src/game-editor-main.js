import './gameEditor/game-editor.css';
import { GameContentEditor } from './gameEditor/GameContentEditor.js';

const host = document.getElementById('app');
const editor = new GameContentEditor(host, { gameId: 'math_garden' });

editor.init().catch((error) => {
  console.error(error);
  host.innerHTML = `
    <div class="game-editor-error">
      <h1>Game Content Editor Failed To Start</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
});
