import React, {useEffect, useRef} from 'react';
import {Languages, X, ArrowUpRight, Shuffle, ChevronDown, Copy, Printer, Share2} from 'lucide-react';
export function Brand(){ return <span className="brand"><span className="brand-mark"><Languages size={18}/></span>С УВАЖЕНИЕМ.</span>; }
export const satireNotice = 'Юмористическая интерпретация, а не достоверное чтение чужих мыслей.';
export function Modal({title,subtitle,onClose,children}){
 const ref=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement; const old=document.body.style.overflow; document.body.style.overflow='hidden';
  const focusable=()=>[...ref.current.querySelectorAll('button:not(:disabled), a[href], input, textarea, [tabindex="0"]')];
  focusable()[0]?.focus();
  function key(e){
   if(e.key==='Escape')onClose();
   if(e.key==='Tab'){const items=focusable();const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
  }
  document.addEventListener('keydown',key);
  return ()=>{document.removeEventListener('keydown',key);document.body.style.overflow=old;previous?.focus();};
 },[onClose]);
 return <div className="modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-heading"><div><h2 id="dialog-title">{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-btn" onClick={onClose} aria-label="Закрыть"><X size={20}/></button></div>{children}</section></div>;
}
export function Examples({items,expanded,onExpand,onSelect,onRandom}){
 return <section className="examples-section" id="examples"><div className="section-heading"><div><h2>Попробовать на типичных ситуациях <span className="count">{items.length}</span></h2><p>Знакомо до боли. Выберите ситуацию — мы подберём слова.</p></div><button className="secondary" onClick={onRandom} aria-label="Случайный пример"><Shuffle size={13}/>Случайный пример</button></div><div className="example-grid">{(expanded?items:items.slice(0,6)).map(e=><button className="example-card" key={e.id} onClick={()=>onSelect(e)}><span className="example-top">{e.title}<ArrowUpRight size={14}/></span><p>«{e.input}»</p></button>)}</div>{items.length>6&&<div className="examples-bottom"><button className="text-btn" onClick={onExpand}>{expanded?'Свернуть':`Все ситуации в этом режиме (${items.length})`}<ChevronDown size={13} style={{transform:expanded?'rotate(180deg)':undefined}}/></button></div>}</section>;
}
export function ShareCard({result,onCopy,onShare}){
 return <><div className="share-card"><Brand/><p className="share-kicker">Что я думаю</p><div className="share-input">{result.input}</div><p className="share-kicker">Что я отправлю</p><div className="share-output">{result.text}</div>{result.mode==='reverse'&&<p className="disclaimer">{satireNotice}</p>}<div className="share-bottom"><span>Искренность осталась между нами.</span><Languages size={18}/></div><p className="disclaimer">{result.source==='demo'?'Готовый демонстрационный пример':'AI-перевод · проверьте смысл перед отправкой'}</p></div><div className="modal-footer"><button className="secondary" onClick={onCopy}><Copy size={14}/>Скопировать текст</button><button className="secondary" onClick={()=>window.print()}><Printer size={14}/>Печать / PDF</button><button className="primary" onClick={onShare}><Share2 size={14}/>Поделиться</button></div><p className="disclaimer">Для Stories сделайте скриншот карточки. Текст отправляется только после вашего подтверждения.</p></>;
}
