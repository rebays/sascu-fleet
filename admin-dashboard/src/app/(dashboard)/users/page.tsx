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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Phone, Edit, Trash2, Plus, Shield, List, Grid3x3, Search, Loader, IdCard, ChevronLeft, ChevronRight, KeyRound } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/api';

import ConfirmationModal from '@/components/ConfirmationModal';

type RoleFilter = 'all' | 'superadmin' | 'admin' | 'member' | 'non-member';

const PAGE_SIZE = 9;

export default function UsersPage() {
  const { data: response, error, isLoading } = useSWR<any>('/users/all', fetcher); // adjust route if needed
  const { data: meRes } = useSWR<any>('/users/me', fetcher);
  const users = response?.data || [];
  const isSuperAdmin = meRes?.role === 'superadmin';

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
    role: 'user',
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<'makeMember' | 'removeMember' | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const isStaff = (u: any) => u.role === 'admin' || u.role === 'superadmin';

  const filtered = useMemo(() => {
    let list = users;

    if (search) {
      const lower = search.toLowerCase();
      list = list.filter((u: any) =>
        u.name?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower) ||
        u.phone?.includes(search)
      );
    }

    if (roleFilter !== 'all') {
      if (roleFilter === 'superadmin') list = list.filter((u: any) => u.role === 'superadmin');
      else if (roleFilter === 'admin') list = list.filter((u: any) => u.role === 'admin');
      else if (roleFilter === 'member') list = list.filter((u: any) => !isStaff(u) && u.isMember);
      else if (roleFilter === 'non-member') list = list.filter((u: any) => !isStaff(u) && !u.isMember);
    }

    return list;
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', password: '', isMember: false, memberId: '', role: 'user' });
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
      role: user.role || 'user',
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

    if (!editing && isStaff({ role: form.role }) && (!form.password || form.password.length < 6)) {
      toast.error('Set a password (at least 6 characters) for admin accounts');
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

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to save user');
      }

      const data = await res.json().catch(() => null);
      const targetId = editing ? editing._id : data?.user?.id;
      const currentRole = editing ? editing.role : 'user';

      // Role changes go through a separate super-admin-only endpoint
      if (isSuperAdmin && targetId && form.role !== currentRole) {
        const roleRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${targetId}/role`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ role: form.role }),
          }
        );
        if (!roleRes.ok) {
          const roleErr = await roleRes.json().catch(() => null);
          throw new Error(roleErr?.message || 'Failed to update role');
        }
      }

      toast.success(editing ? 'User updated' : 'User created');
      mutate('/users/all');
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save user');
    }
  };

  const openResetPasswordModal = (user: any) => {
    setResetPasswordTarget(user);
    setNewPassword('');
    setResetPasswordOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordTarget) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setResetting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${resetPasswordTarget._id}/reset-password`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || 'Failed to reset password');

      toast.success(data?.message || 'Password reset successfully');
      setResetPasswordOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user? All bookings will be lost.')) return;

    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(() => {
        toast.success('User deleted');
        mutate('/users/all');
      })
      .catch(() => toast.error('Failed to delete'));
  };

  if (isLoading) return <div className="text-center py-20"><Loader className="animate-spin flex w-6 h-6 mx-auto" />Loading users...</div>;
  if (error) return <div className="text-center py-20 text-red-600">Error loading users</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-semibold text-blue-900 dark:text-slate-400">Users ({filtered.length})</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 w-96"
            />
          </div>
          {/* Role / Membership Filter */}
          <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val as RoleFilter); setCurrentPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="non-member">Non-member</SelectItem>
            </SelectContent>
          </Select>
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
            Add User
          </Button>
        </div>
      </div>

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paginatedUsers.map((c: any) => (
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
                      {!isStaff(c) && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.isMember ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {c.isMember ? 'SASCU Member' : 'Non-member'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isStaff(c) && (
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
                  {!isStaff(c) && c.memberId && (
                    <div className="flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
                      <span>{c.memberId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: membership toggle + actions */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                {isStaff(c) ? (
                  <span />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleMembership(c._id, !c.isMember)}
                  >
                    {c.isMember ? 'Remove Membership' : 'Make Member'}
                  </Button>
                )}
                <div className="flex gap-1">
                  {isSuperAdmin && c._id !== meRes?._id && (
                    <Button size="sm" variant="ghost" title="Reset Password" onClick={() => openResetPasswordModal(c)}>
                      <KeyRound className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" title="Edit" onClick={() => openEditModal(c)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!isStaff(c) && (
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
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-900/30">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Membership</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Member ID</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((c: any) => (
                  <tr key={c._id} className="border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-semibold shrink-0">
                          {(c.name || '?').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span className="font-medium truncate">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {isStaff(c) ? (
                        <Badge>
                          <Shield className="w-3 h-3 mr-1" />
                          {c.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Customer</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isStaff(c) ? (
                        <span className="text-gray-400 dark:text-slate-500">—</span>
                      ) : c.isMember ? (
                        <Badge variant="success">Member</Badge>
                      ) : (
                        <Badge variant="secondary">Non-member</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">{!isStaff(c) ? (c.memberId || '-') : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center gap-1">
                        {!isStaff(c) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleMembership(c._id, !c.isMember)}
                          >
                            {c.isMember ? 'Remove Membership' : 'Make Member'}
                          </Button>
                        )}
                        {isSuperAdmin && c._id !== meRes?._id && (
                          <Button size="sm" variant="ghost" title="Reset Password" onClick={() => openResetPasswordModal(c)}>
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" title="Edit" onClick={() => openEditModal(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!isStaff(c) && (
                          <Button size="sm" variant="ghost" title="Delete" className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(c._id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
          </Button>

          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} User</DialogTitle>
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
            {isSuperAdmin && (
              <div>
                <Label>Role</Label>
                {editing && editing._id === meRes?._id ? (
                  <p className="text-sm text-gray-500 mt-1">You cannot change your own role.</p>
                ) : (
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            {!isStaff({ role: form.role }) && (
              <div>
                <Label>SASCU Member ID (optional)</Label>
                <Input
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                  placeholder="e.g. SASCU-00123"
                />
              </div>
            )}
            {!editing && (
              <div>
                <Label>{isStaff({ role: form.role }) ? 'Password' : 'Temporary Password (optional)'}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={isStaff({ role: form.role }) ? 'At least 6 characters' : 'Defaults to temp123456 if left blank'}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {isStaff({ role: form.role })
                    ? 'Required for admin accounts'
                    : 'User can change it later'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password{resetPasswordTarget ? ` for ${resetPasswordTarget.name}` : ''}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
              <p className="text-sm text-gray-500 mt-1">
                The user will need to use this password next time they log in.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting}>
              {resetting ? 'Resetting...' : 'Reset Password'}
            </Button>
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
