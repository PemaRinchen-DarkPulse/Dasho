import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EquipmentAPI, MaintenanceAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ReadonlyField = ({ label, value }) => (
  <div className="space-y-1">
    <Label className="text-muted-foreground">{label}</Label>
    <Input value={value ?? "-"} readOnly disabled />
  </div>
);

const ScheduleMaintenanceDialog = ({ open, onOpenChange, equipmentId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [eq, setEq] = React.useState(null);
  const [form, setForm] = React.useState({
    type: "preventive",
    start: "",
    end: "",
    assignee: "",
    notes: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    if (!open || !equipmentId) return;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await EquipmentAPI.get(equipmentId);
        if (cancelled) return;
        setEq(data);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load equipment details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, equipmentId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.type) {
      toast({ title: "Please select maintenance type", variant: "destructive" });
      return;
    }
    const isCorrective = String(form.type).toLowerCase() === 'corrective';
    if (!isCorrective) {
      if (!form.start || !form.end) {
        toast({ title: "Please fill all required fields", variant: "destructive" });
        return;
      }
      if (new Date(form.end) <= new Date(form.start)) {
        toast({ title: "End time must be after start time", variant: "destructive" });
        return;
      }
    }
    try {
      const payload = isCorrective
        ? { equipmentId, type: 'corrective', assignee: form.assignee, notes: form.notes }
        : { equipmentId, type: form.type, start: form.start, end: form.end, assignee: form.assignee, notes: form.notes };
      await MaintenanceAPI.create(payload);
      toast({ title: 'Maintenance scheduled' });
      // Persist Maintenance tab and reload the page to reflect updates while staying on that tab
      try { localStorage.setItem('admin_tab', 'maintenance'); } catch {}
      onOpenChange(false);
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (err) {
      toast({ title: 'Failed to schedule maintenance', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>
            Review equipment details (read-only) and add maintenance information.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="h-20 rounded-md bg-muted/40 animate-pulse" />
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Equipment name only (read-only) */}
            <div className="grid md:grid-cols-2 gap-4">
              <ReadonlyField label="Equipment Name" value={eq?.name} />
            </div>

            <div className="h-px w-full bg-border" />

            {/* Maintenance fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Maintenance Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="calibration">Calibration</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Assigned Technician / Team</Label>
                <Input value={form.assignee} onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))} placeholder="Name or team" />
              </div>
              {String(form.type).toLowerCase() !== 'corrective' && (
                <>
                  <div className="space-y-1">
                    <Label>Start Date & Time</Label>
                    <Input type="datetime-local" value={form.start} onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <Label>End Date & Time</Label>
                    <Input type="datetime-local" value={form.end} onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))} required />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-1">
              <Label>Notes / Description</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Add context, parts needed, etc." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent">Save</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleMaintenanceDialog;
