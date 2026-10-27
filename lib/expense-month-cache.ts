import type { ExpenseMonth } from './daily-expenses'
export type MonthResult = {success:true;data:ExpenseMonth}|{success:false;error:string}
/** In-memory only. Owned by the authenticated layout; never persisted or shared on the server. */
export class ExpenseMonthCache {
 readonly entries = new Map<string,{data:ExpenseMonth;at:number}>()
 private pending = new Map<string,Promise<MonthResult>>()
 private epochs = new Map<string,number>()
 revision: string | undefined
 setRevision(value:string) {this.revision=value}
 constructor(private readonly ttl=60000) {}
 peek(key:string) { return this.entries.get(key) }
 invalidate(keys=[...new Set([...this.entries.keys(),...this.pending.keys()])]) {
  for(const key of keys) {this.epochs.set(key,(this.epochs.get(key)??0)+1);const entry=this.entries.get(key);if(entry)entry.at=0;this.pending.delete(key)}
 }
 get(key:string,load:(key:string)=>Promise<MonthResult>):Promise<MonthResult> {
  const hit=this.entries.get(key)
  if(hit && Date.now()-hit.at<this.ttl)return Promise.resolve({success:true,data:hit.data})
  const existing=this.pending.get(key);if(existing)return existing
  const epoch=this.epochs.get(key)
  const promise=load(key).then(result=>{
   if(this.epochs.get(key)!==epoch)return {success:false as const,error:'Os dados mudaram. Tente novamente.'}
   if(result.success){this.entries.delete(key);this.entries.set(key,{data:result.data,at:Date.now()});if(this.entries.size>6)this.entries.delete(this.entries.keys().next().value!)}
   return result
  }).finally(()=>{if(this.pending.get(key)===promise)this.pending.delete(key)})
  this.pending.set(key,promise);return promise
 }
}
