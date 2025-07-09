import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileUpload } from '@/components/ui/file-upload';
import { ContactModal } from '@/components/ui/contact-modal';
import { StatsCard } from '@/components/ui/stats-card';
import { ContactTable } from '@/components/ui/contact-table';
import { ProcessingStatus } from '@/components/ui/processing-status';
import { VerificationModal } from '@/components/ui/verification-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Contact, BusinessCard, InsertContact } from '@shared/schema';
import {
  Search,
  Filter,
  Download,
  Plus,
  Mail,
  Settings,
  UserCircle,
  Bot,
  NotebookTabs,
  Upload,
  Percent,
  Tags,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Type definitions for API responses
interface ContactsResponse {
  contacts: Contact[];
  totalCount: number;
  hasMore: boolean;
}

interface SearchResponse {
  contacts: Contact[];
}

interface RecentUploadsResponse {
  data: BusinessCard[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface DashboardStats {
  totalContacts: number;
  cardsProcessed: number;
  categories: number;
  accuracy: number;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [uploadsPage, setUploadsPage] = useState(1);
  const [uploadsPageSize, setUploadsPageSize] = useState(5);
  const [isUploadsCollapsed, setIsUploadsCollapsed] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [cardToVerify, setCardToVerify] = useState<BusinessCard | null>(null);
  const [pollingIds, setPollingIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    return res.json();
  };

  // --- Start Polling when a new upload begins ---
  useEffect(() => {
    if (pollingIds.length === 0) return;

    const interval = setInterval(async () => {
      let stillProcessing = false;
      for (const id of pollingIds) {
        try {
          const res = await authenticatedFetch(
            `/api/business-cards/${id}/status`,
          );
          if (res.status === 'processing') {
            stillProcessing = true;
          } else {
            // Processing for this ID is done, remove it and refetch lists
            setPollingIds((prev) => prev.filter((pId) => pId !== id));
            refetchAll();
          }
        } catch (error) {
          console.error(`Error polling for card ${id}:`, error);
          // Stop polling for this ID if it errors
          setPollingIds((prev) => prev.filter((pId) => pId !== id));
        }
      }
      if (!stillProcessing) {
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [pollingIds]);

  // Debounce search query to reduce API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
    queryFn: () => authenticatedFetch('/api/stats'),
  });

  // Fetch contacts
  const {
    data: contactsData,
    isLoading: contactsLoading,
    refetch: refetchContacts,
  } = useQuery<ContactsResponse>({
    queryKey: ['/api/contacts'],
    queryFn: () => authenticatedFetch('/api/contacts'),
  });

  // Fetch recent uploads with pagination
  const { data: recentUploads, isLoading: uploadsLoading } =
    useQuery<RecentUploadsResponse>({
      queryKey: ['/api/business-cards/recent', uploadsPage, uploadsPageSize],
      queryFn: () => {
        const url = new URL(
          '/api/business-cards/recent',
          window.location.origin,
        );
        url.searchParams.set('page', uploadsPage.toString());
        url.searchParams.set('limit', uploadsPageSize.toString());
        return authenticatedFetch(url.toString());
      },
    });

  // Search contacts with debounced query
  const { data: searchResults, isLoading: searchLoading } =
    useQuery<SearchResponse>({
      queryKey: ['/api/contacts/search', debouncedSearchQuery],
      queryFn: () =>
        authenticatedFetch(`/api/contacts/search?q=${debouncedSearchQuery}`),
      enabled: debouncedSearchQuery.length > 0,
    });

  const refetchAll = () => {
    // Invalidate all related queries to refresh the UI
    queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/business-cards/recent'] });
    // Reset to first page when new upload completes
    setUploadsPage(1);
  };

  const handleUploadStarted = (cardId: number) => {
    setPollingIds((prev) => [...prev, cardId]);
    refetchAll(); // Initial refetch to show the 'processing' state
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };

  const handleUploadComplete = () => {
    toast({
      title: 'Processing Complete',
      description: 'Business card has been processed and contact created.',
    });
    refetchAll();
  };

  const handleExportContacts = () => {
    toast({
      title: 'Export Started',
      description: 'Your contacts are being exported to CSV format.',
    });
  };

  const verifyContactMutation = useMutation({
    mutationFn: async (data: {
      cardId: number;
      contactData: InsertContact;
    }) => {
      const token = await getToken();
      return apiRequest(`/api/business-cards/${data.cardId}/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data.contactData),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Contact Verified',
        description: 'The new contact has been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({
        queryKey: ['/api/business-cards/recent'],
      });
      setCardToVerify(null);
    },
    onError: () => {
      toast({
        title: 'Verification Failed',
        description: 'There was an error saving the contact. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleVerify = (businessCard: BusinessCard) => {
    setCardToVerify(businessCard);
  };

  const handleSaveVerification = (contactData: InsertContact) => {
    if (cardToVerify) {
      verifyContactMutation.mutate({ cardId: cardToVerify.id, contactData });
    }
  };

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const token = await getToken();
      return apiRequest(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: 'Contact Deleted',
        description: 'The contact has been removed from your database.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setContactToDelete(null);
    },
    onError: () => {
      toast({
        title: 'Delete Failed',
        description:
          'There was an error deleting the contact. Please try again.',
        variant: 'destructive',
      });
      setContactToDelete(null);
    },
  });

  const handleContactDelete = (contactId: number) => {
    setContactToDelete(contactId);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete);
    }
  };

  const contacts = debouncedSearchQuery
    ? searchResults?.contacts
    : contactsData?.contacts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bot className="text-primary-blue text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                AI Business Development Assistant
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<NotebookTabs className="h-8 w-8 text-primary-blue" />}
            title="Total Contacts"
            value={stats?.totalContacts || 0}
            loading={statsLoading}
          />
          <StatsCard
            icon={<Upload className="h-8 w-8 text-success-green" />}
            title="Cards Processed"
            value={stats?.cardsProcessed || 0}
            loading={statsLoading}
          />
          <StatsCard
            icon={<Percent className="h-8 w-8 text-warning-yellow" />}
            title="OCR Accuracy"
            value={`${stats?.accuracy || 0}%`}
            loading={statsLoading}
          />
          <StatsCard
            icon={<Tags className="h-8 w-8 text-accent-orange" />}
            title="Categories"
            value={stats?.categories || 0}
            loading={statsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Upload Business Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onUploadStarted={handleUploadStarted} />

                {/* Recent Uploads */}
                {recentUploads?.data && recentUploads.data.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Recent Uploads
                      </h3>
                      <div className="flex items-center gap-2">
                        <Select
                          value={uploadsPageSize.toString()}
                          onValueChange={(value) => {
                            setUploadsPageSize(parseInt(value));
                            setUploadsPage(1);
                          }}
                        >
                          <SelectTrigger className="w-16 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setIsUploadsCollapsed(!isUploadsCollapsed)
                          }
                          className="p-1 h-8 w-8"
                        >
                          {isUploadsCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {!isUploadsCollapsed && (
                      <>
                        <div className="space-y-3">
                          {recentUploads.data.map((upload: BusinessCard) => (
                            <div key={upload.id} className="space-y-2">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center">
                                  <Upload className="h-4 w-4 text-gray-400 mr-3" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {upload.filename}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {upload.createdAt
                                        ? new Date(
                                            upload.createdAt,
                                          ).toLocaleString()
                                        : 'Invalid Date'}
                                    </p>
                                  </div>
                                </div>
                                <ProcessingStatus
                                  businessCard={{
                                    ...upload,
                                    processingError:
                                      upload.processingError || undefined,
                                    ocrConfidence:
                                      upload.ocrConfidence || undefined,
                                    aiConfidence:
                                      upload.aiConfidence || undefined,
                                    createdAt: upload.createdAt.toString(),
                                    updatedAt: upload.updatedAt.toString(),
                                  }}
                                  onVerify={handleVerify}
                                />
                              </div>

                              {/* Show confidence scores and errors if available */}
                              {(upload.ocrConfidence !== null ||
                                upload.aiConfidence !== null ||
                                upload.processingError) && (
                                <div className="ml-7 pl-4 border-l-2 border-gray-200 space-y-1">
                                  {upload.ocrConfidence !== null && (
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-600">
                                        OCR Quality:
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          (upload.ocrConfidence || 0) >= 0.8
                                            ? 'text-green-600'
                                            : (upload.ocrConfidence || 0) >= 0.6
                                              ? 'text-yellow-600'
                                              : 'text-red-600'
                                        }`}
                                      >
                                        {Math.round(
                                          (upload.ocrConfidence || 0) * 100,
                                        )}
                                        %
                                      </span>
                                    </div>
                                  )}
                                  {upload.aiConfidence !== null && (
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-gray-600">
                                        AI Extraction:
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          (upload.aiConfidence || 0) >= 0.8
                                            ? 'text-green-600'
                                            : (upload.aiConfidence || 0) >= 0.6
                                              ? 'text-yellow-600'
                                              : 'text-red-600'
                                        }`}
                                      >
                                        {Math.round(
                                          (upload.aiConfidence || 0) * 100,
                                        )}
                                        %
                                      </span>
                                    </div>
                                  )}
                                  {upload.processingError && (
                                    <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                                      <span className="font-medium">
                                        Error:
                                      </span>{' '}
                                      {upload.processingError}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Pagination Controls */}
                        {recentUploads.pagination &&
                          recentUploads.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                              <div className="text-xs text-gray-500">
                                Page {recentUploads.pagination.page} of{' '}
                                {recentUploads.pagination.totalPages}(
                                {recentUploads.pagination.totalCount} total)
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setUploadsPage(uploadsPage - 1)
                                  }
                                  disabled={!recentUploads.pagination.hasPrev}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setUploadsPage(uploadsPage + 1)
                                  }
                                  disabled={!recentUploads.pagination.hasNext}
                                  className="h-8 w-8 p-0"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportContacts}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All Contacts
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manual Contact
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled
                >
                  <Mail className="mr-2 h-4 w-4" />
                  AI Outreach (Phase 2)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card>
              {/* Search and Filter Header */}
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Ask me anything about your contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Try: "Show me all contacts from construction industry" or
                      "Find people I met last month"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={industryFilter}
                      onValueChange={setIndustryFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="construction">
                          Construction
                        </SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="outline">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Contacts Table */}
              <ContactTable
                contacts={contacts || []}
                loading={contactsLoading || searchLoading}
                onContactClick={handleContactClick}
                onContactDelete={handleContactDelete}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        contact={selectedContact}
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      <VerificationModal
        businessCard={cardToVerify}
        isOpen={cardToVerify !== null}
        onClose={() => setCardToVerify(null)}
        onSave={handleSaveVerification}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={contactToDelete !== null}
        onOpenChange={() => setContactToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot
              be undone and will permanently remove the contact from your
              database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
