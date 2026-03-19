import './editor/editor.css';
import { LayoutEditor } from './editor/LayoutEditor.js';

const host = document.getElementById('app');
const editor = new LayoutEditor(host);

editor.init().catch((error) => {
  console.error(error);
  host.innerHTML = `
    <div class="layout-editor-error">
      <h1>Layout Editor Failed To Start</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
    </div>
  `;
});
