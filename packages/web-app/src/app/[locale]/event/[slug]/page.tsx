import { use } from 'react';
import EventPageClient from '@/components/EventPageClient';

export default function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return <EventPageClient eventSlug={slug} />;
}
