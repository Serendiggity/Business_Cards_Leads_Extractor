import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus, Mail, Linkedin } from "lucide-react";

interface ContactModalProps {
  contact: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ contact, isOpen, onClose }: ContactModalProps) {
  const [notes, setNotes] = useState(contact?.notes || "");
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  if (!contact) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getIndustryColor = (industry: string) => {
    const colors = {
      'Construction': 'bg-blue-100 text-blue-800',
      'Technology': 'bg-purple-100 text-purple-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Finance': 'bg-yellow-100 text-yellow-800',
      'Real Estate': 'bg-indigo-100 text-indigo-800',
      'Education': 'bg-pink-100 text-pink-800',
      'Manufacturing': 'bg-gray-100 text-gray-800',
      'Consulting': 'bg-orange-100 text-orange-800',
      'Marketing': 'bg-red-100 text-red-800',
      'Sales': 'bg-teal-100 text-teal-800',
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    try {
      await apiRequest('PUT', `/api/contacts/${contact.id}`, {
        notes,
        tags
      });
      
      toast({
        title: "Contact Updated",
        description: "The contact has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the contact.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Contact Details
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-medium">
              {getInitials(contact.name)}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-medium text-gray-900">{contact.name}</h4>
              <p className="text-gray-600">{contact.title}</p>
              <p className="text-gray-600">{contact.company}</p>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <p className="text-sm text-gray-900 mt-1">{contact.email || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Phone</Label>
              <p className="text-sm text-gray-900 mt-1">{contact.phone || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Industry</Label>
              <div className="mt-1">
                {contact.industry ? (
                  <Badge className={getIndustryColor(contact.industry)}>
                    {contact.industry}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">Not specified</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Added</Label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(contact.createdAt).toLocaleDateString()}
              </p>
            </div>
            {contact.website && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Website</Label>
                <p className="text-sm text-gray-900 mt-1">
                  <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {contact.website}
                  </a>
                </p>
              </div>
            )}
            {contact.address && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-700">Address</Label>
                <p className="text-sm text-gray-900 mt-1">{contact.address}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag"
                    className="h-8 w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Tag
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this contact..."
              rows={3}
              disabled={!isEditing}
              className={isEditing ? '' : 'bg-gray-50'}
            />
          </div>

          {/* Future Phase Placeholders */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Future Features (Coming Soon)</h5>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="mr-2 h-4 w-4" />
                AI-Generated Outreach (Phase 2)
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn Profile Enrichment (Phase 3)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {isEditing ? (
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Contact
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
