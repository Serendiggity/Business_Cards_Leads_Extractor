import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/ui/file-upload";
import { ContactModal } from "@/components/ui/contact-modal";
import { StatsCard } from "@/components/ui/stats-card";
import { ContactTable } from "@/components/ui/contact-table";
import { ProcessingStatus } from "@/components/ui/processing-status";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Tags
} from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [selectedContact, setSelectedContact] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Fetch recent uploads
  const { data: recentUploads, isLoading: uploadsLoading } = useQuery({
    queryKey: ["/api/business-cards/recent"],
  });

  // Search contacts
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/contacts/search", searchQuery],
    enabled: searchQuery.length > 0,
  });

  const handleContactClick = (contact: any) => {
    setSelectedContact(contact);
    setIsContactModalOpen(true);
  };

  const handleUploadComplete = () => {
    toast({
      title: "Processing Complete",
      description: "Business card has been processed and contact created.",
    });
    // Invalidate all related queries to refresh the UI
    queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/business-cards/recent"] });
  };

  const handleExportContacts = () => {
    toast({
      title: "Export Started",
      description: "Your contacts are being exported to CSV format.",
    });
  };

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: (contactId: number) => 
      apiRequest(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({
        title: "Contact Deleted",
        description: "The contact has been removed from your database.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContactDelete = (contactId: number) => {
    if (window.confirm("Are you sure you want to delete this contact? This action cannot be undone.")) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const contacts = searchQuery ? searchResults?.contacts : contactsData?.contacts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bot className="text-primary-blue text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">AI Business Development Assistant</h1>
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
                <FileUpload onUploadComplete={handleUploadComplete} />
                
                {/* Recent Uploads */}
                {recentUploads && recentUploads.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Uploads</h3>
                    <div className="space-y-3">
                      {recentUploads.map((upload: any) => (
                        <div key={upload.id} className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                              <Upload className="h-4 w-4 text-gray-400 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{upload.filename}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(upload.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <ProcessingStatus businessCard={upload} />
                          </div>
                          
                          {/* Show confidence scores and errors if available */}
                          {(upload.ocrConfidence !== undefined || upload.aiConfidence !== undefined || upload.processingError) && (
                            <div className="ml-7 pl-4 border-l-2 border-gray-200 space-y-1">
                              {upload.ocrConfidence !== undefined && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">OCR Quality:</span>
                                  <span className={`font-medium ${
                                    upload.ocrConfidence >= 0.8 ? 'text-green-600' :
                                    upload.ocrConfidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {Math.round(upload.ocrConfidence * 100)}%
                                  </span>
                                </div>
                              )}
                              {upload.aiConfidence !== undefined && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">AI Extraction:</span>
                                  <span className={`font-medium ${
                                    upload.aiConfidence >= 0.8 ? 'text-green-600' :
                                    upload.aiConfidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {Math.round(upload.aiConfidence * 100)}%
                                  </span>
                                </div>
                              )}
                              {upload.processingError && (
                                <div className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                                  <span className="font-medium">Error:</span> {upload.processingError}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
                <Button variant="outline" className="w-full justify-start" disabled>
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
                      Try: "Show me all contacts from construction industry" or "Find people I met last month"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
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
    </div>
  );
}
