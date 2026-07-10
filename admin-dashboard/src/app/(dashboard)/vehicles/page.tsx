'use client';
import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Edit, Trash2, Plus, Upload, X, Grid3x3, List, Search, Loader, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useSWR, { mutate } from 'swr';
import fetcher from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';
import ConfirmationModal from '@/components/ConfirmationModal';

interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  licensePlate: string;
  pricePerHour: number;
  pricePerDay: number;
  pricePerHourMember?: number;
  pricePerDayMember?: number;
  location: string;
  status: 'active' | 'inactive';
  images?: string[];
}

export default function VehiclesPage() {
  const { data: response, error, isLoading } = useSWR<any>('/vehicles', fetcher);
  const vehicles: Vehicle[] = response?.data || [];

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const emptyForm = {
    make: '', model: '', year: '', type: 'car', licensePlate: '',
    pricePerHour: '', pricePerDay: '', location: '', pricePerHourMember: '', pricePerDayMember: '',
    status: 'inactive' as 'active' | 'inactive',
  };
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [vehicleToToggle, setVehicleToToggle] = useState<Vehicle | null>(null);

  //Search functionality
  const filtered = useMemo(() => {
    if (!search) return vehicles;
    const lower = search.toLowerCase();
    return vehicles.filter((v: any) =>
      v.make?.toLowerCase().includes(lower) ||
      v.model?.toLowerCase().includes(lower) ||
      v.licensePlate?.toLowerCase().includes(lower)
    );
  }, [vehicles, search]);

  // Handle image uploads routine
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length && (images.length + newImages.length) < 6; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.url) newImages.push(data.url);
      } catch (err) {
        toast.error('Upload failed');
      }
    }

    setImages(prev => [...prev, ...newImages].slice(0, 6));
    setUploading(false);
    toast.success(`Added ${newImages.length} image(s)`);
  };
  // Remove image routine
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  // Form submission routine
  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.licensePlate) {
      toast.error('Fill required fields');
      return;
    }

    const payload = {
      ...form,
      year: Number(form.year),
      pricePerHour: Number(form.pricePerHour),
      pricePerDay: Number(form.pricePerDay),
      images: images.length > 0 ? images : undefined
    };

    console.log('Submitting vehicle:');
    console.log(payload);

    try {
      const url = editingVehicle
        ? `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${editingVehicle._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/vehicles/`;

      const method = editingVehicle ? 'PUT' : 'POST';
      console.log(`Making ${method} request to ${url}`);
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error();
      toast.success(editingVehicle ? 'Vehicle updated!' : 'Vehicle added! It starts Inactive until you activate it.');
      mutate('/vehicles');
      setOpen(false);
      setEditingVehicle(null);
      setForm(emptyForm);
      setImages([]);
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleToggleStatus = async () => {
    if (!vehicleToToggle) return;
    const nextStatus = vehicleToToggle.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/${vehicleToToggle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error();
      toast.success(`Vehicle marked ${nextStatus}`);
      mutate('/vehicles');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setVehicleToToggle(null);
    }
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vehicles/${vehicleToDelete._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message);
      }

      toast.success('Vehicle deleted');
      mutate('/vehicles');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete vehicle');
    } finally {
      setVehicleToDelete(null);
    }
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      make: v.make, model: v.model, year: v.year.toString(), type: v.type,
      licensePlate: v.licensePlate, pricePerHour: v.pricePerHour.toString(),
      pricePerDay: v.pricePerDay.toString(), location: v.location || '', pricePerHourMember: v.pricePerHourMember?.toString() || '0', pricePerDayMember: v.pricePerDayMember?.toString() || '0',
      status: v.status || 'inactive',
    });
    setImages(v.images || []);
    setOpen(true);
  };

  if (isLoading) return <div className="text-center py-20"><Loader className="animate-spin flex w-6 h-6 mx-auto" />Loading Fleet...</div>;
  if (error) return <div className="text-center py-20 text-red-600">Error loading vehicles</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold text-blue-900 dark:text-slate-400">Fleet ({vehicles.length})</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by make, model, license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-96"
            />
          </div>
          <div className="flex rounded-lg  ">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="mr-1.5 rounded-md"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-md"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button className="flex items-center cursor-pointer" onClick={() => { setEditingVehicle(null); setForm(emptyForm); setImages([]); setOpen(true); }}>
            <Plus className="w-5 h-5 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((v: any) => (
            <Card key={v._id} className="group overflow-hidden transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600">
              {/* Image + availability */}
              <div className="relative">
                {v.images?.[0] ? (
                  <Image src={v.images[0]} alt={v.model} width={400} height={300} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <Car className="w-12 h-12 text-gray-300 dark:text-slate-500" />
                  </div>
                )}
                <Badge variant={v.status === 'active' ? 'success' : 'secondary'} className="absolute top-3 right-3 shadow-sm capitalize">
                  {v.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="p-5">
                {/* Name + plate */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{v.make} {v.model}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{v.year}</p>
                  </div>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 shrink-0">
                    {v.licensePlate}
                  </span>
                </div>

                {/* Rates */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-slate-400">Regular</span>
                    <span className="font-medium">SBD{v.pricePerHour}/hr · SBD{v.pricePerDay}/day</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500 dark:text-slate-400">Member</span>
                    <span className="font-medium">SBD{v.pricePerHourMember}/hr · SBD{v.pricePerDayMember}/day</span>
                  </div>
                </div>
              </div>

              {/* Footer: price + actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                <p className="text-lg font-bold">
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400 mr-1">SBD</span>
                  {Number(v.pricePerDay).toLocaleString()}
                  <span className="text-xs font-normal text-gray-500 dark:text-slate-400">/day</span>
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    title={v.status === 'active' ? 'Deactivate' : 'Activate'}
                    className={v.status === 'active' ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}
                    onClick={() => setVehicleToToggle(v)}
                  >
                    {v.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(v)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Delete" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setVehicleToDelete(v)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Image</th>
                  <th className="text-left p-4 font-medium">Vehicle</th>
                  <th className="text-left p-4 font-medium">License</th>
                  <th className="text-left p-4 font-medium">Rate</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v: any) => (
                  <tr key={v._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {v.images?.[0] ? (
                        <Image src={v.images[0]} alt="" width={80} height={60} className="rounded" />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded w-20 h-14" />
                      )}
                    </td>
                    <td className="p-4">{v.make} {v.model} ({v.year})</td>
                    <td className="p-4">{v.licensePlate}</td>
                    <td className="p-4">SBD{v.pricePerHour}/hr • SBD{v.pricePerDay}/day</td>
                    <td className="p-4">
                      <Badge variant={v.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                        {v.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        title={v.status === 'active' ? 'Deactivate' : 'Activate'}
                        className="mr-2"
                        onClick={() => setVehicleToToggle(v)}
                      >
                        {v.status === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" onClick={() => openEdit(v)} className="mr-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setVehicleToDelete(v)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal with image upload */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit' : 'Add'} Vehicle</DialogTitle>
          </DialogHeader>

          <div className="mb-6">
            <Label>Vehicle Photos (up to 2)</Label>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {images.map((src, i) => (
                <div key={i} className="relative group">
                  <Image src={src} alt={`Photo ${i + 1}`} width={300} height={200} className="rounded-lg object-cover w-full h-48" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 2 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-600">Add Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Make</Label><Input value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} /></div>
            <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
            <div><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={val => setForm({ ...form, type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>License Plate</Label><Input value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(val: 'active' | 'inactive') => setForm({ ...form, status: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                {editingVehicle ? 'Inactive vehicles are hidden from customer search.' : 'New vehicles start Inactive until you activate them.'}
              </p>
            </div>
            <div><Label>Price per Hour (Regular)</Label><Input type="number" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: e.target.value })} /></div>
            <div><Label>Price per Day (Regular)</Label><Input type="number" value={form.pricePerDay} onChange={e => setForm({ ...form, pricePerDay: e.target.value })} /></div>
            <div>
              <Label>Price per Hour (Members)</Label>
              <Input
                type="number"
                value={form.pricePerHourMember || ''}
                onChange={e => setForm({ ...form, pricePerHourMember: e.target.value })}
                placeholder="Same as regular if blank"
              />
            </div>
            <div>
              <Label>Price per Day (Members)</Label>
              <Input
                type="number"
                value={form.pricePerDayMember || ''}
                onChange={e => setForm({ ...form, pricePerDayMember: e.target.value })}
                placeholder="Same as regular if blank"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Save Vehicle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationModal
        open={!!vehicleToDelete}
        onOpenChange={(isOpen) => { if (!isOpen) setVehicleToDelete(null); }}
        title="Delete Vehicle?"
        description={
          vehicleToDelete
            ? `${vehicleToDelete.make} ${vehicleToDelete.model} (${vehicleToDelete.licensePlate}) will be permanently removed. This action cannot be undone.`
            : ''
        }
        confirmText="Yes, Delete Vehicle"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* Status Toggle Confirmation */}
      <ConfirmationModal
        open={!!vehicleToToggle}
        onOpenChange={(isOpen) => { if (!isOpen) setVehicleToToggle(null); }}
        title={vehicleToToggle?.status === 'active' ? 'Deactivate Vehicle?' : 'Activate Vehicle?'}
        description={
          vehicleToToggle
            ? vehicleToToggle.status === 'active'
              ? `${vehicleToToggle.make} ${vehicleToToggle.model} (${vehicleToToggle.licensePlate}) will be hidden from customer search and can't be booked until reactivated.`
              : `${vehicleToToggle.make} ${vehicleToToggle.model} (${vehicleToToggle.licensePlate}) will become visible to customers and available for booking.`
            : ''
        }
        confirmText={vehicleToToggle?.status === 'active' ? 'Yes, Deactivate' : 'Yes, Activate'}
        variant={vehicleToToggle?.status === 'active' ? 'destructive' : 'default'}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}