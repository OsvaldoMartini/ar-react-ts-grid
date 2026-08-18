import React, { useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import styles from './SaveComponentPanel.module.scss';

export type SaveComponentContext = {
  blockId: number; blockName: string; blockOrderNumber: number;
  instructions: Array<{ instructionId: number; blockId: number; blockOrderNumber: number; instructionOrderNumber: number }>;
};
type Props = { context: SaveComponentContext; onSubmit: (name: string, description: string) => void; onClose: () => void };

const SaveComponentPanel: React.FC<Props> = ({ context, onSubmit, onClose }) => {
  const [name, setName] = useState(context.blockName);
  const [description, setDescription] = useState(`${context.blockName} description`);
  const [error, setError] = useState('');
  const submit = () => {
    if (!name.trim()) { setError('Component name is required.'); return; }
    if (!description.trim()) { setError('Component description is required.'); return; }
    onSubmit(name.trim(), description.trim());
  };
  return <div className={styles.backdrop} role="presentation">
    <section className={styles.panel} aria-label="Save component">
      <header><PackagePlus size={19}/><span><strong>Save component</strong><small>#{context.blockOrderNumber} · {context.instructions.length} instruction{context.instructions.length === 1 ? '' : 's'}</small></span><button title="Close" onClick={onClose}><X size={17}/></button></header>
      <div className={styles.form}>
        <label>Component name<input value={name} maxLength={100} onChange={e => setName(e.target.value)}/></label>
        <label>Description<textarea value={description} maxLength={500} onChange={e => setDescription(e.target.value)}/></label>
        {error && <p>{error}</p>}
      </div>
      <footer><button onClick={onClose}>Cancel</button><button className={styles.save} onClick={submit}>Save component</button></footer>
    </section>
  </div>;
};
export default SaveComponentPanel;
