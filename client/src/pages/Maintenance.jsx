import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, Clock, Filter, Search } from "lucide-react";
import { EquipmentAPI, MaintenanceAPI } from "@/lib/api";

const statusBadge = (status) => {
  switch (status) {
    case "in-progress":
      return <Badge className="border-transparent bg-orange-100 text-orange-700">in-progress</Badge>;
    case "scheduled":
      return <Badge className="border-transparent bg-blue-100 text-blue-700">scheduled</Badge>;
    case "completed":
      return <Badge className="border-transparent bg-emerald-100 text-emerald-700">completed</Badge>;
    case "cancelled":
      return <Badge className="border-transparent bg-rose-100 text-rose-700">cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status || "-"}</Badge>;
  }
};

const Maintenance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const equipment = await EquipmentAPI.list();
        if (cancelled) return;
        const eqMap = new Map((equipment || []).map((e) => [e._id, e.name]));

        const perEq = await Promise.all(
          (equipment || []).map(async (e) => {
            try {
              const list = await MaintenanceAPI.list(e._id);
              return Array.isArray(list) ? list : [];
            } catch (err) {
              console.error("maintenance fetch failed for", e._id, err);
              return [];
            }
          })
        );
        if (cancelled) return;
        const flat = perEq.flat().map((m) => ({
          id: m._id,
          equipmentId: m.equipmentId,
          equipmentName: eqMap.get(String(m.equipmentId)) || "-",
          type: m.type,
          start: m.start ? String(m.start) : null,
          end: m.end ? String(m.end) : null,
          assignee: m.assignee || "",
          status: m.status,
          notes: m.notes || "",
        }));

        // Sort: in-progress first, then upcoming by start asc, then others by start desc
        const now = new Date();
        const rank = (s) => (s === "in-progress" ? 0 : s === "scheduled" ? 1 : 2);
        flat.sort((a, b) => {
          const r = rank(a.status) - rank(b.status);
          if (r !== 0) return r;
          const ad = a.start ? new Date(a.start) : now;
          const bd = b.start ? new Date(b.start) : now;
          return a.status === "scheduled" ? ad - bd : bd - ad;
        });

        setRows(flat);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load maintenance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => r.status !== "completed")
      .filter((r) => {
        const matchesQ = !q || (r.equipmentName || "").toLowerCase().includes(q) || (r.assignee || "").toLowerCase().includes(q);
        const matchesS = status === "all" || r.status === status;
        return matchesQ && matchesS;
      });
  }, [rows, search, status]);

  const hasDisplayable = useMemo(() => rows.some((r) => r.status !== "completed"), [rows]);

  const fmt = (iso) => {
    if (!iso) return "-";
    try { return new Date(iso).toLocaleString(); } catch { return String(iso); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" /> Maintenance
          </h1>
          <p className="text-muted-foreground mt-1">View scheduled and in-progress maintenance across equipment.</p>
        </div>

  {/* Filters (only when there are displayable items) */}
  {!loading && !error && hasDisplayable && (
          <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-card rounded-xl border border-border shadow-card">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search by equipment or assignee..." value={search} onChange={(e)=>setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="w-full md:w-52">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`m-skel-${i}`} className="h-16 rounded-xl border bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Wrench className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-medium text-destructive mb-2">{error}</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 min-h-[50vh] flex flex-col items-center justify-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Wrench className="w-8 h-8 text-primary-foreground" />
            </div>
            {hasDisplayable ? (
              <>
                <h3 className="text-xl font-medium text-foreground mb-2">No matching maintenance</h3>
                <p className="text-muted-foreground">Try adjusting search or status filters.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-medium text-foreground mb-2">No maintenance scheduled</h3>
                <p className="text-muted-foreground">There are no current or upcoming maintenance items.</p>
              </>
            )}
          </div>
        ) : (
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Maintenance Schedule</CardTitle>
              <CardDescription>
                <span>{`${filtered.length} item(s)`}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <colgroup>
                    <col className="w-16" />
                    <col className="min-w-[220px]" />
                    <col className="min-w-[140px]" />
                    <col className="min-w-[180px]" />
                    <col className="min-w-[180px]" />
                    <col className="min-w-[120px]" />
                  </colgroup>
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sl. No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Start</div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> End</div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, idx) => (
                      <tr key={m.id || `${m.equipmentId}-${m.start}-${m.type}`} className="border-t odd:bg-white even:bg-muted/20 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3">{m.equipmentName}</td>
                        <td className="px-4 py-3 capitalize">{m.type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(m.start)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(m.end)}</td>
                        <td className="px-4 py-3">{statusBadge(m.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Maintenance;
