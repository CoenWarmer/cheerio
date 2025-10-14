import { use } from 'react';
import RoomPageClient from '@/components/RoomPageClient';

export default function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return <RoomPageClient roomSlug={slug} />;
}
