'use client'

import { useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

/** Non-modal action menu, positioned against the visible viewport and bottom nav. */
export default function ExpenseActionMenu({description,onEdit,onDelete}:{description:string;onEdit:()=>void;onDelete:()=>void}) {
 const [expanded,setExpanded]=useState(false)
 const trigger=useRef<HTMLButtonElement>(null), menu=useRef<HTMLDivElement>(null)
 const id=useId()
 useLayoutEffect(()=>{
  if(!expanded)return
  const panel=menu.current, anchor=trigger.current
  if(!panel || !anchor)return
  function position() {
   if(!panel || !anchor)return
   const rect=anchor.getBoundingClientRect(), viewport=window.visualViewport
   const left=viewport?.offsetLeft??0, top=viewport?.offsetTop??0
   const right=left+(viewport?.width??window.innerWidth)
   let bottom=top+(viewport?.height??window.innerHeight)
   const nav=document.querySelector('.mobile-bottom-nav')?.getBoundingClientRect()
   if(nav && nav.height>0 && nav.top<bottom)bottom=nav.top
   if(rect.bottom<top || rect.top>bottom || window.getComputedStyle(anchor).display==='none'){setExpanded(false);return}
   const height=panel.offsetHeight, width=panel.offsetWidth
   const x=Math.max(left+8,Math.min(rect.right-width,right-width-8))
   const below=rect.bottom+5
   const y=below+height<=bottom-8?below:Math.max(top+8,Math.min(rect.top-height-5,bottom-height-8))
   panel.style.left=`${x}px`;panel.style.top=`${y}px`
  }
  position()
  panel.querySelector('button')?.focus({preventScroll:true})
  function outside(event:PointerEvent) {
   if(event.target instanceof Node && !panel?.contains(event.target) && !anchor?.contains(event.target))setExpanded(false)
  }
  function focusOut(event:FocusEvent) {
   if(event.target instanceof Node && !panel?.contains(event.target) && !anchor?.contains(event.target))setExpanded(false)
  }
  function keydown(event:KeyboardEvent) {
   if(!panel)return
   const buttons=[...panel.querySelectorAll('button')]
   const index=buttons.indexOf(document.activeElement as HTMLButtonElement)
   if(event.key==='Escape'){event.preventDefault();setExpanded(false);anchor?.focus({preventScroll:true})}
   else if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault()
    buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus()
   } else if(event.key==='Tab') {
    // Continue the normal page tab sequence from the trigger rather than the body portal.
    anchor?.focus({preventScroll:true});setExpanded(false)
   }
  }
  document.addEventListener('pointerdown',outside)
  document.addEventListener('focusin',focusOut)
  panel.addEventListener('keydown',keydown)
  window.addEventListener('resize',position);window.addEventListener('scroll',position,true)
  window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position)
  return()=>{
   document.removeEventListener('pointerdown',outside);document.removeEventListener('focusin',focusOut)
   panel.removeEventListener('keydown',keydown)
   window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true)
   window.visualViewport?.removeEventListener('resize',position);window.visualViewport?.removeEventListener('scroll',position)
  }
 },[expanded])
 function choose(action:()=>void){trigger.current?.focus({preventScroll:true});setExpanded(false);action()}
 return <>
  <button ref={trigger} className="expenses-item-more" aria-label={`Opções de ${description}`} aria-haspopup="menu" aria-expanded={expanded} aria-controls={expanded?id:undefined} onClick={()=>setExpanded(current=>!current)} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setExpanded(true)}}}><MoreHorizontal size={20}/></button>
  {expanded && createPortal(<div ref={menu} id={id} role="menu" aria-label={`Opções de ${description}`} className="expenses-action-menu">
   <button role="menuitem" onClick={()=>choose(onEdit)}><Pencil size={16}/>Editar</button>
   <button role="menuitem" onClick={()=>choose(onDelete)}><Trash2 size={16}/>Excluir</button>
  </div>,document.body)}
 </>
}
