"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";

export default function AgentProfile() {
   const [dark, setDark] = useState(false);

   useEffect(() => {
      document.documentElement.classList.toggle("dark", dark);
   }, [dark]);

   return (
      <div className="min-h-screen overflow-hidden bg-paper text-ink dark:bg-[#111214] dark:text-paper">
         <div className="pointer-events-none fixed inset-0 paper-noise opacity-50 dark:opacity-10" />

         <Header dark={dark} onToggleDark={() => setDark((value) => !value)} />

         <main className="relative mx-auto max-w-[1500px] px-5 py-10 sm:px-8">
            <Link
               href="/"
               className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent hover:underline"
            >
               ← Quay lại chat
            </Link>

            <div className="mt-8 max-w-md">
               <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent font-mono text-2xl font-bold text-white shadow-[4px_4px_0_rgba(21,20,23,.15)]">
                  A
               </span>

               <h1 className="mt-5 font-display text-3xl">Agent Profile</h1>
               <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">
                  Thông tin và cấu hình của agent
               </p>

               <div className="mt-8 space-y-1">
                  {[
                     ["Tên", "Agent 001"],
                     ["Model", "—"],
                     ["Trạng thái", "Đang hoạt động"],
                  ].map(([label, value]) => (
                     <div
                        key={label}
                        className="flex items-center justify-between border-b border-ink/10 py-3 font-mono text-[11px] uppercase tracking-wider dark:border-white/10"
                     >
                        <span className="text-ink/50 dark:text-paper/50">{label}</span>
                        <span className="normal-case tracking-normal text-ink dark:text-paper">
                           {value}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         </main>
      </div>
   );
}
