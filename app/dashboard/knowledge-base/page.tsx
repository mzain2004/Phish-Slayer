"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, Search, BookOpen, Tag, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeBasePage() {
  const { user } = useUser();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchText] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    async function loadOrg() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data) {
        fetchArticles(data.organization_id);
      }
    }
    loadOrg();
  }, [user]);

  async function fetchArticles(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge-base?organizationId=${id}`);
      if (res.ok) setArticles(await res.json());
    } catch (e) {
      toast.error("Failed to load knowledge base");
    } finally {
      setLoading(false);
    }
  }

  const filtered = articles.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-8 text-white max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-primary" />
            Knowledge Base
          </h1>
          <p className="text-white/50 text-sm">Security runbooks, procedures, and past incident references</p>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10">
         <Search className="w-5 h-5 text-white/40 ml-2" />
         <input 
            className="bg-transparent flex-1 outline-none text-sm"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={e => setSearchText(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 flex flex-col gap-4">
            {loading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : 
              filtered.map(a => (
                <div 
                  key={a.id} 
                  onClick={() => setSelectedArticle(a)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedArticle?.id === a.id ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                   <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{a.category}</p>
                   <p className="font-bold text-sm">{a.title}</p>
                   <div className="flex items-center gap-3 mt-3 text-[10px] text-white/40">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.updated_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {a.tags?.length || 0} tags</span>
                   </div>
                </div>
              ))
            }
         </div>

         <div className="lg:col-span-2">
            {selectedArticle ? (
              <DashboardCard className="p-8 min-h-[500px] animate-in fade-in slide-in-from-right-4">
                 <h2 className="text-2xl font-bold mb-2">{selectedArticle.title}</h2>
                 <div className="flex items-center gap-4 text-xs text-white/40 mb-8 border-b border-white/10 pb-4">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase">{selectedArticle.category}</span>
                    <span>Created by {selectedArticle.created_by}</span>
                    <span>Updated {new Date(selectedArticle.updated_at).toLocaleString()}</span>
                 </div>
                 <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedArticle.content}
                 </div>
              </DashboardCard>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/20 p-20 border-2 border-dashed border-white/5 rounded-3xl">
                 <BookOpen className="w-16 h-16 mb-4" />
                 <p>Select an article to view details</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
