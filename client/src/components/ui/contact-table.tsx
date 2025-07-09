import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Edit, Mail, Trash2 } from 'lucide-react';

interface ContactTableProps {
  contacts: any[];
  loading?: boolean;
  onContactClick: (contact: any) => void;
  onContactDelete?: (contactId: number) => void;
}

export function ContactTable({
  contacts,
  loading = false,
  onContactClick,
  onContactDelete,
}: ContactTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getIndustryColor = (industry: string) => {
    const colors = {
      Construction: 'bg-blue-100 text-blue-800',
      Technology: 'bg-purple-100 text-purple-800',
      Healthcare: 'bg-green-100 text-green-800',
      Finance: 'bg-yellow-100 text-yellow-800',
      'Real Estate': 'bg-indigo-100 text-indigo-800',
      Education: 'bg-pink-100 text-pink-800',
      Manufacturing: 'bg-gray-100 text-gray-800',
      Consulting: 'bg-orange-100 text-orange-800',
      Marketing: 'bg-red-100 text-red-800',
      Sales: 'bg-teal-100 text-teal-800',
    };
    return colors[industry] || 'bg-gray-100 text-gray-800';
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-primary',
      'bg-accent-orange',
      'bg-success-green',
      'bg-warning-yellow',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-gray-500',
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No contacts found</div>
        <p className="text-gray-400">
          Upload some business cards to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(contact.name)}`}
                    >
                      {getInitials(contact.name)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {contact.name}
                    </div>
                    <div className="text-sm text-gray-500">{contact.title}</div>
                    <div className="text-sm text-gray-500">{contact.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{contact.company}</div>
                <div className="text-sm text-gray-500">{contact.phone}</div>
              </TableCell>
              <TableCell>
                {contact.industry ? (
                  <Badge className={getIndustryColor(contact.industry)}>
                    {contact.industry}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-500">Not specified</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {new Date(contact.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onContactClick(contact)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="text-gray-400"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  {onContactDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onContactDelete(contact.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Table Footer */}
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {contacts.length} contacts
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
