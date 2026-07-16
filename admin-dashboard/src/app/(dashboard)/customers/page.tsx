'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, Edit, Trash2, Plus, Shield, List, Grid3x3, Search, Loader, IdCard } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api';

import ConfirmationModal from '@/components/ConfirmationModal';

export default function CustomersPage() {
  const { data: response, error, isLoading } = useSWR<any>('/users/all', fetcher); // adjust route if needed
  const customers = response?.data || [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    isMember: false,
    memberId: '',
  });
  const [search, setSearch] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<'makeMember' | 'removeMember' | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const lower = search.toLowerCase();
    return customers.filter((c: any) =>
      c.name?.toLowerCase().includes(lower) ||
      c.email?.toLowerCase().includes(lower) ||
      c.phone?.includes(search)
    );
  }, [customers, search]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', password: '', isMember: false, memberId: '' });
    setOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // never pre-fill password
      isMember: user.isMember || false,
      memberId: user.memberId || '',
    });
    setOpen(true);
  };

  // Membership toggle handler
  const handleToggleMembership = (customerId: string, willBeMember: boolean) => {
    setSelectedCustomerId(customerId);
    setActionType(willBeMember ? 'makeMember' : 'removeMember');
    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      const url = editing
        ? `${process.env.NEXT_PUBLIC_API_URL}/users/${editing._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;

      const payload = editing
        ? { name: form.name, email: form.email, phone: form.phone, memberId: form.memberId }
        : { name: form.name, email: form.email, password: form.password || 'temp123456', phone: form.phone, memberId: form.memberId };

      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      toast.success(editing ? 'Customer updated' : 'Customer created');
      mutate('/users');
      setOpen(false);
    } catch {
      toast.error('Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? All bookings will be lost.')) return;

    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(() => {
        toast.success('Customer deleted');
        mutate('/users/all');
      })
      .catch(() => toast.error('Failed to delete'));
  };

  if (isLoading) return <div className="text-center py-20"><Loader className="animate-spin flex w-6 h-6 mx-auto" />Loading customers...</div>;
  if (error) return <div className="text-center py-20 text-red-600">Error loading customers</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold text-blue-900 dark:text-slate-400">Customers ({filtered.length})</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-96"
            />
          </div>
          <div className="flex rounded-lg p-1">
            <Button
              className="mr-1.5"
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <Grid3x3 className="w-4 h-4 mr-1" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-1" />
            </Button>
          </div>
          <Button className="flex items-center" onClick={openCreateModal}>
            <Plus className="w-5 h-5 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <Card key={c._id} className="group overflow-hidden transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600">
              <div className="p-5">
                {/* Header: avatar + name, admin badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold shrink-0">
                      {(c.name || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{c.name}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.isMember ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {c.isMember ? 'SASCU Member' : 'Non-member'}
                      </span>
                    </div>
                  </div>
                  {(c.role === 'admin' || c.role === 'superadmin') && (
                    <Badge variant="default" className="shrink-0">
                      <Shield className="w-3 h-3 mr-1" />
                      {c.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  )}
                </div>

                {/* Contact details */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.memberId && (
                    <div className="flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                      <span>{c.memberId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: membership toggle + actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleMembership(c._id, !c.isMember)}
                >
                  {c.isMember ? 'Remove Membership' : 'Make Member'}
                </Button>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" title="Edit" onClick={() => openEditModal(c)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {c.role !== 'admin' && c.role !== 'superadmin' && (
                    <Button size="sm" variant="ghost" title="Delete" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(c._id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
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
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Phone</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Membership</th>
                  <th className="text-left p-4 font-medium">Member ID</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {c.name}
                    </td>
                    <td className="p-4">{c.email}</td>
                    <td className="p-4">{c.phone || '-'}</td>
                    <td className="p-4">
                      {c.role === 'admin' || c.role === 'superadmin' ? (
                        <Badge>{c.role === 'superadmin' ? 'Super Admin' : 'Admin'}</Badge>
                      ) : (
                        <Badge variant="secondary">Customer</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {c.isMember ? (
                        <Badge variant="default" className="bg-green-600">Member</Badge>
                      ) : (
                        <Badge variant="secondary">Non-member</Badge>
                      )}

                    </td>
                    <td className="p-4 text-gray-600 dark:text-slate-300">{c.memberId || '-'}</td>
                    <td className="p-4 text-right">
                      <Button size="sm" onClick={() => openEditModal(c)} className="mr-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {c.role !== 'admin' && c.role !== 'superadmin' && (
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(c._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+27 82 123 4567"
              />
            </div>
            <div>
              <Label>SASCU Member ID (optional)</Label>
              <Input
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                placeholder="e.g. SASCU-00123"
              />
            </div>
            {!editing && (
              <div>
                <Label>Temporary Password (will be temp123456)</Label>
                <p className="text-sm text-gray-500">User can change it later</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Membership Toggle */}
      <ConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={actionType === 'makeMember' ? 'Make Customer a Member?' : 'Remove Membership?'}
        description={
          actionType === 'makeMember'
            ? 'This customer will get access to member pricing and benefits.'
            : 'This customer will lose member pricing and benefits.'
        }
        confirmText={actionType === 'makeMember' ? 'Make Member' : 'Remove Membership'}
        variant={actionType === 'removeMember' ? 'destructive' : 'default'}
        onConfirm={async () => {
          if (!selectedCustomerId) return;

          try {

            toast.promise(fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/users/${selectedCustomerId}/toggle-membership`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
              }
            ), {
              loading: 'Updating membership...',
              success: () => {
                mutate('/users/all');
                return 'Membership updated';
              },
              error: 'Failed to update membership',
            });

            


          } catch {
            toast.error('Failed to update membership');
          }
          
        }}
      />

    </div>

  );
}
