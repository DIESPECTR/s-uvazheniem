import React,{useState,useEffect,useRef,useCallback} from 'react';
import {BriefcaseBusiness,Users,Building2,Languages,Sun,Moon,History,MessageCircle,Sparkles,ArrowRight,ArrowLeftRight,Copy,Check,ShieldCheck,LockKeyhole,Trash2,SlidersHorizontal,RotateCw,Share2,LoaderCircle,ChevronRight,Heart,Info,Zap} from 'lucide-react';
import {modes,examples,findExample} from './examples.js';
import {readHistory,saveHistory,readTheme,saveTheme} from './storage.js';
import {Brand,Modal,Examples,ShareCard,satireNotice} from './components.jsx';
const modeIcons=[BriefcaseBusiness,Users,Building2,Languages];
const levels=['Почти человек','Корпоративный сотрудник','HR-директор 3000'];
const statuses=['Удаляем искренность…','Подавляем желание уволиться…','Добавляем командную синергию…','Заменяем мат на профессиональный рост…','Повышаем стрессоустойчивость текста…','Вставляем уважение там, где его нет…','Проверяем совместимость с LinkedIn…'];
export default function App(){
 const [mode,setMode]=useState('colleagues');
 const [text,setText]=useState(examples.find(e=>e.id===13).input);
 const [level,setLevel]=useState(2),[result,setResult]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [ai,setAi]=useState(null),[theme,setTheme]=useState(readTheme),[history,setHistory]=useState(readHistory),[modal,setModal]=useState(null);
 const [toast,setToast]=useState(''),[expanded,setExpanded]=useState(false),[status,setStatus]=useState(0),[copied,setCopied]=useState(false);
 const requestRef=useRef(null),version=useRef(0),inputRef=useRef(null),toastTimer=useRef(null),copyTimer=useRef(null);
 const closeModal=useCallback(()=>setModal(null),[]);
 const notify=useCallback(message=>{setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4200);},[]);
 useEffect(()=>{document.body.dataset.theme=theme;saveTheme(theme);},[theme]);
 useEffect(()=>{const controller=new AbortController();fetch('/api/status',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>setAi(Boolean(data.ai))).catch(()=>{});return()=>controller.abort();},[]);
 useEffect(()=>{if(!loading)return;setStatus(0);const timer=setInterval(()=>setStatus(s=>(s+1)%statuses.length),360);return()=>clearInterval(timer);},[loading]);
 useEffect(()=>()=>{requestRef.current?.abort();clearTimeout(toastTimer.current);clearTimeout(copyTimer.current);},[]);
 function cancel(){version.current++;requestRef.current?.abort();setLoading(false);setError('');setCopied(false);}
 function editText(value){cancel();setText(value);setResult(null);}
 function changeMode(next){if(next===mode)return;cancel();setMode(next);setResult(null);setExpanded(false);setText(examples.find(e=>e.id===({hr:2,colleagues:13,boss:20,reverse:36}[next])).input);if(next==='hr')notify('Режим собеседования активирован. Искренность временно отключена.');}
 function selectExample(example){cancel();setMode(example.mode);setText(example.input);setResult(null);if(!window.matchMedia('(max-width: 560px)').matches)inputRef.current?.focus({preventScroll:true});document.getElementById('translator')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 function randomExample(){const pool=examples.filter(e=>e.mode===mode&&e.input!==text);selectExample(pool[Math.floor(Math.random()*pool.length)]);}
 function changeLevel(next){cancel();setLevel(next);setResult(null);if(next===3)notify('Внимание: ваш текст может быть опубликован в LinkedIn.');}
 async function runTranslation(action='translate',override={}){
  const sourceText=override.text??text,sourceMode=override.mode??mode,sourceLevel=override.level??level;
  if(!sourceText.trim()){setError('Сначала напишите, что вы на самом деле думаете.');inputRef.current?.focus();return;}
  if(sourceText.length>6000){setError('Максимум — 6000 символов. Даже у корпоративного терпения есть предел.');return;}
  cancel();const id=version.current;const controller=new AbortController();requestRef.current=controller;setLoading(true);
  try{
   let data;
   const example=findExample(sourceText,sourceMode);
   if(ai===false&&example&&action==='translate'){
    data={text:example.output,source:'demo',notice:'Готовый пример · уровень тона и альтернативы доступны с AI'};
   }else{
    const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:sourceText,mode:sourceMode,level:sourceLevel,action,previous:result?.text||''}),signal:controller.signal});
    data=await response.json();if(!response.ok)throw Error(data.error||'Не удалось выполнить перевод.');
   }
   if(id!==version.current)return;
   const entry={...data,input:sourceText,mode:sourceMode,level:sourceLevel,time:Date.now()};setResult(entry);
   const updated=[entry,...history.filter(item=>item.input!==entry.input||item.text!==entry.text||item.mode!==entry.mode)].slice(0,30);
   setHistory(updated);if(!saveHistory(updated))notify('Перевод готов, но браузер не разрешил сохранить историю.');
  }catch(err){if(err.name!=='AbortError'&&id===version.current)setError(err instanceof TypeError?'Связь потеряна. Ваш текст на месте — попробуйте ещё раз.':err instanceof SyntaxError?'Сервер вернул некорректный ответ. Ваш текст на месте — попробуйте ещё раз.':err.message||'Не удалось выполнить перевод. Ваш текст на месте — попробуйте ещё раз.');}
  finally{if(id===version.current)setLoading(false);}
 }
 async function copy(value=result?.text){
  if(!value)return;
  try{await navigator.clipboard.writeText(value);setCopied(true);clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopied(false),2500);notify('Скопировано. Теперь можете притворяться командным игроком.');}
  catch{notify('Копирование недоступно. Выделите текст и скопируйте вручную.');}
 }
 function reverseResult(){const value=result.text;cancel();setMode('reverse');setText(value);setResult(null);setExpanded(false);runTranslation('translate',{text:value,mode:'reverse'});}
 function stronger(){const next=Math.min(3,level+1);setLevel(next);runTranslation('stronger',{level:next});}
 function restore(entry){cancel();setMode(entry.mode);setText(entry.input);setLevel(entry.level);setResult(entry);setModal(null);setExpanded(false);}
 async function share(){const value=`С УВАЖЕНИЕМ.\n\nЧто я думаю:\n${result.input}\n\nЧто я отправлю:\n${result.text}${result.mode==='reverse'?'\n\n'+satireNotice:''}`;if(navigator.share){try{await navigator.share({title:'С УВАЖЕНИЕМ.',text:value});}catch(e){if(e.name!=='AbortError')notify('Не удалось поделиться. Скопируйте текст или сохраните PDF.');}}else{await copy(value);}}
 const modeExamples=examples.filter(e=>e.mode===mode),isReverse=mode==='reverse';
 const preview=!result&&!loading?findExample(text,mode):null;
 const translateButton=<button className="primary" disabled={loading||!text.trim()} onClick={()=>runTranslation()}>{loading?<LoaderCircle size={15} className="spinner"/>:<Sparkles size={15}/>} {loading?'Дипломатия в процессе…':'Перевести этот пиздец'}{!loading&&<ArrowRight size={15}/>}</button>;
 return <>
  <header className="topbar"><a href="#" aria-label="С УВАЖЕНИЕМ. — главная"><Brand/></a><nav className="top-links" aria-label="Основная навигация"><a href="#examples">Примеры</a><button className="text-btn" onClick={()=>setModal('about')}>О проекте</button><span className="top-divider"/><button className="text-btn history-button" onClick={()=>setModal('history')}><History size={14}/>История{history.length>0&&<span className="history-count">{history.length}</span>}</button><button className="icon-btn" onClick={()=>setTheme(t=>t==='light'?'dark':'light')} aria-label={theme==='light'?'Включить тёмную тему':'Включить светлую тему'}>{theme==='light'?<Moon size={17}/>:<Sun size={17}/>}</button></nav></header>
  <main>
   <section className="hero"><span className="eyebrow"><span className="dot"/>Корпоративная дипломатия как сервис</span><h1>С УВАЖЕНИЕМ.</h1><p>Профессиональная коммуникация для людей,<br className="mobile-break"/> которые <strong>уже заебались.</strong></p><p className="tagline">Ваши настоящие мысли не должны попадать в рабочий чат.</p></section>
   <section id="translator" aria-label="Корпоративный переводчик">
    <div className="mode-caption"><span>С кем сегодня держим себя в руках?</span><button className="text-btn quick-example" onClick={randomExample}><RotateCw size={13}/>Ещё один пиздец</button><span className={`service-note ${ai?'online':''}`}><span className="status-dot"/>{ai===null?'Проверяем AI…':ai?'AI подключён':'Деморежим · 40 примеров'}</span></div>
    <div className="mode-tabs" role="group" aria-label="Режим перевода">{modes.map((m,i)=>{const Icon=modeIcons[i];return <button key={m.id} className={`mode-tab ${mode===m.id?'active':''}`} aria-pressed={mode===m.id} onClick={()=>changeMode(m.id)}><span className="mode-icon"><Icon size={17}/></span><span><b>{m.label}</b><small>{m.description}</small></span>{mode===m.id&&<span className="selected-dot"/>}</button>;})}</div>
    {isReverse&&<div className="warning"><Info size={13}/> {satireNotice}</div>}
    <div className="translator">
     <div className="editor-grid">
      <section className="input-panel"><div className="panel-title"><h2 id="input-label"><MessageCircle size={15}/>{isReverse?'Что вам написали?':'Что вы на самом деле хотите сказать?'}</h2><button className="icon-btn" aria-label="Очистить поле" title="Очистить поле" disabled={!text&&!result} onClick={()=>{editText('');notify('Все обвинения уничтожены.');inputRef.current?.focus();}}><Trash2 size={14}/></button></div><textarea ref={inputRef} aria-labelledby="input-label" aria-describedby="input-help" value={text} maxLength={6000} placeholder={isReverse?'Вставьте сообщение, в котором слишком много синергии…':'Пишите как есть. Например: «Этот созвон мог быть сообщением, блять». '} onChange={e=>editText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();if(!loading)runTranslation();}}}/><div className="input-meta"><span id="input-help"><LockKeyhole size={10}/>Не переживайте, здесь можно говорить правду.</span><span>{text.length.toLocaleString('ru-RU')} / 6 000</span></div></section>
      <div className="mobile-translate">{translateButton}</div>
      <section className="output-panel" aria-busy={loading} aria-labelledby="output-label"><div className="panel-title"><h2 id="output-label"><Sparkles size={15}/>{isReverse?'А теперь — по-человечески':'Версия, за которую вас не уволят'}</h2><span className="panel-label">{isReverse?'БЕЗ ФИЛЬТРОВ':'БЕЗОПАСНО ДЛЯ ЧАТА'}</span></div><div aria-live="polite" className={loading||(!result&&!preview)?'result-placeholder':undefined}>{loading?<><span className="placeholder-icon"><LoaderCircle className="spinner" size={20}/></span><span className="loading-text">{isReverse?'Расшифровываем синергию…':statuses[status]}</span></>:result?<p key={result.time} className="result-text">{result.text}</p>:preview?<><p key={preview.id} className="result-text preview-text">{preview.output}</p><p className="source-label preview-label">Готовый пример · не AI · уровень тона не применяется</p></>:<><span className="placeholder-icon"><Sparkles size={21}/></span><p>Здесь появится ваша профессиональная версия.</p><small>Тот же смысл. Ни одного повода для встречи с HR.</small></>}</div>
       {result&&!loading&&<><div className="result-meta"><span><ShieldCheck size={12}/>{isReverse?'Искренность восстановлена. Почти.':'Ваше сообщение прошло корпоративную цензуру.'}</span><button className="secondary" onClick={()=>copy()}>{copied?<Check size={12}/>:<Copy size={12}/>} {copied?'Скопировано':'Скопировать'}</button></div><div className="result-actions">{!isReverse&&<button className="secondary" disabled={loading} onClick={stronger}><Sparkles size={11}/>Ещё более корпоративно</button>}<button className="secondary" disabled={loading} onClick={()=>runTranslation('alternative')}><RotateCw size={11}/>Другая формулировка</button><button className="secondary" onClick={()=>setModal('share')} aria-label="Поделиться карточкой"><Share2 size={12}/></button></div><div className="source-label">{result.source==='demo'?result.notice||'Готовый демонстрационный пример':`AI-перевод · ${levels[result.level-1]}. Проверьте смысл перед отправкой.`}</div></>}
      </section>
     </div>
     <div className="translator-footer"><div className="level-control"><div className="level-heading"><span><SlidersHorizontal size={12}/>{isReverse?'Уровень сатирической едкости':'Уровень корпоративного лицемерия'}</span><b title="Шуточный показатель, не настоящая метрика">{[12,67,97][level-1]}%</b></div><input aria-label="Уровень корпоративного лицемерия" aria-valuetext={levels[level-1]} type="range" min="1" max="3" step="1" value={level} onChange={e=>changeLevel(Number(e.target.value))}/><div className="level-labels">{levels.map((name,i)=><span key={name} className={level===i+1?'current':''}>{name}</span>)}</div></div><div className="translate-area"><button className="primary" disabled={loading||!text.trim()} onClick={()=>runTranslation()}>{loading?<LoaderCircle size={15} className="spinner"/>:<Sparkles size={15}/>} {loading?'Дипломатия в процессе…':'Перевести этот пиздец'}{!loading&&<ArrowRight size={15}/>}</button><small>{ai===false?'Готовые примеры работают без AI. Произвольный текст — с API.':'Без регистрации. Без осуждения. С уважением.'}</small></div></div>
     {error&&<div className="error-message" role="alert">{error}</div>}
    </div>
    <div className="below-editor"><span><ShieldCheck size={11}/>История хранится только в вашем браузере.</span>{mode==='hr'?<button className="text-btn offer-btn" onClick={()=>{changeLevel(3);notify('Мне нужен оффер. Дипломатичность — на максимум. Для генерации нужен AI.');}}><BriefcaseBusiness size={12}/>Мне нужен оффер</button>:result&&!isReverse?<button className="text-btn" onClick={reverseResult}><ArrowLeftRight size={12}/>Вернуть человеческий язык</button>:<button className="text-btn" onClick={randomExample}>Не знаете, с чего начать? Случайный пример<ChevronRight size={12}/></button>}</div>
   </section>
   <Examples items={modeExamples} expanded={expanded} onExpand={()=>setExpanded(v=>!v)} onSelect={selectExample} onRandom={randomExample}/>
   <div className="trust-strip"><span><LockKeyhole size={12}/>Без регистрации</span><span><Zap size={12}/>Меньше драмы. Больше синергии.</span><span><Heart size={12}/>Бесплатно. Как ваши переработки.</span></div>
  </main>
  <footer className="site-footer"><Brand/><p>Сохраняем работу. Не гарантируем душевное равновесие.</p><button className="text-btn" onClick={()=>setModal('privacy')}>Конфиденциальность<ChevronRight size={11}/></button></footer>
  {toast&&<div className="toast" role="status">{toast}</div>}
  {modal==='history'&&<Modal title="История дипломатии" subtitle="Последние 30 переводов. Только в этом браузере." onClose={closeModal}>{history.length?<><div className="history-list">{history.map((entry,i)=><button key={`${entry.time}-${i}`} className="history-item" onClick={()=>restore(entry)}><small>{modes.find(m=>m.id===entry.mode)?.label} · {new Date(entry.time).toLocaleDateString('ru-RU')} · {entry.source==='demo'?'Готовый пример':'AI'}</small><span>{entry.input}</span></button>)}</div><div className="modal-footer"><button className="secondary" onClick={()=>{if(window.confirm('Удалить всю локальную историю?')){setHistory([]);saveHistory([]);notify('Все обвинения уничтожены.');}}}><Trash2 size={14}/>Очистить историю</button></div></>:<div className="empty-history"><History size={30}/><p>Пока всё спокойно.<br/>Ваш первый перевод появится здесь.</p></div>}</Modal>}
  {modal==='share'&&result&&<Modal title="Корпоративная открытка" subtitle="Сохраните для друга, который тоже держится." onClose={closeModal}><ShareCard result={result} onCopy={()=>copy(`С УВАЖЕНИЕМ.\n\n${result.input}\n\n${result.text}${isReverse?'\n\n'+satireNotice:''}`)} onShare={share}/></Modal>}
  {modal==='about'&&<Modal title="Серьёзный продукт. Несерьёзная жизнь." onClose={closeModal}><div className="about-body"><p><strong>С УВАЖЕНИЕМ.</strong> — сатирический переводчик для всех, кто знает разницу между «принято» и тем, что хочется написать на самом деле.</p><p>Выберите адресата, напишите честно и настройте тон. AI сохранит мысль, но переоденет её в корпоративный костюм. Готовые 40 примеров работают и без AI — они всегда помечены.</p><p>Без подключённого AI смена уровня не меняет готовую пару. Для произвольных сообщений и альтернатив нужен серверный API-ключ.</p><p>{satireNotice} Перед отправкой проверьте результат: дипломатия не заменяет здравый смысл.</p><p>Быстрый перевод: <kbd>⌘ / Ctrl + Enter</kbd>.</p></div></Modal>}
  {modal==='privacy'&&<Modal title="Искренность — личное дело" onClose={closeModal}><div className="about-body"><p>История последних 30 переводов сохраняется локально в вашем браузере. Её можно удалить в разделе «История». Регистрации, аналитических трекеров и базы пользовательских сообщений нет.</p><p>Готовые примеры в деморежиме обрабатываются прямо в браузере. Для AI-перевода текст передаётся нашему серверу и настроенному AI-провайдеру. У провайдера могут действовать собственные правила хранения. Не отправляйте пароли, персональные данные и коммерческие секреты.</p><p>Шрифт загружается из Google Fonts. При шаринге ничего не публикуется автоматически — только по вашему действию.</p></div></Modal>}
 </>;
}
