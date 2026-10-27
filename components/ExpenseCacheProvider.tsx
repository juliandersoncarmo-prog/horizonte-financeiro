'use client'
import {createContext,useContext,useState,type ReactNode} from 'react'
import {ExpenseMonthCache} from '@/lib/expense-month-cache'
const Context=createContext<ExpenseMonthCache|null>(null)
export function ExpenseCacheProvider({children}:{children:ReactNode}) {
 const [cache]=useState(()=>new ExpenseMonthCache())
 return <Context.Provider value={cache}>{children}</Context.Provider>
}
export function useExpenseMonthCache() {
 const shared=useContext(Context)
 const [local]=useState(()=>new ExpenseMonthCache())
 return shared??local
}
