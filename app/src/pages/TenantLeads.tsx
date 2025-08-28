import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantRole } from '@/hooks/useTenantRole';
import { useTenantSlug, getTenantPath } from '@/lib/tenant';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, LogOut } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
}

export default function TenantLeads() {
  const { user, signOut } = useAuth();
  const { role, tenantId } = useTenantRole();
  const tenantSlug = useTenantSlug();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const canEdit = role === 'admin' || role === 'editor';

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
    fetchLeads();
  }, [tenantId]);

  const fetchLeads = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching leads',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !canEdit) return;

    try {
      setCreating(true);
      const { error } = await supabase
        .from('leads')
        .insert({
          tenant_id: tenantId,
          name: name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          source: 'web',
          status: 'new',
        });

      if (error) throw error;

      toast({
        title: 'Lead created',
        description: 'New lead has been added successfully.',
      });

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setShowForm(false);
      
      // Refresh leads
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Error creating lead',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!canEdit) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Lead deleted',
        description: 'Lead has been removed successfully.',
      });

      // Refresh leads
      fetchLeads();
    } catch (error) {
      toast({
        title: 'Error deleting lead',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={getTenantPath(tenantSlug, '/admin')}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Leads</h1>
            <Badge variant="secondary">{tenantSlug}</Badge>
            <Badge variant="outline">{role}</Badge>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Leads ({leads.length})</h2>
          {canEdit && (
            <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          )}
        </div>

        {showForm && canEdit && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Lead</CardTitle>
              <CardDescription>Add a new lead to your database</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createLead} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Lead name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="lead@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Lead'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">No leads found</p>
              {canEdit && (
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  Add First Lead
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{lead.name || 'Unnamed Lead'}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {lead.email && <p>Email: {lead.email}</p>}
                        {lead.phone && <p>Phone: {lead.phone}</p>}
                        <p>Source: {lead.source || 'Unknown'}</p>
                        <p>Created: {new Date(lead.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                          {lead.status || 'new'}
                        </Badge>
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLead(lead.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
