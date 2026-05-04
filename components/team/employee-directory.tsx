"use client";

import { useState, useMemo } from "react";
import { EmployeeCard } from "./employee-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Search, Users, ChevronDown } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  image: string | null;
  jobTitle: string | null;
  department: string | null;
  status: string;
  createdAt: Date;
  manager: { id: string; name: string; image: string | null } | null;
  _count: { tasks: number };
}

interface Props {
  employees: Employee[];
  departments: string[];
}

export function EmployeeDirectory({ employees, departments }: Props) {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.jobTitle?.toLowerCase().includes(q) ?? false) ||
        (e.department?.toLowerCase().includes(q) ?? false);
      const matchDept = dept === "all" || e.department === dept;
      return matchSearch && matchDept;
    });
  }, [employees, search, dept]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, title, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
        <div className="relative">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Results count */}
      {(search || dept !== "all") && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees match your search"
          description="Try adjusting your search terms or department filter."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  );
}
