import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Search, Plus } from "lucide-react";
import { BookingAPI } from "@/lib/api";

const MyBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await BookingAPI.listMine();
        if (!mounted) return;
        const mapped = (data || []).map((b) => ({
          id: b.id,
          equipmentId: b.equipmentId,
          equipmentName: b.equipmentName,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          durationMinutes: (() => {
            try {
              const [sh, sm] = (b.startTime || "0:0").split(":").map(Number);
              const [eh, em] = (b.endTime || "0:0").split(":").map(Number);
              return (eh * 60 + em) - (sh * 60 + sm);
            } catch { return 0; }
          })(),
        }));
        setBookings(mapped);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to load your bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = bookings.filter((b) => (b.equipmentName || "").toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "--";
    if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Bookings</h1>
          <div className="flex items-center gap-2">
            <Button variant="hero" size="sm" asChild>
              <Link to="/equipment">
                <Plus className="w-4 h-4 mr-1" />
                New Booking
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mb-8">Review and manage your bookings.</p>

        <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-card rounded-xl border border-border shadow-card">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </div>

        {filtered.length > 0 && (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                <colgroup>
                  <col className="w-16" />
                  <col className="min-w-[200px]" />
                  <col className="min-w-[140px]" />
                  <col className="min-w-[120px]" />
                  <col className="min-w-[120px]" />
                  <col className="min-w-[120px]" />
                </colgroup>
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sl. No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Date
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Time
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, idx) => (
                    <tr key={b.id} className="border-t odd:bg-white even:bg-muted/20 hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Link to={`/equipment/${b.equipmentId}`} className="text-primary hover:underline">{b.equipmentName}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" /> {b.date}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" /> {b.startTime}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{b.endTime}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDuration(b.durationMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">You haven't made any bookings.</p>
            <Button variant="hero" asChild>
              <Link to="/equipment">
                <Plus className="w-4 h-4 mr-2" />
                Make Your First Booking
              </Link>
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
