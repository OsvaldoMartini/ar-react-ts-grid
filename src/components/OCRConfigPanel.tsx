import React, { useMemo, useState } from 'react';
import { Eraser, Save, Trash2, X } from 'lucide-react';
import styles from './OCRConfigPanel.module.scss';

export type OCRProfile = { id:number; name:string; description?:string; homeBankingId?:number|null; homeUrlId?:number|null; default:boolean };
export type OCRParameter = { category:string; name:string; valueType:string; value:string; description?:string; options?:string[]; min?:number; max?:number; step?:number };
export type OCRConfigData = { profiles:OCRProfile[]; activeProfileId?:number|null; categories:string[]; parameters:OCRParameter[] };
type Props = { data:OCRConfigData; busy?:boolean; error?:string; onSelect:(id:number)=>void; onSave:(draft:{profileId?:number;name:string;description:string;parameters:OCRParameter[];asNew:boolean})=>void; onDelete:(id:number)=>void; onCleanup:()=>void; onClose:()=>void };

const OCRConfigPanel:React.FC<Props> = ({data,busy,error,onSelect,onSave,onDelete,onCleanup,onClose}) => {
  const active = data.profiles.find(p=>p.id===data.activeProfileId);
  const [name,setName] = useState(active?.name || '');
  const [description,setDescription] = useState(active?.description || '');
  const [parameters,setParameters] = useState(data.parameters);
  const [validation,setValidation] = useState('');
  const grouped = useMemo(()=>data.categories.map(category=>({category,items:parameters.filter(p=>p.category===category)})),[data.categories,parameters]);
  const select = (id:number) => { onSelect(id); };
  const update = (target:OCRParameter,value:string) => setParameters(items=>items.map(item=>item.category===target.category&&item.name===target.name?{...item,value}:item));
  const submit = (asNew:boolean) => { if(!name.trim()){setValidation('Profile name is required.');return;} onSave({profileId:active?.id,name:name.trim(),description:description.trim(),parameters,asNew}); };
  return <div className={styles.backdrop}><section className={styles.panel} aria-label="OCR configuration">
    <header><div><strong>OCR configuration</strong><small>Profile and recognition controls</small></div><button title="Close" onClick={onClose}><X size={18}/></button></header>
    <div className={styles.layout}>
      <aside><label>Profile<select value={active?.id || ''} onChange={e=>select(Number(e.target.value))}>{data.profiles.map(p=><option key={p.id} value={p.id}>{p.name}{p.default?' (default)':''}</option>)}</select></label><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label></aside>
      <main>{grouped.map(group=><section key={group.category}><h3>{group.category.replace(/_/g,' ')}</h3><div className={styles.fields}>{group.items.map(param=><label key={`${param.category}.${param.name}`} title={param.description}><span>{param.name.replace(/_/g,' ')}</span>{param.options?.length?<select value={param.value} onChange={e=>update(param,e.target.value)}>{param.options.map(v=><option key={v}>{v}</option>)}</select>:param.valueType==='boolean'?<input type="checkbox" checked={param.value==='true'} onChange={e=>update(param,String(e.target.checked))}/>:<input type={param.min!==undefined?'number':'text'} value={param.value} min={param.min} max={param.max} step={param.step} onChange={e=>update(param,e.target.value)}/>}</label>)}</div></section>)}</main>
    </div>
    {(validation||error)&&<p className={styles.error}>{validation||error}</p>}
    <footer><button disabled={!active||active.default||busy} onClick={()=>active&&onDelete(active.id)}><Trash2 size={15}/>Delete</button><button disabled={busy} onClick={onCleanup}><Eraser size={15}/>Clean orphans</button><span/><button disabled={busy} onClick={()=>submit(true)}>Save as new</button><button className={styles.primary} disabled={busy} onClick={()=>submit(false)}><Save size={15}/>Save</button></footer>
  </section></div>;
};
export default OCRConfigPanel;
