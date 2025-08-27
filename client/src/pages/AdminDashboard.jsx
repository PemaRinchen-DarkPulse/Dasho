import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EquipmentFormDialog from "@/components/EquipmentFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, CalendarDays, Users, TrendingUp, Pencil, Trash2, Eye, Plus, AlertTriangle, FileText, Clock } from "lucide-react";
import { EquipmentAPI, BookingAPI } from "@/lib/api";

const metrics = [
  { label: "Total Equipment", value: 12, icon: Wrench, iconClass: "text-primary" },
  { label: "Active Bookings", value: 8, icon: CalendarDays, iconClass: "text-accent" },
  { label: "Total Users", value: 156, icon: Users, iconClass: "text-primary" },
  { label: "Utilization Rate", value: "73%", icon: TrendingUp, iconClass: "text-accent" },
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

const maintenanceBadge = (type) => {
  if (type === "inProgress") {
    return <Badge className="border-transparent bg-orange-100 text-orange-700">In Progress</Badge>;
  }
  return <Badge className="border-transparent bg-emerald-100 text-emerald-700">Due Soon</Badge>;
};

// Maintenance Logs data
const maintenanceLogs = [
  {
    id: "log-1",
    date: "2024-01-10",
    equipment: "Ultimaker S3 3D Printer",
    type: "preventive",
    description: "Replaced nozzle and calibrated bed",
    technician: "Mike Johnson",
    duration: "2 hours",
    cost: 45,
    status: "completed",
  },
  {
    id: "log-2",
    date: "2024-01-08",
    equipment: "Epilog Laser Cutter",
    type: "corrective",
    description: "Fixed laser alignment issue",
    technician: "Sarah Chen",
    duration: "3 hours",
    cost: 120,
    status: "completed",
  },
  {
    id: "log-3",
    date: "2024-01-05",
    equipment: "CNC Milling Machine",
    type: "preventive",
    description: "Oil change and spindle inspection",
    technician: "David Wilson",
    duration: "4 hours",
    cost: 200,
    status: "in-progress",
  },
  {
    id: "log-4",
    date: "2024-01-12",
    equipment: "Arduino Workshop Station",
    type: "preventive",
    description: "Cable organization and component check",
    technician: "Emma Davis",
    duration: "1 hour",
    cost: 25,
    status: "completed",
  },
];

const logTypeBadge = (type) => {
  if (type === "corrective") {
    return <Badge className="border-transparent bg-orange-100 text-orange-700">corrective</Badge>;
  }
  return <Badge className="border-transparent bg-blue-100 text-blue-700">preventive</Badge>;
};

const logStatusBadge = (status) => {
  if (status === "in-progress") {
    return <Badge className="border-transparent bg-orange-100 text-orange-700">in-progress</Badge>;
  }
  return <Badge className="border-transparent bg-emerald-100 text-emerald-700">completed</Badge>;
};

const AdminDashboard = () => {
  const [filter, setFilter] = React.useState("all");
  const [bookings, setBookings] = React.useState([]);
  const [loadingBookings, setLoadingBookings] = React.useState(true);
  const [bookErr, setBookErr] = React.useState("");
  const [equipmentRows, setEquipmentRows] = React.useState([]);
  const [loadingEq, setLoadingEq] = React.useState(true);
  const [eqError, setEqError] = React.useState("");

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
                <div className="text-2xl font-bold">{m.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="w-full">
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Maintenance Schedule
                  </CardTitle>
                  <Button variant="accent" className="shadow-elegant">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Maintenance
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingEq ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`m-skel-${i}`} className="h-16 rounded-xl border bg-muted/40 animate-pulse" />
                  ))
                ) : equipmentRows.map((e) => {
                  const isInProgress = e.status === "maintenance";
                  const subtitle = isInProgress
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
                        {maintenanceBadge(isInProgress ? "inProgress" : "dueSoon")}
                        <Button variant="outline">Schedule</Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Maintenance Logs
                  </CardTitle>
                  <Button variant="accent" className="shadow-elegant">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Log Entry
                  </Button>
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
                      {maintenanceLogs.map((row, idx) => (
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
                          <td className="px-5 py-4 font-semibold text-emerald-600">{`Nu. ${row.cost.toFixed(2)}`}</td>
                          <td className="px-5 py-4">{logStatusBadge(row.status)}</td>
                          <td className="px-5 py-4">
                            <TooltipProvider>
                              <div className="flex items-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="view log" className="hover:text-primary">
                                      <FileText />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="edit log" className="hover:text-primary">
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
      </div>
    </div>
  );
};

export default AdminDashboard;