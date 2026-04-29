'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { ClientRecord, Section } from '@/types/client';
import { Bell, Warning, MapPin } from '@phosphor-icons/react';

interface ClientCalendarProps {
  section: Section;
  items: ClientRecord[];
  onEdit: (client: ClientRecord) => void;
}

export default function ClientCalendar({
  section,
  items,
  onEdit,
}: ClientCalendarProps) {
  const getEventDate = (client: ClientRecord) => {
    switch (section) {
      case 'dp-en-cours':
        return client.dateEstimative;
      case 'daact':
        return client.dateEnvoi;
      default:
        return client.dateEstimative || client.dateEnvoi;
    }
  };

  const getUrgencyInfo = (client: ClientRecord) => {
    const eventDate = getEventDate(client);
    if (!eventDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const estimatedDate = new Date(eventDate);
    estimatedDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (estimatedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        color: 'from-red-500 to-rose-600',
        label: 'En retard',
        bg: 'bg-red-50 dark:bg-red-900/20 border-red-500',
        urgent: true,
        diffDays,
      };
    }
    if (diffDays === 0) {
      return {
        color: 'from-red-500 to-orange-500',
        label: "Aujourd'hui",
        bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-500',
        urgent: true,
        diffDays,
      };
    }
    if (diffDays <= 3) {
      return {
        color: 'from-orange-500 to-amber-500',
        label: 'Urgent',
        bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-500',
        urgent: true,
        diffDays,
      };
    }
    if (diffDays <= 7) {
      return {
        color: 'from-yellow-500 to-amber-500',
        label: 'Proche',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500',
        urgent: false,
        diffDays,
      };
    }
    if (diffDays <= 14) {
      return {
        color: 'from-emerald-500 to-green-500',
        label: 'À venir',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500',
        urgent: false,
        diffDays,
      };
    }
    return null;
  };

  const upcomingEvents = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        urgency: getUrgencyInfo(item),
        eventDate: getEventDate(item),
      }))
      .filter((item) => item.urgency !== null)
      .sort((a, b) => {
        if (!a.eventDate || !b.eventDate) return 0;
        return (
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );
      });
  }, [items]);

  const urgentEvents = upcomingEvents.filter((item) => item.urgency?.urgent);
  const upcomingNonUrgent = upcomingEvents.filter(
    (item) => !item.urgency?.urgent
  );

  return (
    <div className="space-y-6">
      {urgentEvents.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md">
              <Bell className="h-5 w-5 animate-pulse" weight="bold" />
            </div>
            Échéances urgentes ({urgentEvents.length})
          </h3>
          <div className="space-y-3">
            {urgentEvents.map((item) => (
              <div
                key={item._id || item.id}
                onClick={() => onEdit(item)}
                className={`p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 relative hover:scale-[1.01] ${item.urgency?.bg}`}
              >
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md animate-pulse z-10">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {item.client}
                    </div>
                    {item.ville && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.ville}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.eventDate &&
                        format(new Date(item.eventDate), 'dd MMM', {
                          locale: fr,
                        })}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${item.urgency?.color} text-white shadow-sm mt-2`}
                    >
                      {item.urgency?.label} ({item.urgency?.diffDays}j)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingNonUrgent.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-md">
              <Warning className="h-5 w-5" weight="bold" />
            </div>
            À venir ({upcomingNonUrgent.length})
          </h3>
          <div className="space-y-3">
            {upcomingNonUrgent.map((item) => (
              <div
                key={item._id || item.id}
                onClick={() => onEdit(item)}
                className={`p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.01] ${item.urgency?.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">
                      {item.client}
                    </div>
                    {item.ville && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.ville}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.eventDate &&
                        format(new Date(item.eventDate), 'dd MMM yyyy', {
                          locale: fr,
                        })}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${item.urgency?.color} text-white shadow-sm mt-2`}
                    >
                      {item.urgency?.label} ({item.urgency?.diffDays}j)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center">
            <Warning
              className="w-8 h-8 text-teal-600 dark:text-teal-400"
              weight="bold"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Aucune échéance à venir dans les 14 prochains jours
          </p>
        </div>
      )}
    </div>
  );
}
