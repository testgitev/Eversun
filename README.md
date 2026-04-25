# Eversun SaaS Dashboard

Dashboard de suivi des installations solaires pour Eversun. Application Next.js avec TypeScript, MongoDB, et Tailwind CSS.

## 🚀 Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Base de données**: MongoDB avec Mongoose
- **Styling**: Tailwind CSS
- **Gestion d'état**: React Query (TanStack Query)
- **Validation**: Zod + react-hook-form
- **Icons**: Lucide React
- **Charts**: Chart.js + react-chartjs-2

## 📋 Fonctionnalités

- Gestion des dossiers de Déclaration Préalable (DP)
- Suivi des certifications Consuel
- Gestion des demandes de raccordement
- Suivi des installations avec statut, financing et commentaires
- Options de financement : Otovo, Sunlib, Upfront
- Gestion des dates de pose et des dates de PV séparées
- Interface responsive (desktop et mobile)
- Pagination côté serveur
- Recherche et tri des données
- Vue tableau et grille

## 🛠️ Installation

1. Cloner le repository

```bash
git clone <repository-url>
cd eversun-saas-dashboard
```

2. Installer les dépendances

```bash
npm install
```

3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` avec vos configurations:

```env
MONGODB_URI=mongodb://localhost:27017/eversun
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## � Déploiement sur Vercel

### Option 1: Via l'interface Vercel (Recommandé)

1. **Créer un repository GitHub**
   - Créez un repository sur GitHub avec le code du projet
   - Pushez les changements vers GitHub

2. **Importer sur Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Add New Project"
   - Importez votre repository GitHub

3. **Configurer les variables d'environnement**
   Dans les paramètres du projet Vercel, ajoutez ces variables:

   ```
   MONGODB_URI=mongodb+srv://your-connection-string
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-secret-key-here
   NODE_ENV=production
   ```

4. **Déployer**
   - Cliquez sur "Deploy"
   - Vercel construira et déploiera automatiquement

### Option 2: Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel
```

### Variables d'environnement MongoDB

Pour Vercel, utilisez MongoDB Atlas:

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit
3. Obtenez votre connection string
4. Ajoutez l'IP Vercel (0.0.0.0/0) aux IP whitelist

### Domaine personnalisé

Après déploiement:

1. Allez dans Settings > Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions Vercel

## �📁 Structure du Projet

```
├── app/                    # App Router Next.js
│   ├── api/               # API routes
│   │   ├── clients/       # Endpoints clients
│   │   └── login/         # Endpoint auth
│   ├── globals.css       # Styles globaux
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Page d'accueil
├── components/            # Composants React
│   ├── ui/               # Composants UI réutilisables
│   ├── ClientForm.tsx    # Formulaire client
│   ├── ClientSection.tsx # Section client
│   ├── ClientTable.tsx   # Tableau client
│   └── Dashboard.tsx     # Dashboard principal
├── hooks/                # Hooks personnalisés
│   └── useClients.ts     # Hook React Query pour clients
├── lib/                  # Utilitaires
│   ├── clientModel.ts    # Modèle Mongoose
│   ├── mongo.ts          # Connection MongoDB
│   ├── password.ts       # Hashage mots de passe
│   ├── react-query.tsx   # Provider React Query
│   ├── utils.ts          # Utilitaires
│   └── validation.ts     # Schémas Zod
├── types/                # Types TypeScript
│   └── client.ts         # Types client
└── public/               # Assets statiques
```

## 🔒 Sécurité

### Hashage des Mots de Passe

Les mots de passe sont automatiquement hashés avec bcrypt avant d'être stockés en base de données.

### Variables d'Environnement

- Ne jamais commit les fichiers `.env`
- Utiliser `.env.example` comme template
- Générer un `NEXTAUTH_SECRET` sécurisé en production

## 📊 API Endpoints

### Clients

**GET** `/api/clients`

- Récupère tous les clients
- Supporte la pagination: `?page=1&limit=50`
- Filtrage par section: `?section=dp-en-cours`

**POST** `/api/clients`

- Crée un nouveau client
- Body: JSON avec les données du client
- Gère maintenant les sections dans une collection unifiée `clients`
- Prend en charge les champs `financement`, `commentaires`, `pvChantierDate`, `datePose`

**PATCH** `/api/clients/[id]?section=X`

- Met à jour un client
- Body: JSON avec les champs à modifier
- Permet de mettre à jour le statut de l'installation, le financement, les commentaires et les dates

**DELETE** `/api/clients/[id]?section=X`

- Supprime un client

## 🧪 Tests

```bash
# Lancer les tests unitaires
npm test

# Lancer les tests avec watch
npm test -- --watch
```

## 🎨 Styles

Le projet utilise un design system personnalisé défini dans `globals.css` avec:

- Palette de couleurs professionnelle
- Composants UI pré-stylés
- Animations et transitions
- Support dark mode (à implémenter)

## 📝 Améliorations Récemment Apportées

### Haute Priorité ✅

- **Hashage mots de passe**: Implémentation de bcrypt pour sécuriser les mots de passe
- **Pagination serveur**: API endpoints supportent maintenant la pagination
- **React Query**: Mise en place du caching et gestion d'état des données
- **Validation client-side**: react-hook-form + Zod pour validation robuste
- **Refactor des clients**: centralisation sur une collection `clients` unifiée et métadonnées de section normalisées
- **Installation améliorée**: ajout de `financement`, `commentaires`, `date de pose` et champ `pvChantierDate`
- **Nettoyage console.log**: Suppression de tous les logs de debug


### Moyenne Priorité ✅

- **Configuration ESLint**: Règles personnalisées pour qualité du code
- **Configuration Prettier**: Formatting automatique
- **.gitignore amélioré**: Exclusion des fichiers générés et sensibles
- **Template .env.example**: Guide pour configuration


### En Cours ⏳

- **Refactoring composants**: Extraction de la logique métier
- **Tests unitaires**: Ajout de tests pour les composants
- **Documentation**: README et documentation API

### À Faire 📋

- **NextAuth.js**: Implémentation de l'authentification
- **Tests E2E**: Configuration Playwright
- **State management global**: Zustand pour état partagé
- **Accessibilité**: Audit et améliorations WCAG
- **Framer Motion**: Animations fluides


## 🚀 Déploiement

### Vercel

Le projet est configuré pour Vercel. Connectez votre repository et déployez automatiquement.

### Variables d'Environnement en Production

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=secure-random-string
NODE_ENV=production
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est privé et propriétaire d'Eversun.

## 📞 Support

Pour toute question ou problème, contactez l'équipe technique d'Eversun.
