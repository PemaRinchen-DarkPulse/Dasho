import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EquipmentFormDialog from "@/components/EquipmentFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, CalendarDays, Users, TrendingUp, Pencil, Trash2, Eye, Plus, AlertTriangle, FileText, Clock, Search, Filter, Download } from "lucide-react";
import { EquipmentAPI, BookingAPI, MaintenanceAPI, AdminAPI, getToken } from "@/lib/api";
import ScheduleMaintenanceDialog from "@/components/ScheduleMaintenanceDialog";

const defaultMetrics = [
  { label: "Total Equipment", key: 'equipmentCount', value: '—', icon: Wrench, iconClass: "text-primary" },
  { label: "Active Bookings", key: 'activeBookings', value: '—', icon: CalendarDays, iconClass: "text-accent" },
  { label: "Total Users", key: 'userCount', value: '—', icon: Users, iconClass: "text-primary" },
  { label: "Utilization Rate", key: 'utilizationRate', value: '—', icon: TrendingUp, iconClass: "text-accent" },
];

// Bookings are loaded from backend

// Equipment list will be loaded from API

const statusBadge = (status) => {
  switch (status) {
    case "confirmed":
      return <Badge className="border-transparent bg-primary/10 text-primary">confirmed</Badge>;
    case "completed":
      return <Badge className="border-transparent bg-emerald-100 text-emerald-700">completed</Badge>;
    case "cancelled":
      return <Badge className="border-transparent bg-rose-100 text-rose-700">cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const equipmentStatusBadge = (status) => {
  switch (status) {
    case "operational":
      return (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700">operational</Badge>
      );
    case "maintenance":
      return (
        <Badge className="border-transparent bg-orange-100 text-orange-700">maintenance</Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const maintenanceBadge = (status) => {
  switch (status) {
    case 'in-progress':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">In Progress</Badge>;
    case 'scheduled':
      return <Badge className="border-transparent bg-blue-100 text-blue-700">Scheduled</Badge>;
    default:
      return <Badge variant="secondary">No Schedule</Badge>;
  }
};

// Maintenance Logs state (loaded from DB)
// Each row: { id, date (YYYY-MM-DD), equipment, type, technician, duration (friendly), cost (number|undefined), status }
// Note: cost is not available in Maintenance schema; we'll display 0.00 unless later extended.
const formatDurationH = (start, end) => {
  try {
    if (!start || !end) return "-";
    const s = new Date(start);
    const e = new Date(end);
    const mins = Math.max(0, Math.round((e - s) / 60000));
    if (mins <= 0) return "-";
    if (mins % 60 === 0) return `${mins / 60} hours`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim();
  } catch {
    return "-";
  }
};

const logTypeBadge = (type) => {
  if (type === "corrective") {
    return <Badge className="border-transparent bg-orange-100 text-orange-700">corrective</Badge>;
  }
  return <Badge className="border-transparent bg-blue-100 text-blue-700">preventive</Badge>;
};

const logStatusBadge = (status) => {
  switch (status) {
    case 'scheduled':
      return <Badge className="border-transparent bg-blue-100 text-blue-700">scheduled</Badge>;
    case 'in-progress':
      return <Badge className="border-transparent bg-orange-100 text-orange-700">in-progress</Badge>;
    case 'completed':
      return <Badge className="border-transparent bg-emerald-100 text-emerald-700">completed</Badge>;
    case 'cancelled':
      return <Badge className="border-transparent bg-rose-100 text-rose-700">cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status || '-'}</Badge>;
  }
};

const AdminDashboard = () => {
  // KPI metrics
  const [metrics, setMetrics] = React.useState(defaultMetrics);
  const [loadingMetrics, setLoadingMetrics] = React.useState(true);
  const [metricsError, setMetricsError] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [bookings, setBookings] = React.useState([]);
  const [loadingBookings, setLoadingBookings] = React.useState(true);
  const [bookErr, setBookErr] = React.useState("");
  const [equipmentRows, setEquipmentRows] = React.useState([]);
  const [loadingEq, setLoadingEq] = React.useState(true);
  const [eqError, setEqError] = React.useState("");
  const [scheduleForId, setScheduleForId] = React.useState("");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [maintStatuses, setMaintStatuses] = React.useState({}); // { [equipmentId]: { status, start, end } }
  const [maintenanceLogs, setMaintenanceLogs] = React.useState([]);
  const [loadingLogs, setLoadingLogs] = React.useState(true);
  const [logsError, setLogsError] = React.useState("");
  // Maintenance tab filters
  const [mSearch, setMSearch] = React.useState("");
  const [mStatus, setMStatus] = React.useState("all"); // all | in-progress | scheduled | none
  // Logs tab filters
  const [logSearch, setLogSearch] = React.useState("");
  const [logStatus, setLogStatus] = React.useState("all"); // all | completed | in-progress | scheduled | cancelled
  const [logType, setLogType] = React.useState("all"); // all | preventive | corrective
  const [editLog, setEditLog] = React.useState(null); // current log row for edit
  const downloadReport = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(MaintenanceAPI.downloadReportUrl(id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Report not found or unauthorized');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'maintenance-report.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Failed to download');
    }
  };
  const [activeTab, setActiveTab] = React.useState(() => {
    try {
      return localStorage.getItem('admin_tab') || 'bookings';
    } catch {
      return 'bookings';
    }
  });

  // Load KPI metrics from backend
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingMetrics(true);
        const data = await AdminAPI.stats();
        if (cancelled) return;
        const next = defaultMetrics.map((m) => {
          let val = data?.[m.key];
          if (m.key === 'utilizationRate' && typeof val === 'number') val = `${val}%`;
          return { ...m, value: val ?? '0' };
        });
        setMetrics(next);
        setMetricsError("");
      } catch (err) {
        console.error(err);
        setMetricsError(err.message || 'Failed to load metrics');
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingEq(true);
        const list = await EquipmentAPI.list();
        if (cancelled) return;
        const rows = (list || []).map((e) => ({
          id: e._id,
          name: e.name,
          category: e.category,
          status: e.status || "operational",
          // No maintenance tracking yet; show 'NA' for maintenance fields
          lastMaintenance: "NA",
          nextMaintenance: "NA",
        }));
        setEquipmentRows(rows);
        setEqError("");

        // After setting base rows, fetch maintenance info and compute last/next per equipment
        const computeLastNext = (items) => {
          const now = new Date();
          let last = 'NA';
          let next = 'NA';
          try {
            const completedOrPast = items.filter((m) => {
              const end = new Date(m.end);
              return (m.status === 'completed') || (end <= now);
            });
            if (completedOrPast.length) {
              const mostRecent = completedOrPast.sort((a, b) => new Date(b.end) - new Date(a.end))[0];
              last = new Date(mostRecent.end).toLocaleString();
            }
            const upcoming = items
              .filter((m) => new Date(m.start) > now && (m.status === 'scheduled' || m.status === 'in-progress'))
              .sort((a, b) => new Date(a.start) - new Date(b.start));
            if (upcoming.length) {
              next = new Date(upcoming[0].start).toLocaleString();
            }
          } catch {}
          return { last, next };
        };

        Promise.all(
          rows.map(async (e) => {
            try {
              const list = await MaintenanceAPI.list(e.id);
              return [e.id, computeLastNext(Array.isArray(list) ? list : [])];
            } catch (err) {
              console.error('Failed to compute last/next for', e.id, err);
              return [e.id, { last: 'NA', next: 'NA' }];
            }
          })
        ).then((entries) => {
          if (cancelled) return;
          const map = Object.fromEntries(entries);
          setEquipmentRows((prev) => prev.map((row) => ({
            ...row,
            lastMaintenance: map[row.id]?.last ?? 'NA',
            nextMaintenance: map[row.id]?.next ?? 'NA',
          })));
        });
      } catch (err) {
        console.error(err);
        setEqError(err.message || "Failed to load equipment");
      } finally {
        if (!cancelled) setLoadingEq(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch maintenance statuses for each equipment and keep them fresh
  React.useEffect(() => {
    let cancelled = false;
    if (!equipmentRows || equipmentRows.length === 0) return;

    const computeStatus = (items) => {
      const now = new Date();
      // Prefer currently in-progress
      const current = items.find((m) => m.status === 'in-progress' || (new Date(m.start) <= now && new Date(m.end) > now));
      if (current) return { status: 'in-progress', start: current.start, end: current.end };
      // Next scheduled in future
      const future = items
        .filter((m) => new Date(m.start) > now && (m.status === 'scheduled' || m.status === 'in-progress'))
        .sort((a, b) => new Date(a.start) - new Date(b.start))[0];
      if (future) return { status: 'scheduled', start: future.start, end: future.end };
      return { status: 'none' };
    };

    const loadAll = async () => {
      try {
        const entries = await Promise.all(
          equipmentRows.map(async (e) => {
            try {
              const list = await MaintenanceAPI.list(e.id);
              return [e.id, computeStatus(Array.isArray(list) ? list : [])];
            } catch (err) {
              console.error('Failed loading maintenance for', e.id, err);
              return [e.id, { status: 'none' }];
            }
          })
        );
        if (!cancelled) {
          setMaintStatuses(Object.fromEntries(entries));
        }
      } catch (err) {
        console.error('maintenance loadAll error', err);
      }
    };

    loadAll();
    const tick = setInterval(loadAll, 60_000); // refresh every minute to reflect auto transitions
    return () => { cancelled = true; clearInterval(tick); };
  }, [equipmentRows]);

  // Load maintenance logs from DB across all equipment
  React.useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      try {
        setLoadingLogs(true);
        setLogsError("");
        if (!equipmentRows || equipmentRows.length === 0) {
          setMaintenanceLogs([]);
          return;
        }
  const entries = await Promise.all(
          equipmentRows.map(async (e) => {
            try {
              const list = await MaintenanceAPI.list(e.id);
              return (Array.isArray(list) ? list : []).map((m) => ({
                id: m._id,
                date: m.start ? new Date(m.start).toISOString().slice(0, 10) : "",
                equipment: e.name,
                type: m.type,
                technician: m.assignee || "",
    duration: m.durationMinutes && m.durationMinutes > 0 ? `${m.durationMinutes}m` : formatDurationH(m.start, m.end),
    cost: m.cost || 0,
                status: m.status || 'scheduled',
              }));
            } catch (err) {
              console.error('logs load maintenance for', e.id, err);
              return [];
            }
          })
        );
        if (cancelled) return;
        // Flatten and sort by date desc
        const flat = entries.flat().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setMaintenanceLogs(flat);
      } catch (err) {
        if (!cancelled) setLogsError(err.message || 'Failed to load maintenance logs');
      } finally {
        if (!cancelled) setLoadingLogs(false);
      }
    };
    loadLogs();
    const t = setInterval(loadLogs, 60_000); // refresh every minute
    return () => { cancelled = true; clearInterval(t); };
  }, [equipmentRows]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingBookings(true);
        const list = await BookingAPI.listAll();
        if (cancelled) return;
        const rows = (list || []).map((b, idx) => ({
          id: b.id,
          equipment: b.equipmentName,
          user: b.userEmail || b.userName || '',
          purpose: b.purpose || '',
          start: `${b.date} ${b.startTime}`,
          end: `${b.date} ${b.endTime}`,
          status: b.status,
        }));
        setBookings(rows);
        setBookErr("");
      } catch (err) {
        console.error(err);
        setBookErr(err.message || 'Failed to load bookings');
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDecision = async (id, nextStatus, reason = '') => {
    try {
      await BookingAPI.setStatus(id, nextStatus, reason);
      // Remove from UI immediately
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update booking');
    }
  };
  const filteredBookings = React.useMemo(
    () => (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)),
    [filter, bookings]
  );
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            <span className="text-primary">Admin</span> Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage equipment, bookings, and lab operations
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m) => (
            <Card key={m.label} className="shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{m.label}</CardDescription>
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${m.iconClass}`}>
                  <m.icon className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loadingMetrics ? '…' : m.value}</div>
                {metricsError && <div className="text-xs text-rose-600 mt-1">{metricsError}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            try { localStorage.setItem('admin_tab', v); } catch {}
          }}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-muted/60 mb-8">
            <TabsTrigger
              className="w-full transition-colors border border-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-none"
              value="bookings"
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger
              className="w-full transition-colors border border-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-none"
              value="equipment"
            >
              Equipment
            </TabsTrigger>
            <TabsTrigger
              className="w-full transition-colors border border-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-none"
              value="maintenance"
            >
              Maintenance
            </TabsTrigger>
            <TabsTrigger
              className="w-full transition-colors border border-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:shadow-none"
              value="logs"
            >
              Maintenance Logs
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    All Bookings
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Filter by</span>
                    <div className="w-40">
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger aria-label="Filter bookings by status">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
          <thead className="bg-muted/50">
                      <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sl. No</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purpose</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Time</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
          <tbody>
                      {loadingBookings ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`skeleton-book-${i}`} className="border-t">
                            <td className="px-4 py-3" colSpan={7}>
                              <div className="h-6 bg-muted/60 rounded animate-pulse" />
                            </td>
                          </tr>
                        ))
                      ) : filteredBookings.length === 0 ? (
                        <tr className="border-t">
                          <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                            {bookErr || 'No bookings found.'}
                          </td>
                        </tr>
                      ) : filteredBookings.map((b, idx) => (
                        <tr key={b.id} className="border-t odd:bg-background even:bg-muted/30 hover:bg-accent/20 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap font-medium">{idx + 1}</td>
                          <td className="px-4 py-3">{b.equipment}</td>
                          <td className="px-4 py-3">{b.user}</td>
                          <td className="px-4 py-3 whitespace-pre-wrap break-words max-w-xs">{b.purpose || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{b.start}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{b.end}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handleDecision(b.id, 'confirmed')}>
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                const reason = window.prompt('Reason for decline (optional):', '');
                                handleDecision(b.id, 'declined', reason || '');
                              }}>
                                Decline
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    Equipment Management
                  </CardTitle>
                  <EquipmentFormDialog />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {eqError && (
                  <div className="text-red-600 mb-3">{eqError}</div>
                )}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Maintenance</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next Maintenance</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingEq ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={`skeleton-${i}`} className="border-t">
                            <td className="px-5 py-4" colSpan={6}>
                              <div className="h-6 bg-muted/60 rounded animate-pulse" />
                            </td>
                          </tr>
                        ))
                      ) : (
                      equipmentRows.map((e) => (
                        <tr key={e.id} className="border-t hover:bg-accent/20 transition-colors">
                          <td className="px-5 py-4 font-semibold text-foreground">
                            <button className="hover:underline text-primary/90">{e.name}</button>
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{e.category}</td>
                          <td className="px-5 py-4">{equipmentStatusBadge(e.status)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={e.lastMaintenance === "NA" ? "ml-2 inline-block" : ""}>{e.lastMaintenance}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={e.nextMaintenance === "NA" ? "ml-2 inline-block" : ""}>{e.nextMaintenance}</span>
                          </td>
                          <td className="px-5 py-4">
                            <TooltipProvider>
                              <div className="flex items-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="edit equipment" className="hover:text-primary">
                                      <Pencil />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="delete equipment" className="hover:text-destructive">
                                      <Trash2 />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
                  <CardTitle className="text-xl flex items-center gap-2 self-start">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Maintenance Schedule
                  </CardTitle>
                  <div className="w-full sm:w-auto flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search equipment..."
                        value={mSearch}
                        onChange={(e) => setMSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="w-40">
                      <Select value={mStatus} onValueChange={setMStatus}>
                        <SelectTrigger>
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingEq ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`m-skel-${i}`} className="h-16 rounded-xl border bg-muted/40 animate-pulse" />
                  ))
                ) : (
                  <>
                    {equipmentRows
                      .filter((e) => {
                        const name = (e.name || '').toLowerCase();
                        const q = mSearch.trim().toLowerCase();
                        return !q || name.includes(q);
                      })
                      .filter((e) => {
                        const status = (maintStatuses[e.id]?.status) || 'none';
                        return mStatus === 'all' || status === mStatus;
                      })
                      .map((e) => {
                        const m = maintStatuses[e.id] || { status: 'none' };
                        // Keep original subtitle behavior
                        const isInProgressForSubtitle = e.status === "maintenance";
                        const subtitle = isInProgressForSubtitle
                          ? "Currently in maintenance"
                          : `Maintenance due: ${e.nextMaintenance}`;
                        return (
                          <div
                            key={`m-${e.id}`}
                            className="flex items-center justify-between gap-4 rounded-xl border bg-card px-4 sm:px-6 py-4 shadow-sm border-l-4 border-l-orange-500"
                          >
                            <div>
                              <div className="font-semibold text-foreground">{e.name}</div>
                              <div className="text-muted-foreground text-sm">{subtitle}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              {maintenanceBadge(m.status)}
                              <Button variant="outline" onClick={() => { setScheduleForId(e.id); setScheduleOpen(true); }}>Schedule</Button>
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
                  <CardTitle className="text-xl flex items-center gap-2 self-start">
                    <FileText className="w-5 h-5 text-primary" />
                    Maintenance Logs
                  </CardTitle>
                  <div className="w-full sm:w-auto flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search logs..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="w-36">
                      <Select value={logType} onValueChange={setLogType}>
                        <SelectTrigger>
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="preventive">Preventive</SelectItem>
                          <SelectItem value="corrective">Corrective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-40">
                      <Select value={logStatus} onValueChange={setLogStatus}>
                        <SelectTrigger>
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sl. No</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Technician</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(loadingLogs ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={`log-skel-${i}`} className="border-t">
                          <td className="px-5 py-4" colSpan={9}>
                            <div className="h-6 bg-muted/60 rounded animate-pulse" />
                          </td>
                        </tr>
                      )) : maintenanceLogs)
                        .filter((row) => {
                          const q = logSearch.trim().toLowerCase();
                          const hay = `${row.equipment || ''} ${row.technician || ''}`.toLowerCase();
                          return !q || hay.includes(q);
                        })
                        .filter((row) => (logStatus === 'all' ? true : row.status === logStatus))
                        .filter((row) => (logType === 'all' ? true : row.type === logType))
                        .map((row, idx) => (
                        <tr key={row.id} className="border-t hover:bg-accent/20 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap font-medium">{idx + 1}</td>
                          <td className="px-5 py-4 whitespace-nowrap font-semibold text-foreground flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {row.date}
                          </td>
                          <td className="px-5 py-4">{row.equipment}</td>
                          <td className="px-5 py-4">{logTypeBadge(row.type)}</td>
                          <td className="px-5 py-4">{row.technician}</td>
                          <td className="px-5 py-4 whitespace-nowrap">{row.duration}</td>
                          <td className="px-5 py-4 font-semibold text-emerald-600">{`Nu. ${Number(row.cost || 0).toFixed(2)}`}</td>
                          <td className="px-5 py-4">{logStatusBadge(row.status)}</td>
                          <td className="px-5 py-4">
                            <TooltipProvider>
                              <div className="flex items-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="download report" className="hover:text-primary" onClick={() => downloadReport(row.id)}>
                                      <Download />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Download report</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="edit log" className="hover:text-primary" onClick={() => setEditLog(row)}>
                                      <Pencil />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit</TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary cards */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-card border">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-primary">{
                        maintenanceLogs.filter((l) => l.status === "completed").length
                      }</div>
                      <div className="text-muted-foreground">Completed This Month</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-600">{
                        `Nu. ${maintenanceLogs.filter((l)=>l.status==="completed").reduce((sum,l)=>sum + (l.cost||0),0).toFixed(2)}`
                      }</div>
                      <div className="text-muted-foreground">Total Cost This Month</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border">
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-600">{
                        maintenanceLogs.filter((l) => l.status === "in-progress").length
                      }</div>
                      <div className="text-muted-foreground">In Progress</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
  </Tabs>
  {editLog && (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setEditLog(null)}>
      <div className="bg-background rounded-lg shadow-elegant w-[95vw] max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Edit Maintenance Log</h3>
        <EditMaintenanceForm log={editLog} onClose={() => setEditLog(null)} onSaved={() => { setEditLog(null); }} />
      </div>
    </div>
  )}
  <ScheduleMaintenanceDialog open={scheduleOpen} onOpenChange={(v)=>{ setScheduleOpen(v); if(!v) setScheduleForId(""); }} equipmentId={scheduleForId} />
      </div>
    </div>
  );
};

const EditMaintenanceForm = ({ log, onClose, onSaved }) => {
  const { id } = log;
  const [costInput, setCostInput] = React.useState('');
  const [status, setStatus] = React.useState('in-progress');
  const [notes, setNotes] = React.useState('');
  const [file, setFile] = React.useState(null);
  const [setOperational, setSetOperational] = React.useState(false);

  React.useEffect(() => {
    // Best-effort prefill from row
  setCostInput(log.cost != null ? String(log.cost) : '');
    setStatus(log.status || 'in-progress');
  }, [log]);

  const save = async () => {
    try {
  const parsedCost = costInput === '' ? 0 : Number(costInput);
  await MaintenanceAPI.update(id, { cost: parsedCost, status, notes, setEquipmentOperational: setOperational });
      if (file) await MaintenanceAPI.uploadReport(id, file);
      onSaved?.();
    } catch (err) {
      alert(err.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Cost</label>
          <Input type="number" min={0} step="0.01" value={costInput} onChange={(e)=>setCostInput(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1">PDF Report</label>
          <Input type="file" accept="application/pdf" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1">Notes</label>
          <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Add any notes" />
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-primary" checked={setOperational} onChange={(e)=>setSetOperational(e.target.checked)} />
            Set equipment status to Operational
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="accent" onClick={save}>Save</Button>
      </div>
    </div>
  );
};

export default AdminDashboard;