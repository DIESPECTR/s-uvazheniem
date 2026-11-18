import test from 'node:test';
import assert from 'node:assert/strict';
import {examples,modes,findExample} from '../src/examples.js';
import {translate,validate,systemPrompt} from '../server/translate.js';
import {readHistory,saveHistory,readTheme} from '../src/storage.js';
const base={text:'Не буду работать в субботу',mode:'boss',level:2};
const env={AI_API_KEY:'server-secret',AI_BASE_URL:'https://mock.example/v1/',AI_MODEL:'test-model'};
test('TC1: all forty examples are unique, complete and available without AI',async()=>{
 assert.equal(examples.length,40);assert.equal(new Set(examples.map(e=>e.id)).size,40);
 assert.deepEqual(modes.map(m=>examples.filter(e=>e.mode===m.id).length),[10,8,6,16]);
 for(const e of examples){assert.ok(e.input&&e.output&&e.title);assert.equal(findExample(e.input,e.mode).id,e.id);assert.equal(findExample(e.input,'invalid'),undefined);const result=await translate({text:e.input,mode:e.mode,level:2},{env:{}});assert.equal(result.source,'demo');assert.equal(result.text,e.output);}
});
test('TC2: validate empty, oversized, unsupported input and honest no-key errors',async()=>{
 for(const body of [null,{}, {...base,text:' '},{...base,text:'x'.repeat(6001)},{...base,mode:'bad'},{...base,level:4},{...base,action:'bad'}])assert.throws(()=>validate(body),e=>e.status===400);
 assert.equal(validate({...base,text:'x'.repeat(6000)}).text.length,6000);
 await assert.rejects(translate(base,{env:{}}),e=>e.status===503);
 await assert.rejects(translate({text:examples[0].input,mode:'hr',level:3,action:'alternative'},{env:{}}),e=>e.status===503);
});
test('TC2: live AI path uses server key, model, tone and arbitrary input',async()=>{
 let request;
 const result=await translate({...base,level:3,action:'alternative',previous:'Ранее согласовано.'},{env,fetchImpl:async(url,options)=>{request={url,options,body:JSON.parse(options.body)};return {ok:true,json:async()=>({choices:[{message:{content:'  Смогу вернуться к задаче в рабочее время.  '}}]})};}});
 assert.equal(result.source,'ai');assert.equal(result.text,'Смогу вернуться к задаче в рабочее время.');
 assert.equal(request.url,'https://mock.example/v1/chat/completions');assert.equal(request.options.headers.Authorization,'Bearer server-secret');assert.equal(request.body.model,'test-model');assert.equal(request.body.messages[1].content,base.text);assert.equal(request.body.messages.length,4);assert.match(request.body.messages[0].content,/HR-директор 3000/);assert.ok(request.options.signal);assert.ok(!JSON.stringify(result).includes('server-secret'));
 assert.match(systemPrompt('reverse',1),/не чтение мыслей/);
});
test('TC2: provider error, empty AI response, timeout and preset fallback',async()=>{
 for(const fetchImpl of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({choices:[]})}),async()=>{throw Object.assign(new Error('network'),{name:'TimeoutError'});}]){
  await assert.rejects(translate(base,{env,fetchImpl}),e=>e.status===502);
  const e=examples[12];const result=await translate({text:e.input,mode:e.mode,level:3},{env,fetchImpl});assert.equal(result.source,'demo');assert.equal(result.text,e.output);assert.match(result.notice,/не применяется/);
 }
});
test('TC3: local history is bounded, malformed storage is safe',()=>{
 const data=new Map();globalThis.localStorage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const entry={input:'Оригинал',text:'Перевод',mode:'boss',level:2,source:'demo',time:Date.now()};
 assert.equal(saveHistory(Array.from({length:40},()=>entry)),true);assert.equal(readHistory().length,30);
 data.set('respect.history.v1','not json');assert.deepEqual(readHistory(),[]);
 data.set('respect.history.v1',JSON.stringify([{},null,{...entry,level:99},entry]));assert.equal(readHistory().length,1);
 data.set('respect.theme','dark');assert.equal(readTheme(),'dark');
 globalThis.localStorage={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};assert.deepEqual(readHistory(),[]);assert.equal(saveHistory([]),false);assert.equal(readTheme(),'light');delete globalThis.localStorage;
});

test('TC7: Luna defaults and legacy model request contracts',async()=>{
 for(const model of [undefined,'gpt-6-luna-2026-09-22','gpt-4o-mini']){
  let request;
  const providerEnv={AI_API_KEY:'server-secret',...(model?{AI_MODEL:model}:{})};
  const result=await translate(base,{env:providerEnv,fetchImpl:async(_url,options)=>{
   request=JSON.parse(options.body);
   return {ok:true,json:async()=>({choices:[{message:{content:'Вернусь к задаче в рабочее время.'}}]})};
  }});
  assert.equal(result.source,'ai');
  assert.equal(request.model,model||'gpt-6-luna');
  assert.equal(request.messages[1].content,base.text);
  if(model==='gpt-4o-mini'){
   assert.equal(request.temperature,0.65);assert.equal(request.max_tokens,1800);
   assert.ok(!('reasoning_effort' in request));assert.ok(!('max_completion_tokens' in request));
  }else{
   assert.equal(request.reasoning_effort,'none');assert.equal(request.max_completion_tokens,1800);
   assert.ok(!('temperature' in request));assert.ok(!('max_tokens' in request));
  }
 }
});


test('TC12: report route has 15 honest demos and its own prompt',async()=>{
 const {reportExamples}=await import('../src/reportExamples.js');
 assert.equal(reportExamples.length,15);
 assert.equal(new Set(reportExamples.map(e=>e.input)).size,15);
 for(const e of reportExamples){
  const response=await translate({target:'report',text:e.input},{env:{}});
  assert.equal(response.source,'demo');assert.equal(response.text,e.output);assert.match(response.notice,/не AI/);
 }
 const body={...base,target:'report',action:'translate'};
 assert.throws(()=>validate({...body,target:null}),e=>e.status===400);
 assert.throws(()=>validate({...body,action:'alternative'}),e=>e.status===400);
 await assert.rejects(translate(body,{env:{}}),e=>e.status===503);
 const prompts=[];
 const fetchImpl=async(_url,options)=>{const {model,messages}=JSON.parse(options.body);assert.equal(model,'gpt-6-luna');assert.equal(messages[0].role,'system');prompts.push(messages[0].content);assert.equal(messages[1].content,base.text);return {ok:true,json:async()=>({choices:[{message:{content:'Формулировка'}}]})};};
 const provider={env:{AI_API_KEY:'mock-only'},fetchImpl};
 assert.equal((await translate(body,provider)).source,'ai');
 assert.equal((await translate({...base,target:'chat'},provider)).source,'ai');
 assert.notEqual(prompts[0],prompts[1]);
 assert.match(prompts[0],/Я\.БЛАН/);assert.match(prompts[0],/не выдумывай действия/);assert.match(prompts[1],/меняй только тон/);
 const fallback=await translate({target:'report',text:reportExamples[0].input},{env,fetchImpl:async()=>({ok:false})});
 assert.equal(fallback.source,'demo');assert.match(fallback.notice,/AI недоступен/);
});
