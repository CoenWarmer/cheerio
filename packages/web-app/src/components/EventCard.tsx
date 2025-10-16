'use client';

import Link from 'next/link';
import { Paper, Badge, Group } from '@mantine/core';
import { IconMapPin, IconRun, IconUsers } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { usePresence } from '@/hooks/usePresence';
import { Countdown } from '@/components/Countdown';
import classes from '@/app/[locale]/events/EventsList.module.css';

interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_private: boolean;
  location_label: string | null;
  start_time: string | null;
}

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const t = useTranslations('events');
  const { count: activeUserCount } = usePresence(event.id, event.slug);

  return (
    <Paper
      key={event.id}
      component={Link}
      href={`/event/${event.slug}`}
      shadow="md"
      radius="md"
      className={classes.eventCard}
    >
      <Group
        style={{
          display: 'flex',
          flexGrow: 1,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Group>
          {/* Icon Section */}
          <div className={classes.iconSection}>
            <IconRun size={32} className={classes.icon} stroke={1.5} />
          </div>

          {/* Content Section */}
          <div className={classes.content}>
            <div className={classes.header}>
              <h3 className={classes.title}>{event.name}</h3>
              {event.is_private && (
                <Badge color="yellow" variant="light" size="sm">
                  🔒 {t('private')}
                </Badge>
              )}
            </div>

            {event.description && (
              <p className={classes.description}>{event.description}</p>
            )}
            <div className={classes.metadata}>
              {event.location_label && (
                <div className={classes.metaItem}>
                  <IconMapPin size={14} />
                  <span>
                    {t('location')}: {event.location_label}
                  </span>
                </div>
              )}
              {activeUserCount > 0 && (
                <div className={classes.metaItem}>
                  <IconUsers size={14} />
                  <span>
                    {activeUserCount}{' '}
                    {activeUserCount === 1 ? t('activeUser') : t('activeUsers')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Group>

        {event.start_time && new Date(event.start_time) > new Date() && (
          <div className={classes.countdownWrapper}>
            <Countdown targetDate={new Date(event.start_time)} />
          </div>
        )}
      </Group>
    </Paper>
  );
}
