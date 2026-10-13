// @vitest-environment happy-dom
import { webcrypto } from 'node:crypto'
import { beforeEach, expect, it, vi } from 'vitest'
import { cardCreationRequest } from './card-request'
beforeEach(()=>{ sessionStorage.clear(); vi.stubGlobal('crypto',webcrypto) })
it('reuses an unconfirmed request after reopen without storing financial fields',async()=>{
 const input={nome:'Private card name',valor:1200}
 const first=await cardCreationRequest(input), second=await cardCreationRequest(input)
 expect(second).toEqual(first)
 expect(sessionStorage.getItem(first.key)).toBe(first.id)
 expect(first.key).not.toContain('Private')
 expect(await cardCreationRequest({...input,valor:1300})).not.toEqual(first)
 sessionStorage.removeItem(first.key)
 expect((await cardCreationRequest(input)).id).not.toBe(first.id)
})
