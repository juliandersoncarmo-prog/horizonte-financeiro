import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mock = vi.hoisted(() => ({ signIn:vi.fn(), options:undefined as unknown }))
vi.mock('@supabase/ssr', () => ({createServerClient: (_u:unknown,_k:unknown,options:unknown) => {mock.options=options;return {auth:{signInWithPassword:mock.signIn}}}}))
import { POST } from './route'
type Options = {cookies:{getAll:()=>unknown[];setAll:(v:unknown[])=>void};global:{fetch:typeof fetch}}
function request(body:unknown={email:'user@example.invalid',password:'password'},origin='https://test.example') {return new NextRequest('https://test.example/api/auth/login',{method:'POST',headers:{origin,'content-type':'application/json',cookie:'old-cookie=old'},body:JSON.stringify(body)})}
beforeEach(() => {vi.clearAllMocks();mock.signIn.mockResolvedValue({data:{session:{access_token:'secret'},user:{id:'user'}},error:null})})
afterEach(() => vi.useRealTimers())
it('rejects another origin before contacting Auth',async()=>{expect((await POST(request(undefined,'https://evil.invalid'))).status).toBe(403);expect(mock.signIn).not.toHaveBeenCalled()})
it.each([{email:'invalid',password:'p'},{email:'user@example.invalid',password:''},{email:'user@example.invalid',password:32}])('validates input',async body=>{expect((await POST(request(body))).status).toBe(400);expect(mock.signIn).not.toHaveBeenCalled()})
it('returns only success and delivers SSR chunk cookies with HTTPS and SameSite protection',async()=>{
 mock.signIn.mockImplementation(async()=>{(mock.options as Options).cookies.setAll([{name:'sb-test-auth-token.0',value:'chunk',options:{path:'/',maxAge:300}}]);return {data:{session:{access_token:'secret'},user:{id:'user'}},error:null}})
 const response=await POST(request());expect(response.status).toBe(200);expect(await response.json()).toEqual({success:true});expect(response.headers.get('cache-control')).toBe('no-store');expect(response.cookies.get('sb-test-auth-token.0')).toMatchObject({value:'chunk',secure:true,sameSite:'lax',path:'/'});expect((mock.options as Options).cookies.getAll()).toEqual([{name:'old-cookie',value:'old'}])
})
it.each([{code:'invalid_credentials',status:400},{code:'email_not_confirmed',status:400},{status:429},{status:503}])('handles SDK failures without leaking their messages %j',async error=>{mock.signIn.mockResolvedValue({data:{},error:{...error,message:'sensitive internal info'}});const response=await POST(request());expect(response.status).toBeGreaterThanOrEqual(400);expect(response.headers.get('set-cookie')).toBeNull();expect(await response.text()).not.toContain('sensitive')})
it('bounds a stuck SDK call, without publishing late session cookies',async()=>{
 vi.useFakeTimers();let finish!:()=>void
 mock.signIn.mockImplementation(()=>new Promise(resolve=>{finish=()=>{(mock.options as Options).cookies.setAll([{name:'late-cookie',value:'late',options:{}}]);resolve({data:{session:{},user:{}},error:null})}}))
 const pending=POST(request());await vi.advanceTimersByTimeAsync(10000);const response=await pending;expect(response.status).toBe(503);finish();await Promise.resolve();expect(response.headers.get('set-cookie')).toBeNull()
})
it('catches thrown transport failures and accepts a new attempt',async()=>{mock.signIn.mockRejectedValueOnce(new Error('offline'));expect((await POST(request())).status).toBe(503);expect((await POST(request())).status).toBe(200)})
