import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import type { BusinessCard, InsertContact } from '@shared/schema';

interface VerificationModalProps {
  businessCard: BusinessCard | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: InsertContact) => void;
}

export function VerificationModal({
  businessCard,
  isOpen,
  onClose,
  onSave,
}: VerificationModalProps) {
  const [formData, setFormData] = useState<InsertContact>({
    name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    industry: '',
    address: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    if (businessCard?.extractedData) {
      const data = businessCard.extractedData as any;
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        title: data.title || '',
        industry: data.industry || '',
        address: data.address || '',
        website: data.website || '',
        notes: data.notes || `Extracted from ${businessCard.filename}`,
      });
    }
  }, [businessCard]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!businessCard) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify Contact Information</DialogTitle>
          <DialogDescription>
            The OCR quality was low. Please review and correct the extracted
            information before saving.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input
              id="company"
              name="company"
              value={formData.company || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="industry" className="text-right">
              Industry
            </Label>
            <Input
              id="industry"
              name="industry"
              value={formData.industry || ''}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Contact</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
