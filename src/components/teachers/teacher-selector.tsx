"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";

type SimpleTeacher = { id: string; name: string; email?: string; phone?: string };

interface TeacherSelectorProps {
  teachers: SimpleTeacher[];
  value: string | "";
  onChange: (id: string) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  triggerLabel?: string;
  dialogTitle?: string;
}

export function TeacherSelector({
  teachers,
  value,
  onChange,
  placeholder = "Select a teacher",
  allowNone = false,
  noneLabel = "No teacher assigned",
  triggerLabel,
  dialogTitle = "Select Teacher",
}: TeacherSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  const selected = teachers.find((t) => t.id === value);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recent_teachers");
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const setRecentSafe = (ids: string[]) => {
    setRecent(ids);
    try {
      localStorage.setItem("recent_teachers", JSON.stringify(ids.slice(0, 8)));
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? teachers.filter((t) => t.name.toLowerCase().includes(q) || t.phone?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
      : teachers;
    // Group by first letter of name for readability
    const groups: Record<string, SimpleTeacher[]> = {};
    for (const t of list) {
      const key = (t.name[0] || "").toUpperCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    const orderedKeys = Object.keys(groups).sort();
    orderedKeys.forEach((k) => groups[k].sort((a, b) => a.name.localeCompare(b.name)));
    return { groups, orderedKeys };
  }, [teachers, query]);

  const handlePick = (id: string) => {
    onChange(id);
    if (id) {
      const next = [id, ...recent.filter((x) => x !== id)];
      setRecentSafe(next);
    }
    setOpen(false);
  };

  const clearPick = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" className="w-full justify-between" onClick={() => setOpen(true)}>
        <span>{selected ? selected.name : allowNone && !value ? noneLabel : triggerLabel || placeholder}</span>
        <Search className="h-4 w-4 opacity-60" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search by name, phone, email"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const q = query.trim().toLowerCase();
                    const first = (q
                      ? teachers.filter((t) => t.name.toLowerCase().includes(q) || t.phone?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
                      : teachers)[0];
                    if (first) handlePick(first.id);
                  }
                }}
              />
            </div>
          </div>
          {allowNone && (
            <div className="px-6 pb-2">
              <Button variant="ghost" className="w-full justify-start" onClick={clearPick}>
                {noneLabel}
              </Button>
            </div>
          )}
          {recent.length > 0 && (
            <div className="px-6 pb-2">
              <div className="text-xs text-muted-foreground mb-1">Recent</div>
              <div className="flex flex-wrap gap-2">
                {recent
                  .map((id) => teachers.find((t) => t.id === id))
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((t) => (
                    <Button key={t!.id} variant="secondary" size="sm" onClick={() => handlePick(t!.id)}>
                      {t!.name}
                    </Button>
                  ))}
              </div>
            </div>
          )}
          <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto">
            {filtered.orderedKeys.length === 0 ? (
              <div className="text-sm text-muted-foreground px-2 py-3">No teachers found</div>
            ) : (
              filtered.orderedKeys.map((key) => (
                <div key={key} className="mb-3">
                  <div className="text-xs text-muted-foreground px-2 mb-1">{key}</div>
                  <div className="divide-y border rounded-md">
                    {filtered.groups[key].map((t) => (
                      <button
                        key={t.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted focus:bg-muted focus:outline-none flex items-center gap-2"
                        onClick={() => handlePick(t.id)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{t.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{t.name}</span>
                          {(t.phone || t.email) && (
                            <span className="text-xs text-muted-foreground">{t.phone || t.email}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

