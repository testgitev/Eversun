export function formatDateFR(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getStatutBadgeColor(statut?: string) {
  if (!statut)
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';

  const statutLower = statut.toLowerCase();

  if (statutLower.includes('accord')) {
    return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-400 dark:border-emerald-700';
  }
  if (statutLower.includes('refus')) {
    return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-400 dark:border-red-700';
  }
  if (statutLower.includes('abf')) {
    return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-400 dark:border-orange-700';
  }
  if (statutLower.includes('en cours') || statutLower.includes('attente')) {
    return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-400 dark:border-blue-700';
  }
  if (statutLower.includes('visé') || statutLower.includes('visite')) {
    return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-300 dark:from-purple-900/40 dark:to-violet-900/40 dark:text-purple-400 dark:border-purple-700';
  }
  if (statutLower.includes('transmise') || statutLower.includes('effectuer')) {
    return 'bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-700 border-cyan-300 dark:from-cyan-900/40 dark:to-sky-900/40 dark:text-cyan-400 dark:border-cyan-700';
  }

  return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';
}

export function getFinancementBadgeColor(financement?: string) {
  if (!financement)
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';

  if (financement.toLowerCase() === 'sunlib') {
    return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-400 dark:border-yellow-700';
  }
  if (financement.toLowerCase() === 'otovo') {
    return 'bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-300 dark:from-indigo-900/40 dark:to-violet-900/40 dark:text-indigo-400 dark:border-indigo-700';
  }
  if (financement.toLowerCase() === 'upfront') {
    return 'bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-700 border-cyan-300 dark:from-cyan-900/40 dark:to-sky-900/40 dark:text-cyan-400 dark:border-cyan-700';
  }

  return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';
}

export function getRaccordementBadgeColor(raccordement?: string) {
  if (!raccordement)
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';

  if (raccordement === 'Demande à effectuer') {
    return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300 dark:from-orange-900/40 dark:to-amber-900/40 dark:text-orange-400 dark:border-orange-700';
  }
  if (raccordement === 'Demande transmise') {
    return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-300 dark:from-blue-900/40 dark:to-indigo-900/40 dark:text-blue-400 dark:border-blue-700';
  }
  if (raccordement === 'Mise en service') {
    return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-400 dark:border-emerald-700';
  }

  return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';
}

export function getTypeConsuelBadgeColor(typeConsuel?: string) {
  if (!typeConsuel)
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';

  if (typeConsuel === 'Violet') {
    return '!bg-purple-600 !text-white !border-purple-700 dark:!bg-purple-700 dark:!border-purple-800';
  }
  if (typeConsuel === 'Bleu') {
    return '!bg-blue-600 !text-white !border-blue-700 dark:!bg-blue-700 dark:!border-blue-800';
  }

  return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';
}


export function getCauseNonPresenceBadgeColor(causeNonPresence?: string) {
  if (!causeNonPresence)
    return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';

  if (causeNonPresence === 'Consuel non demandé') {
    return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 border-gray-300 dark:from-gray-800 dark:to-slate-800 dark:text-gray-400 dark:border-gray-700';
  }
  if (causeNonPresence === 'Consuel refusé pour cause technique') {
    return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-300 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-400 dark:border-red-700';
  }
  if (causeNonPresence === 'Consuel refusé pour cause administrative') {
    return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-300 dark:from-yellow-900/40 dark:to-amber-900/40 dark:text-yellow-400 dark:border-yellow-700';
  }
  if (causeNonPresence === 'Consuel envoyé') {
    return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-300 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-400 dark:border-emerald-700';
  }

  return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300 dark:border-gray-600';
}
