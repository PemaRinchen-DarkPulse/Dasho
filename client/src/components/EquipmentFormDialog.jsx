import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImagePlus, Upload, Trash2 } from "lucide-react";
import { EquipmentAPI, CategoryAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const EquipmentFormDialog = ({ onAdd }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const initialState = {
    name: "",
    category: "",
    description: "",
  quantity: 1,
    capacity: 1,
  bookingUnit: "30 minutes", // kept for backward compatibility
  bookingMinutes: 30,
  status: "operational",
  keyFeatures: "",
  technicalSpecifications: "",
  usageGuidelines: "",
  safetyRequirements: "",
    imageFile: null,
    imagePreview: "",
  };
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const [categoryOpen, setCategoryOpen] = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const minutes = Number(form.bookingMinutes ?? 30) || 30;
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('category', form.category);
    if (form.description) fd.append('description', form.description);
  fd.append('quantity', String(form.quantity || 1));
    fd.append('capacity', String(form.capacity || 1));
    fd.append('bookingMinutes', String(minutes));
  fd.append('status', form.status || 'operational');
    // send keyFeatures as array entries
    const features = form.keyFeatures
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (features.length) features.forEach((f) => fd.append('keyFeatures', f));
  if (form.technicalSpecifications) fd.append('technicalSpecifications', form.technicalSpecifications);
    // Convert multi-line textareas to arrays (each line = one value)
    const guidelinesArr = (form.usageGuidelines || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const safetyArr = (form.safetyRequirements || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (guidelinesArr.length) guidelinesArr.forEach((g) => fd.append('usageGuidelines', g));
    if (safetyArr.length) safetyArr.forEach((s) => fd.append('safetyRequirements', s));
    if (form.imageFile) fd.append('imageFile', form.imageFile);

  EquipmentAPI.create(fd)
      .then((res) => {
        toast({ title: 'Equipment added successfully' });
        onAdd?.({ id: res?.equipmentId });
    setForm(initialState);
    setOpen(false);
      })
      .catch((err) => {
        toast({ title: 'Failed to add equipment', description: err.message, variant: 'destructive' });
      });
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      alert("Image too large. Max size is 5MB.");
      return;
    }
    // Revoke previous preview URL
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
    const previewUrl = URL.createObjectURL(file);
    setForm((p) => ({ ...p, imageFile: file, imagePreview: previewUrl }));
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const onDragOver = (e) => e.preventDefault();

  const removeImage = () => {
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
    setForm((p) => ({ ...p, imageFile: null, imagePreview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => () => {
    // Cleanup preview URL on unmount
    if (form.imagePreview) URL.revokeObjectURL(form.imagePreview);
  }, [form.imagePreview]);

  // Load categories when the equipment dialog opens
  useEffect(() => {
    let cancelled = false;
    if (!open) return;
    (async () => {
      try {
        const list = await CategoryAPI.list();
        if (cancelled) return;
        setCategories((list || []).map((c) => ({ id: c._id, name: c.name })));
      } catch {
        setCategories([]);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const createCategory = async (e) => {
    e?.preventDefault?.();
    const name = newCat.name.trim();
    if (!name) return;
    try {
      const res = await CategoryAPI.create({ name, description: newCat.description || '' });
      // Refresh categories
      const list = await CategoryAPI.list();
      setCategories((list || []).map((c) => ({ id: c._id, name: c.name })));
      // Select the created category
      setForm((p) => ({ ...p, category: name }));
      setCatDialogOpen(false);
      setNewCat({ name: '', description: '' });
      toast({ title: 'Category saved' });
    } catch (err) {
      toast({ title: 'Failed to save category', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" className="shadow-elegant">+ Add Equipment</Button>
      </DialogTrigger>
  <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Equipment Name</label>
            <Input name="name" placeholder="Enter equipment name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:basis-[70%]">
              <label className="block font-medium mb-1">Category</label>
              <Select 
                value={form.category}
                onValueChange={(val) => handleSelect("category", val)}
                open={categoryOpen}
                onOpenChange={setCategoryOpen}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id || c.name} value={c.name}>{c.name}</SelectItem>
                  ))}
                  <div className="px-2 py-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => { setCategoryOpen(false); setCatDialogOpen(true); }}
                    >
                      + Create new category
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:basis-[30%]">
              <label className="block font-medium mb-1">Status</label>
              <Select value={form.status} onValueChange={(val) => handleSelect("status", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Image Upload */}
          <div>
            <label className="block font-medium mb-1">Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileInputChange}
            />
            <div
              className="group relative flex items-center justify-center border-2 border-dashed rounded-lg p-4 md:p-6 bg-muted/30 hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              {form.imagePreview ? (
                <div className="w-full">
                  <div className="relative h-48 md:h-56 overflow-hidden rounded-md border">
                    {/* preview */}
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img src={form.imagePreview} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4" /> Change
                    </Button>
                    <Button type="button" variant="destructive" onClick={removeImage}>
                      <Trash2 className="w-4 h-4" /> Remove
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">Max 5MB • JPG, PNG</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="w-10 h-10 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-medium">Click to upload or drag & drop</p>
                  <p className="text-xs">JPG, PNG up to 5MB</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <Textarea name="description" placeholder="Enter equipment description" value={form.description} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Key Features</label>
            <Input
              name="keyFeatures"
              placeholder="Comma-separated e.g. Auto-leveling, HEPA filter, 300x300 bed"
              value={form.keyFeatures}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground mt-1">Separate features with commas.</p>
          </div>
          <div>
            <label className="block font-medium mb-1">Technical Specifications</label>
            <Textarea
              name="technicalSpecifications"
              placeholder="One per line as Key: Value (e.g., Build Volume: 220x220x250mm)"
              value={form.technicalSpecifications}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setForm((p) => ({
                    ...p,
                    technicalSpecifications: `${p.technicalSpecifications}`.concat(p.technicalSpecifications ? '\n' : '', ''),
                  }));
                }
              }}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Usage Guidelines</label>
    <Textarea
              name="usageGuidelines"
              placeholder="Provide recommended usage instructions"
              value={form.usageGuidelines}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  // treat Enter as new item (new line)
                  e.preventDefault();
      setForm((p) => ({ ...p, usageGuidelines: `${p.usageGuidelines}`.concat(p.usageGuidelines ? '\n' : '', '') }));
                }
              }}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Safety Requirements</label>
            <Textarea
              name="safetyRequirements"
              placeholder="List PPE, supervision, and other safety rules"
              value={form.safetyRequirements}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
      setForm((p) => ({ ...p, safetyRequirements: `${p.safetyRequirements}`.concat(p.safetyRequirements ? '\n' : '', '') }));
                }
              }}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">Quantity</label>
              <Input name="quantity" type="number" min={1} value={form.quantity} onChange={handleChange} required />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Capacity</label>
              <Input name="capacity" type="number" min={1} value={form.capacity} onChange={handleChange} required />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">Booking Minutes</label>
              <Input
                name="bookingMinutes"
                type="number"
                min={1}
                step={1}
                value={form.bookingMinutes}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="accent">Add Equipment</Button>
          </div>
        </form>

        {/* New Category Dialog */}
        {catDialogOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setCatDialogOpen(false)}>
            <div className="bg-background rounded-lg shadow-elegant w-[95vw] max-w-md p-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-3">Create Category</h3>
              <form onSubmit={createCategory} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input value={newCat.name} onChange={(e) => setNewCat((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <Textarea value={newCat.description} onChange={(e) => setNewCat((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="accent">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentFormDialog;
