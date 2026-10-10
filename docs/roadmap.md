# Heliotrope — Feuille de route après le MVP

> Statut : proposition v0.1 (2026-10-10), à valider par Antoine. Ce document classe les mécaniques à ajouter
> maintenant que le MVP (jalons M1 à M4) est livré. Il ne fixe aucun chiffre : `docs/game-design.md` reste la
> référence pour les mécaniques et l'équilibrage, et chaque mécanique retenue y sera décrite dans la PR qui
> l'implémente. Les valeurs données ici sont des ordres de grandeur à confirmer avec le simulateur (§8).

## Sommaire

1. [État des lieux](#1-état-des-lieux)
2. [Ce qui manque, comparé aux bons jeux incrémentaux](#2-ce-qui-manque-comparé-aux-bons-jeux-incrémentaux)
3. [Mécaniques proposées, par priorité](#3-mécaniques-proposées-par-priorité)
4. [Jalons proposés](#4-jalons-proposés)
5. [Ce qu'on écarte ou repousse](#5-ce-quon-écarte-ou-repousse)
6. [Décisions pour Antoine](#6-décisions-pour-antoine)

---

## 1. État des lieux

Ce que le jeu propose aujourd'hui (main au 2026-10-10, après la PR #8) :

| Système | Contenu | Où |
|---|---|---|
| Clic | Héliotrope cliquable, 5 améliorations de clic (×2, puis % de la production) | §5.2 |
| Générateurs | 8 bâtiments du pot à l'Arcologie, coût ×1,15, achat ×1 / ×10 / ×100 / Max, silhouette du suivant | §4 |
| Améliorations | 56 ×2 par générateur, 5 de clic, 3 synergies, bonus de biodiversité passif (jusqu'à +48 %) | §5 |
| Prestige | Saisons : Graines d'Héliotrope, +5 % de production chacune, conseil d'attendre 10 Graines | §7 |
| Succès | 43 Jalons à +1 % chacun, dont 3 cachés, conservés entre les Saisons | §9.3 |
| Événement | Papillon doré toutes les 3 à 8 min : Floraison, Récolte ou Pollinisation | §9.2 |
| Scène | Vue de face, ciel selon la phase, teinte selon la saison visuelle | §6, §10.4 |
| Confort | Hors ligne 100 % plafonné à 8 h, sauvegarde auto, export / import, notation scientifique, animations réduites, mise en page mobile | §9, §10 |

**Bilan.** La boucle courte et la boucle moyenne sont complètes. Ce qui manque surtout, c'est la boucle longue :
une fois l'Arcologie achetée, le joueur n'a plus que deux leviers (empiler et relancer une Saison), et la
Saison ne lui laisse **aucun choix** : il reçoit un bonus plat, toujours le même. Le monde, lui, ne garde aucune
trace de ce que le joueur a construit, alors que le pitch promet un quartier qui reverdit.

Deux chantiers sont déjà en cours en parallèle et ne sont pas repris ici :

- **Équilibrage plus doux** (rythme plus rapide, paliers plus satisfaisants) : il réécrit §4, §7 et §8.
- **Quartier en vue du dessus** : bâtiments qui apparaissent avec des animations à chaque achat. Plusieurs
  propositions ci-dessous s'appuient dessus.

---

## 2. Ce qui manque, comparé aux bons jeux incrémentaux

Ce que les références du genre font bien, et où Heliotrope en est :

| Ce qui rend un incrémental satisfaisant | Référence | Heliotrope aujourd'hui |
|---|---|---|
| Le prestige donne des **choix** à dépenser, pas seulement un bonus | Cookie Clicker (puces célestes), Realm Grinder | Bonus plat uniquement |
| L'**automatisation** se gagne et allège les tâches répétitives à chaque relance | Antimatter Dimensions, Trimps | Rien : chaque Saison se rejoue à la main |
| Des **projets uniques** qui racontent quelque chose et changent les règles | Universal Paperclips, A Dark Room | Les améliorations sont des multiplicateurs muets |
| Une **deuxième ressource** qui ouvre une nouvelle couche de jeu | Kittens Game, Egg, Inc. | Une seule monnaie |
| Une **collection** à compléter, distincte des succès | Cookie Clicker (laits, saveurs), Cats & Soup | Jalons seulement |
| Des **défis** qui font rejouer autrement | Antimatter Dimensions, NGU Idle | Aucun |
| Un **monde qui garde la trace** du progrès | Egg, Inc. (ferme), Melvor Idle (village) | Scène qui change de teinte, en cours de refonte |
| Un **son** qui donne du poids aux achats | Cookie Clicker, Cats & Soup | Pas de son |

Le fil commun : les meilleurs incrémentaux transforment chaque palier en **décision** ou en **changement visible**.
C'est exactement ce qui manque à la satisfaction de passer les paliers.

---

## 3. Mécaniques proposées, par priorité

Chaque mécanique est notée sur deux critères : ce qu'elle apporte au **thème solarpunk** (réparer un monde,
ensemble) et à la **satisfaction du joueur** (sentir qu'il progresse). L'effort est une estimation relative.

### P1 — Parcelles du quartier à restaurer *(reprend §13.1)*

Le quartier en vue du dessus montre des parcelles grises : un parking, une friche, un toit nu, un canal bétonné.
Le joueur les restaure contre de la Lumière, une à une ; chacune devient un parc, un verger, une rivière, avec
une animation et un bonus ciblé (un parc : clic plus fort ; une rivière dépolluée :
+1 h de plafond hors ligne ; un verger : +% à un générateur). Les parcelles restent restaurées d'une Saison à
l'autre, ou repartent en friche mais se restaurent moins cher (décision D2).

- **Thème :** c'est le cœur du pitch. On ne fait pas seulement grimper un compteur, on rend un lieu vivable.
- **Satisfaction :** un objectif visible et unique entre deux générateurs, avec une récompense qu'on voit.
- **Effort :** moyen, parce que la vue du dessus fournit déjà la carte et les animations.

### P2 — Arbre des Saisons *(reprend §7 et §13.2)*

Les Graines deviennent aussi une monnaie à dépenser dans un arbre de talents permanents, sans réduire leur
bonus de +5 % (modèle déjà décrit au §7). Une vingtaine de nœuds en trois branches :

- **Racines (production) :** garder 10 % des générateurs à la Saison suivante, synergies plus fortes,
  biodiversité dès 5 exemplaires.
- **Pollinisateurs (actif) :** Papillon doré plus fréquent, Floraison plus longue, clic qui gagne avec le temps
  joué dans la Saison.
- **Mémoire (confort) :** hors ligne plafonné à 12 h puis 24 h, achat automatique des générateurs (voir P3),
  améliorations achetées seules.

- **Thème :** « la terre garde la mémoire de ce qui a poussé » devient une mécanique.
- **Satisfaction :** chaque Saison apporte un choix ; deux joueurs n'ont pas le même arbre.
- **Effort :** moyen (données + écran + sauvegarde), surtout de l'équilibrage.

### P3 — Automatisation gagnée : les Coopératives

Des automatismes qui achètent à la place du joueur : la coopérative des jardiniers achète les Héliotropes en
pot, celle des électriciens les Panneaux, et ainsi de suite ; plus tard, une coopérative achète les
améliorations. On les débloque dans l'Arbre des Saisons ou par des Jalons, on les règle (en marche, à l'arrêt,
« garder 10 % de la réserve »).

- **Thème :** le quartier s'organise lui-même ; ce sont des voisins, pas des robots.
- **Satisfaction :** les débuts de Saison, rejoués à l'identique, deviennent rapides ; le joueur se concentre sur
  les décisions.
- **Effort :** faible à moyen, la logique d'achat existe déjà dans le simulateur.

### P4 — Projets du quartier

Des projets uniques, présentés comme des décisions de l'assemblée de quartier (« Voter le jardin partagé de la
rue des Tilleuls »), chacun avec un coût, un changement visible sur la carte et un effet qui **change une règle** plutôt que de
multiplier un chiffre : les Panneaux produisent aussi la nuit grâce aux batteries partagées, le Papillon doré
peut amener un deuxième papillon, la Serre double la biodiversité… Une quinzaine pour commencer, débloqués par la
phase et les parcelles.

- **Thème :** collectif ; prolonge le pilier « Collectif » (§1). Le projet se raconte par ce qu'il change à l'écran (le jardin apparaît dans la rue, les batteries s'allument), pas par du texte.
- **Satisfaction :** des paliers qui surprennent, ce que les ×2 ne font plus après la première heure.
- **Effort :** moyen, surtout de l'écriture.

### P5 — Herbier : une collection d'espèces

Les espèces reviennent à mesure que le quartier reverdit : abeilles, mésanges, hérissons, fougères, coquelicots.
Chaque espèce s'obtient par une condition liée au jeu (une parcelle restaurée, 50 Serres, un Papillon rare) et
apparaît dans la vue du dessus. L'herbier complet donne un bonus de biodiversité qui prolonge le §5.4.

- **Thème :** la biodiversité visible, sans écran de statistiques.
- **Satisfaction :** une collection à compléter, avec des découvertes inattendues.
- **Effort :** moyen, surtout des illustrations.

### P6 — Sons discrets et ambiance *(reprend §13.6)*

Un clic doux, un accord pour chaque achat de palier, des oiseaux qui apparaissent avec la phase 2, un réglage de
volume. Musique d'ambiance optionnelle.

- **Thème :** le pilier « Élégant et lumineux » (§1) cite déjà des sons discrets.
- **Satisfaction :** c'est souvent ce qui donne du poids à un achat ; peu coûteux pour un gros effet.
- **Effort :** faible côté code, il faut trouver ou produire des sons sous licence libre.

### P7 — Saisons à défis *(reprend §13.5)*

Des Saisons à contrainte, choisies avant de lancer la Nouvelle Saison : « sans Panneaux », « le clic seulement »,
« un seul bâtiment par type de parcelle ». Chaque défi réussi donne une récompense unique (un nœud de l'arbre,
une espèce de l'herbier, une parcelle rare).

- **Thème :** des Saisons à thème (« l'été de la sécheresse »), montrées par la scène, plutôt que des punitions.
- **Satisfaction :** du contenu de fin de partie qui réutilise l'existant.
- **Effort :** moyen ; demande P2 pour avoir des récompenses intéressantes.

### P8 — Deuxième couche : la Biorégion *(reprend §13.4)*

Une nouvelle ressource, l'**Eau** (récoltée par des toits-réservoirs, des noues, une rivière restaurée), qui
alimente une nouvelle rangée de générateurs à l'échelle de la région, puis un deuxième prestige plus rare au-dessus
des Saisons. C'est la plus grosse extension, à faire quand les Saisons sont riches.

- **Thème :** passer du quartier à la biorégion, comme le pitch le suggère (« la ville respire »).
- **Satisfaction :** une nouvelle couche relance la découverte pour les joueurs de long terme.
- **Effort :** élevé : nouvelle ressource, nouveaux écrans, nouvel équilibrage, migration de sauvegarde.

### Confort à glisser au fil de l'eau

Petits ajouts sans jalon dédié, à placer dans la PR la plus proche :

- **Temps avant achat** affiché sur les générateurs et améliorations hors de portée (« dans 2 min 10 »).
- **Prochain objectif** rappelé sous le compteur (la règle d'or du §2 rendue visible).
- **Raccourcis clavier** pour acheter (1 à 8 pour les générateurs, M pour Max), sans raccourci de clic pour ne pas encourager l'autoclic.
- **Courbe de la production** dans les Statistiques, Saison par Saison.
- **Version anglaise** (§14 Q1) : les textes sont déjà regroupés dans `src/i18n/fr.ts`.
- **Installation en application** (PWA) pour jouer hors connexion et retrouver le jeu sur l'écran d'accueil.

---

## 4. Jalons proposés

Chaque jalon reste livrable et jouable seul, comme M1 à M4.

| Jalon | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| **M5 — Le quartier se voit** *(en cours)* | Vue du dessus animée, équilibrage plus doux, temps avant achat et prochain objectif | Répond directement à la demande ; tout le reste s'appuie sur la carte |
| **M6 — Restaurer le quartier** | P1 Parcelles, P4 Projets du quartier (premiers 15), P6 Sons | Donne enfin des paliers visibles sur la carte de M5 |
| **M7 — La terre se souvient** | P2 Arbre des Saisons, P3 Coopératives | Donne des choix à chaque Saison et retire la répétition des débuts |
| **M8 — Le vivant revient** | P5 Herbier, P7 Saisons à défis, version anglaise | Contenu de fin de partie qui réutilise l'arbre, la carte et les parcelles |
| **M9 — La Biorégion** | P8 Eau, nouveaux générateurs, deuxième prestige | La grosse extension, une fois la boucle longue riche |

Aucun jalon n'ajoute de journal ni de texte narratif (décision d'Antoine du 2026-10-10, design doc §1) :
ce qui doit être raconté passe par la scène, les animations ou un événement en jeu.

Chaque jalon met à jour le design doc, rejoue le simulateur et, si l'état change, ajoute une migration de
sauvegarde (`STATE_VERSION`), comme pour M1 à M4.

---

## 5. Ce qu'on écarte ou repousse

- **Cycle jour / nuit avec production variable** (§13.3) : risque de punir le joueur qui revient la nuit, contraire
  au §1. On le garde comme **décor** de la vue du dessus (éclairage qui change), et les batteries deviennent un
  Projet du quartier (P4) au lieu d'une contrainte.
- **Revente de bâtiments** : peu utile tant qu'il n'y a ni défis ni contraintes de place.
- **Classements en ligne et sauvegarde dans le nuage** : demandent un serveur ; le jeu reste statique sur GitHub Pages.
- **Événements à date réelle** (fête du solstice) : intéressants plus tard, mais ils poussent à se connecter à heure
  fixe, ce que le §1 évite.

---

## 6. Décisions pour Antoine

En attendant ta réponse, la feuille de route applique le choix recommandé.

| # | Question | Choix recommandé |
|---|---|---|
| D1 | Après la vue du dessus, quoi d'abord : restaurer le quartier (M6) ou l'Arbre des Saisons (M7) ? | **Restaurer le quartier d'abord** : c'est ce qui rend la progression visible, ta priorité, et ça réutilise tout de suite la vue du dessus |
| D2 | Les parcelles restaurées restent-elles d'une Saison à l'autre ? | **Oui, elles restent** : le monde garde la trace de chaque Saison, et le joueur voit son quartier grandir sur plusieurs jours |
| D3 | L'automatisation (Coopératives) se gagne ou est disponible d'emblée ? | **Elle se gagne** (arbre ou Jalons), dès la 2ᵉ Saison pour les premiers bâtiments : c'est une récompense, et la 1ʳᵉ Saison garde ses décisions |
| D4 | Deuxième ressource de la Biorégion : Eau, Biodiversité ou Habitants ? | **L'Eau** : concrète, facile à montrer sur la carte (pluie, rivière), et la biodiversité reste le bonus qu'elle est déjà |
