
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, AlertCircle } from 'lucide-react';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/components/clients/ClientForm';
import { fetchClientById, updateClient } from '@/utils/clientUtils';
import { Client } from '@/types/client';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EditClient = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load client data
        const clientResult = await fetchClientById(id!);
        
        if (clientResult.success && clientResult.data) {
          setClient(clientResult.data);
        } else {
          setError(clientResult.message);
        }
        
        // Load branches from Supabase
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('id, name')
          .eq('status', 'ACTIVE');
          
        if (branchesError) throw branchesError;
        
        if (branchesData && branchesData.length > 0) {
          setBranches(branchesData);
        } else {
          // Fallback to mock data if no branches exist
          setBranches([
            { id: '1', name: 'Main Branch' },
            { id: '2', name: 'East Branch' },
            { id: '3', name: 'West Branch' },
          ]);
          
          toast({
            variant: "warning",
            title: "Using mock branch data",
            description: "No active branches found in the database"
          });
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleSubmit = async (data: any) => {
    if (!client) return;
    
    setIsSubmitting(true);
    
    try {
      // Ensure the branch ID exists in our branches
      if (!branches.some(branch => branch.id === data.branchId)) {
        throw new Error("Selected branch does not exist");
      }
      
      const result = await updateClient({
        ...client,
        ...data,
        // Ensure dateOfBirth is treated as a date string, not a Date object
        dateOfBirth: data.dateOfBirth
      });
      
      setIsSubmitting(false);
      
      if (result.success) {
        toast({
          title: "Client updated",
          description: "The client has been updated successfully"
        });
        navigate('/clients');
      } else {
        toast({
          variant: "destructive",
          title: "Error updating client",
          description: result.message
        });
      }
    } catch (error: any) {
      console.error("Error updating client:", error);
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Error updating client",
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/clients')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
            <p className="text-muted-foreground">
              Update client information
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2" /> Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">Loading client data...</div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mb-2 text-destructive" />
                  <h3 className="text-xl font-medium mb-1">Error Loading Client</h3>
                  <p>{error}</p>
                  <Button onClick={() => navigate('/clients')} className="mt-4">
                    Return to Clients
                  </Button>
                </div>
              ) : client ? (
                <ClientForm
                  client={client}
                  branches={branches}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default EditClient;
