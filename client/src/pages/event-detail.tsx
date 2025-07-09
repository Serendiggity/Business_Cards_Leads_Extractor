import React from 'react';
import { useRoute } from 'wouter';

export default function EventDetailPage() {
  const [, params] = useRoute<{ id: string }>('/events/:id');
  const id = params?.id;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Event Details</h2>
      <p>Event ID: {id}</p>
      <p>This page will show event-specific contacts and actions. Coming soon!</p>
    </div>
  );
} 