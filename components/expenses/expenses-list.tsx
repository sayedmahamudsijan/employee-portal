"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2, Receipt, Wallet, Plane, Coffee, Briefcase, Wrench, MoreHorizontal } from "lucide-react";

const CATEGORIES = [
  { v: "Travel", icon: Plane },
  { v: "Meals", icon: Coffee },
  { v: "Equipment", icon: Briefcase },
  { v: "Software", icon: Wrench },
  { v: "Office Supplies", icon: Receipt },
  { v: "Other", icon: MoreHorizontal },
];

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PAID: "gradient-success text-white",
};

export function ExpensesList({ initial }: { initial: any[] }) {
  const [items, setItems] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: "Travel",
    amount: "",
    currency: "BDT",
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
    receiptUrl: "",
  });

  const totals = items.reduce((acc: any, e: any) => {
    acc[e.status] = (acc[e.status] ?? 0) + e.amount;
    acc.total = (acc.total ?? 0) + e.amount;
    return acc;
  }, {});

  async function submit() {
    if (!form.amount || !form.description) return toast.error("Amount and description required");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setItems([{ ...json.data, approver: null }, ...items]);
      setShowAdd(false);
      setForm({ ...form, amount: "", description: "", receiptUrl: "" });
      toast.success("Expense submitted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this pending expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(items.filter((i: any) => i.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Submitted</p>
          <p className="text-lg font-bold gradient-text">{(totals.total ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-amber-600">{(totals.PENDING ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="text-lg font-bold text-blue-600">{(totals.APPROVED ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl card-festive p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-bold text-green-600">{(totals.PAID ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} expense(s)</p>
        <Button onClick={() => setShowAdd(true)} className="gradient-brand text-white border-0">
          <Plus className="w-4 h-4 mr-1.5" /> New Expense
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Wallet className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No expenses yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((e: any) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(e.expenseDate)}</td>
                  <td className="px-4 py-3 text-sm">{e.category}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{e.description}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{e.amount.toLocaleString()} {e.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {e.status === "PENDING" && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteExpense(e.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.v}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
            </div>
            <div className="grid grid-cols-[1fr,100px] gap-2">
              <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BDT", "USD", "EUR", "GBP", "INR", "AED"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Description (e.g., Client lunch in Dhaka)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            <Input placeholder="Receipt URL (optional, e.g., uploaded image link)" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={submit} className="gradient-brand text-white border-0">Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
