# Heliotrope — Feuille de route

> Statut : v4.0 (2026-10-12), proposée à Antoine (« fais-moi une nouvelle roadmap pour ajouter des fonctionnalités /
> peaufiner le jeu »), à valider. La v1 (M5 à M12), la v2 (M13 à M18) et la v3 (M19 à M24) sont livrées ; cette
> version propose la suite, de M25 à M30.
> Ce document classe les mécaniques à ajouter. Il ne fixe aucun chiffre : `docs/game-design.md` reste la référence pour
> les mécaniques et l'équilibrage, et chaque mécanique retenue y sera décrite dans la PR qui l'implémente. Les valeurs
> données ici sont des ordres de grandeur à confirmer avec le simulateur (§8).

## Sommaire

1. [État des lieux](#1-état-des-lieux)
2. [Ce qui manque encore](#2-ce-qui-manque-encore)
3. [Nouvelles mécaniques proposées, par priorité](#3-nouvelles-mécaniques-proposées-par-priorité)
4. [Jalons](#4-jalons)
5. [Ce qu'on écarte ou repousse](#5-ce-quon-écarte-ou-repousse)
6. [Décisions d'Antoine](#6-décisions-dantoine)
7. [Mécaniques déjà livrées (v1 à v3)](#7-mécaniques-déjà-livrées-v1-à-v3)

---

## 1. État des lieux

Ce que le jeu propose aujourd'hui (main au 2026-10-12, après les PR #49 à #59, sauvegarde version 25) :

| Système | Contenu | Où (design doc) |
|---|---|---|
| Clic et générateurs | Héliotrope cliquable et ses améliorations, 8 bâtiments, achat ×1 / ×10 / ×100 / Max, temps avant achat | §4, §5.2, §10.5 |
| Améliorations | ×2 par générateur à 7 seuils, synergies entre bâtiments, avec le clic et entre améliorations | §5 |
| Le quartier | 8 parcelles à deux avenirs, trames verte et bleue, 16 projets par Saison, 8 quartiers voisins, décor, photo | §6.1 à §6.5, §6.7 |
| Grands chantiers | 4 ouvrages en étapes payés en Lumière, Eau, paniers, miel et espèces | §6.6 |
| Saisons | Graines qui mûrissent, Arbre et Canopée, semoir, Coopératives, 4 Saisons à défi | §7 à §7.3 |
| Biorégion | Eau, collecteurs, sites, Cycle de l'eau, delta à bras élargissables, éclusier, 3 Cycles à défi | §7.4, §7.5 |
| Villes sœurs | 3ᵉ couche : essaimage parmi 3 paysages, Savoirs et leur atelier (4 règles), réseau | §7.6 |
| Le vivant | Herbier, Papillon doré, visites du quartier et de la ville, soir et nuit en décor | §9.2, §9.5, §9.6 |
| Potager et verger | 6 carrés, Grainothèque, 4 fruitiers sur deux jours, 2 ruches, miel | §9.7, §9.8 |
| Alliances | 6 synergies entre systèmes à composer sur des places, grande floraison | §9.9 |
| Succès | 140 Jalons à +1 % chacun | §9.3 |
| Accueil et ambiance | Première minute guidée sans texte, retour en images, rappels facultatifs, musique générative | §6.3, §9.1, §10.6 |

**Bilan.** La v2 et la v3 ont surtout nourri **la fin de partie** : Canopée, delta, chantiers, villes sœurs,
alliances. Le jeu a maintenant un sommet. Ce qui s'essouffle, cette fois, c'est **le milieu et le geste**, et **la
place que prend tout ce contenu** :

- **L'interface déborde.** Neuf panneaux dans le menu latéral (Améliorer, Le quartier, Potager, Verger, Grands
  chantiers, Alliances, Bâtir, Biorégion, Coopératives) et huit écrans. Un joueur à la 3ᵉ Saison voit apparaître trois
  panneaux d'un coup, sans repère pour savoir ce qui vient de s'ouvrir. Sur téléphone, le défilement est long.
- **Les bâtiments ne changent plus après le premier soir.** Les huit générateurs gagnent des ×2 à des seuils fixes :
  aucun choix, et leur dessin ne bouge plus une fois posés. C'est pourtant ce que le joueur regarde le plus.
- **Le clic s'arrête tôt.** Après la 1ʳᵉ Saison, cliquer ne compte presque plus ; le Papillon est le seul moment
  actif, et il est rare.
- **Le quartier vit, mais ne demande rien.** Les visites passent et donnent, les récoltes servent aux chantiers, mais
  personne ne demande jamais un panier, une espèce ou un coup de main : les petites boucles ne se répondent pas.
- **Rien ne varie d'une heure à l'autre.** Le jour et la nuit sont du décor (décision ancienne, gardée) ; aucun
  événement doux ne change l'intérêt d'un bâtiment plutôt que d'un autre pendant un moment.
- **Les Savoirs deviennent un bonus plat.** L'atelier n'a que 4 règles (31 Savoirs) : après deux ou trois villes
  sœurs, le problème des Graines (réglé par la Canopée) et des Sources (réglé par les élargissements) revient une
  troisième fois. Et le simulateur ne joue ni le potager, ni le verger, ni les chantiers, ni les alliances : la
  partie au-delà du 6ᵉ Cycle n'est pas mesurée.

---

## 2. Ce qui manque encore

| Ce qui rend un incrémental satisfaisant sur la durée | Référence | Heliotrope aujourd'hui |
|---|---|---|
| Une interface qui **s'ouvre au rythme du joueur** et dit sans mots ce qui est nouveau | Antimatter Dimensions, Melvor Idle | Panneaux empilés, rien de signalé |
| Des **bâtiments qui évoluent** et des **choix** sur chacun | AdVenture Capitalist (paliers), Idle Slayer, Bloons TD (voies) | ×2 automatiques, pas de choix |
| Un **clic qui reste un geste** tout au long de la partie | Cookie Clicker (frénésie), Clicker Heroes | Clic décisif seulement au début |
| Des **demandes** qui relient les petites boucles | Cats & Soup, Stardew Valley (lots), Hay Day (commandes) | Les ressources ne servent qu'aux chantiers |
| Un **temps qu'il fait** qui change l'intérêt des choix, sans punir | Kittens Game (saisons), Townscaper (ambiance) | Jour et nuit en décor seulement |
| Chaque couche garde un **puits** et la partie entière est **mesurée** | Antimatter Dimensions, Kittens Game | Atelier des Savoirs épuisé, fin non mesurée |

---

## 3. Nouvelles mécaniques proposées, par priorité

Mêmes critères que les versions précédentes : ce que la mécanique apporte au **thème solarpunk** (réparer un monde,
ensemble) et à la **satisfaction du joueur**, et un effort relatif. Les règles d'Antoine valent pour toutes : chaque
mécanique se lie à l'existant par une **synergie** plutôt qu'un multiplicateur isolé, rien n'est raconté par du texte,
on ne punit jamais le joueur absent, et la carte reste ce qu'on regarde. Cette fois, la priorité va aux **premières
heures et au milieu de partie**, que tous les joueurs traversent.

### P24 — Une interface rangée, qui s'ouvre au rythme du joueur

Du peaufinage avant tout nouveau contenu, puisque chaque jalon suivant ajoute encore des panneaux :

- **Le menu par couches.** Les panneaux se rangent sous trois onglets à icône, dans l'ordre où le joueur les découvre :
  **La ville** (Améliorer, Bâtir, Le quartier, Coopératives), **Le vivant** (Potager, Verger, Alliances) et **La
  région** (Biorégion, Grands chantiers). Un onglet n'apparaît qu'avec son premier panneau. Sur grand écran, les deux
  colonnes de §10.1 restent ; sur téléphone, un onglet à la fois, et le menu défile moins.
- **Ce qui vient de s'ouvrir se voit.** Un système qui s'ouvre fait briller son onglet et son panneau d'une pastille
  dorée, et le **halo du guide** (M17) désigne une fois son premier geste utile (planter, verser, choisir), sans
  texte. Ce qui devient achetable dans un panneau replié se signale par un point sur son titre.
- **Les écrans en un seul endroit.** Saisons, Arbre, Cycles, villes sœurs, Herbier, Jalons et statistiques se
  rangent dans une barre d'icônes cohérente, chacune avec sa jauge (Graines mûres, Sources prêtes) pour savoir d'un
  coup d'œil qu'une relance vaut la peine.
- **Tenir sur un vrai téléphone.** Un budget mesuré dans un test : temps de chargement (découpage du code par écran),
  temps d'une image de la carte PixiJS sur un appareil modeste, carte arrêtée quand l'onglet est caché. Les cibles
  tactiles de la carte (arbres, papillon, visites) passent à 44 px au moins.
- **Les sons des systèmes récents.** Verser à un chantier, cueillir, poser une ruche, éveiller une alliance n'ont pas
  encore leur son discret (§6.3).

- **Thème :** un jardin bien tenu, où chaque outil a sa place.
- **Satisfaction :** le joueur sait toujours où regarder ; la richesse des v2 et v3 devient lisible.
- **Effort :** moyen, surtout de l'interface ; aucune migration de sauvegarde.

### P25 — Les bâtiments qui grandissent

Chacun des huit générateurs **évolue** à trois paliers de possession (par exemple 50, 100 et 200) : son dessin change
sur la carte (le Panneau de balcon devient pergola solaire puis treille photovoltaïque ; la Serre s'agrandit en serre
à étages puis en jardin d'hiver), et le joueur **choisit une voie** parmi deux à chaque palier. Les deux voies se
valent ; elles orientent vers des synergies différentes, par exemple :

| Bâtiment, palier | Voie A | Voie B |
|---|---|---|
| Panneau de balcon, 50 | Chaque Panneau ajoute un peu de Lumière au clic | Les Panneaux nourrissent la Serre (synergie plus forte) |
| Potager sur le toit, 100 | Les récoltes du potager de la cour poussent plus vite | Le Potager produit davantage par parcelle restaurée |
| Centrale à miroirs, 100 | Le Papillon doré dure plus longtemps | La Centrale renforce les collecteurs d'Eau |
| Arcologie vivante, 200 | Chaque espèce de l'Herbier relève l'Arcologie | Les Coopératives achètent plus vite |

- **Choix modifiable** à chaque nouvelle Saison (le palier se regagne vite), pour essayer sans regret.
- Les ×2 de §5.1 restent ; les voies s'ajoutent aux synergies de §5.3 et le simulateur choisit une voie de référence.
- **Thème :** la ville se densifie en vert, chaque bâtiment trouve sa forme.
- **Satisfaction :** des décisions dès la 1ʳᵉ Saison, et la carte qui change sous les yeux à chaque palier.
- **Effort :** moyen à élevé : 24 paliers à dessiner en SVG (repris par PixiJS), une table de voies, des tests.

### P26 — Le pollen

Le clic redevient un geste tout au long de la partie. Cliquer la fleur remplit une **jauge de pollen** autour de la
couronne ; pleine, elle déclenche une **envolée** : une vague de pollen doré part de la cour et traverse la carte, et
chaque bâtiment qu'elle touche produit davantage pendant quelques secondes (de l'ordre de ×2 pendant 20 s). La jauge
redescend doucement quand on ne clique plus, sans jamais rien retirer d'autre.

- **Synergies :** les améliorations de clic remplissent la jauge plus vite ; une envolée pollinise le potager (une
  pousse avance) ; le Papillon attrapé pendant une envolée dure plus longtemps ; une voie de P25 et un talent de
  l'Arbre peuvent s'y brancher.
- **Équilibrage :** de l'ordre de 2 à 3 envolées par minute de clic soutenu ; le simulateur garde les rythmes du §8
  au joueur qui clique 2,5 fois par seconde, et le joueur qui ne clique pas ne perd rien de ce qu'il a aujourd'hui.
- **Thème :** la fleur pollinise la ville.
- **Satisfaction :** une raison de cliquer en fin de partie, avec un retour visuel fort sur toute la carte.
- **Effort :** faible à moyen : une jauge, un effet minuté (sur le modèle de `effects.ts`), une animation.

### P27 — Le temps qu'il fait

Le ciel du quartier change toutes les 15 à 30 minutes environ : **grand soleil, averse, vent, brume, chaleur**.
Chaque temps **favorise** une famille de bâtiments et de systèmes, jamais une pénalité :

| Temps | Sur la carte | Favorise |
|---|---|---|
| Grand soleil | Ombres nettes, reflets sur les panneaux | Panneaux et Centrale à miroirs |
| Averse | Pluie, flaques, parapluies des passants | Eau récoltée, le potager et le verger poussent plus vite |
| Vent | Arbres qui ploient, éoliennes de balcon qui tournent | Coopératives et vélos-cargos plus rapides, le Papillon revient plus tôt |
| Brume | Halo doux, lumières allumées | Les espèces de l'Herbier se montrent davantage, les visites aussi |
| Chaleur | Air qui tremble, ombres recherchées | Les arbres des parcelles et la Canopée urbaine produisent plus |

- **Prévision sans texte :** les trois prochains temps en icônes à côté du sélecteur de vue, pour préparer un achat
  ou une récolte. Les voies de P25 et certaines alliances se lient à un temps (une voie qui gagne double sous la pluie).
- **Hors ligne :** le temps continue, et le retour en images (M17) montre ce qu'il a fait. Le hasard vient de la graine
  de la sauvegarde, comme le Papillon.
- Un **Jalon** par temps vécu, et des espèces qui ne reviennent que par un temps (l'escargot sous l'averse).
- **Thème :** une ville qui vit avec son climat plutôt que contre lui.
- **Satisfaction :** de la variété d'une heure à l'autre, et une carte encore plus vivante.
- **Effort :** moyen : les effets sont simples, les dessins demandent du soin sur les deux rendus.

### P28 — Les demandes des voisins

Les habitants qui passent sur la carte portent parfois une **bulle à icônes** : ce qu'ils demandent (3 radis et un
pot de miel, 2 cueillettes de poires, 25 Serres, une espèce de l'Herbier, une envolée de pollen), et ce qu'ils
offrent. Trois demandes au plus à la fois ; une demande **attend** sans limite de temps, et le joueur peut en refuser
une pour en voir une autre.

- **Les récompenses** sont des **coups de main** gardés en réserve et lancés quand le joueur veut : une heure de
  production immédiate, une Floraison du Papillon, une pousse qui mûrit d'un coup, une étape de chantier un peu moins
  chère. Le joueur compose ainsi ses propres moments forts.
- **Les quartiers voisins** (§6.4) envoient leurs habitants une fois restaurés, avec des demandes à leur image ; les
  servir souvent fait grandir le lien avec ce quartier (un petit bonus gardé).
- **Thème :** l'entraide de voisinage, le cœur de la ville réparée.
- **Satisfaction :** les petites boucles (potager, verger, Herbier, pollen) se répondent ; une raison de revenir qui
  n'oblige à rien.
- **Effort :** moyen : une table de demandes, une bulle sur les passants existants, un panneau de coups de main.

### P29 — Mesurer toute la partie, et le puits des Savoirs

Comme M19 pour la v3, la v4 se clôt par la mesure et un puits pour la couche la plus haute :

- **Le simulateur joue tout** : potager, verger, grands chantiers, alliances, voies, pollen, temps, et deux villes
  sœurs, avec un joueur de référence qui revient toutes les quelques heures pour récolter. Le §8 reçoit des cibles
  pour la 1ʳᵉ ville sœur et la grande floraison (par exemple une trentaine d'heures de jeu), vérifiées par un test.
- **L'atelier s'approfondit.** Ses règles gagnent des **niveaux** au prix qui grandit, comme la Canopée et les bras du
  delta, et deux règles s'ajoutent (par exemple : les quartiers voisins restent restaurés en essaimant ; une place
  d'alliance de plus).
- **Deux paysages de plus** pour les villes sœurs, la **forêt** (les arbres des parcelles comptent double, le verger
  pousse plus vite) et le **marais** (les espèces reviennent plus vite, l'Eau aussi), dessinés comme les trois autres.

- **Thème :** chaque ville apprend des précédentes.
- **Satisfaction :** les Savoirs gardent un usage, et l'équilibre de tout le contenu v3 et v4 est vérifié.
- **Effort :** moyen : surtout le simulateur ; l'atelier à niveaux reprend un modèle connu.

---

## 4. Jalons

Chaque jalon reste livrable et jouable seul. Ils se construisent dans l'ordre ; chacun met à jour le design doc,
rejoue le simulateur et, si l'état change, ajoute une migration de sauvegarde (`STATE_VERSION`).

| Jalon | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| M5 à M24 | *Livrés* (voir §7) | — |
| **M25 — Une interface rangée** *(livré)* | P24 : menu par couches, pastilles et halo pour ce qui s'ouvre, barre des écrans avec jauges, budget mobile mesuré, sons manquants | Chaque jalon suivant ajoute des panneaux : on range d'abord |
| **M26 — Les bâtiments qui grandissent** *(livré)* | P25 : trois paliers par bâtiment, deux voies au choix, nouveaux dessins | Profite à tous les joueurs dès la 1ʳᵉ Saison ; les voies servent ensuite de points d'accroche à M27-M29 |
| **M27 — Le pollen** *(livré)* | P26 : jauge de clic, envolée sur la carte, ses synergies | Petit jalon, rend le clic vivant ; se branche sur les voies de M26 |
| **M28 — Le temps qu'il fait** *(livré)* | P27 : cinq temps, prévision en icônes, dessins des deux rendus, espèces et Jalons du temps | Donne du rythme d'heure en heure ; ses liens avec les voies et le pollen supposent M26-M27 |
| **M29 — Les demandes des voisins** | P28 : bulles à icônes, coups de main en réserve, lien avec les quartiers voisins | Relie toutes les petites boucles, y compris le pollen et le temps |
| **M30 — Mesurer toute la partie** | P29 : simulateur complet, cibles des villes sœurs, atelier à niveaux, forêt et marais | Clôt la v4 : mesure tout ce que la v3 et la v4 ont ajouté |

**Synergies (décision d'Antoine, 2026-10-10).** Chaque mécanique se lie à l'existant (une voie au potager, une
envolée au Papillon, un temps aux espèces, une demande au verger) plutôt que d'ajouter un multiplicateur isolé.

**Récit par le jeu (décision d'Antoine, 2026-10-10).** Aucun jalon n'ajoute de journal ni de texte narratif : les
demandes sont des icônes, le temps se voit sur la carte, les voies se lisent par leur nom et leur effet.

**Dessins.** M26 et M28 demandent beaucoup d'illustrations (24 paliers de bâtiments, cinq temps) : elles partent des
dessins du fil « Assets PixiJS de la carte », dans les fichiers partagés pour que les deux rendus suivent.

---

## 5. Ce qu'on écarte ou repousse

Repris des versions précédentes, toujours valables :

- **Cycle jour / nuit avec production variable** : décor seulement (§9.6). Le temps qu'il fait (P27) ne fait que
  favoriser, jamais retirer, et ne suit pas l'heure réelle.
- **Classements en ligne et sauvegarde dans le nuage** : demandent un serveur ; le jeu reste statique sur GitHub Pages.
- **Événements à date réelle, récompense de connexion quotidienne** : ils poussent à se connecter à heure fixe (§1).
  Les demandes des voisins (P28) attendent sans limite de temps pour la même raison.
- **Cultures qui fanent**, **autoclic gagné**, **revente de bâtiments**, **monétisation** : toujours non.
- **Placer soi-même les bâtiments sur la carte** : les trames et les voies donnent le plaisir du choix sans cela.
- **Un album ou un journal** : écartés par Antoine (2026-10-10 et 2026-10-11).

Nouveaux :

- **Une quatrième couche de prestige** : la v4 approfondit la troisième (P29) plutôt que d'en empiler une autre.
- **Un tutoriel écrit** : les nouveautés se signalent par des pastilles et le halo (P24), jamais par des bulles de texte.
- **Une météo qui pénalise** (gel, canicule qui abîme) : contraire à la règle de ne jamais punir.

---

## 6. Décisions d'Antoine

Décisions de la v1, validées le 2026-10-10 :

| # | Question | Décision |
|---|---|---|
| D1 | Après la vue du dessus, quoi d'abord ? | Restaurer le quartier d'abord (M6 avant M7) |
| D2 | Les parcelles restaurées restent-elles d'une Saison à l'autre ? | Oui, elles restent |
| D3 | L'automatisation se gagne ou est disponible d'emblée ? | Elle se gagne, dès la 2ᵉ Saison |
| D4 | Deuxième ressource de la Biorégion ? | L'Eau |

Questions de la v2, livrée avec le choix recommandé (Antoine n'y a pas répondu) :

| # | Question | Choix appliqué |
|---|---|---|
| D5 | Quoi d'abord : la fin de partie (M13) ou une boucle neuve pour tous (M14) ? | M13 d'abord |
| D6 | Relance automatique de la Saison (le semoir) et du Cycle (l'éclusier) ? | Oui, gagnée, éteinte par défaut et réglable |
| D7 | Les deux avenirs d'une parcelle : choix définitif ou modifiable ? | Modifiable à chaque Cycle de l'eau |
| D8 | Notifications de la PWA ? | Facultatives, désactivées par défaut |
| D9 | Troisième couche de prestige ? | Plus tard : reprise en v3 par D11 |

Questions de la v3 (jalons validés le 2026-10-11, sauf l'album), livrée avec le choix recommandé :

| # | Question | Choix appliqué |
|---|---|---|
| D10 | Quoi d'abord : mesurer la fin de partie (M19) ou du contenu neuf ? | M19 d'abord |
| D11 | Une troisième couche de prestige (les villes sœurs) ? | Oui, en M23 |
| D12 | Les grands chantiers se paient-ils aussi en Graines ou en Sources ? | Non |
| D13 | La grande floraison termine-t-elle la partie ? | Non : rien ne recommence |
| D14 | Une ville sœur se choisit-elle parmi trois, ou est-elle imposée ? | Au choix parmi trois |
| D15 | L'album ? | Pas d'album (2026-10-11) ; les alliances à la place |
| D16 | Les alliances : toutes actives, ou des places à composer ? | Des places (3 au début), changeables à chaque Cycle |

Questions de la v4, à trancher par Antoine. En attendant sa réponse, les jalons appliqueront le choix recommandé.

| # | Question | Choix recommandé (appliqué par défaut) |
|---|---|---|
| D17 | Quoi d'abord : ranger l'interface (M25) ou du contenu neuf (M26) ? | **M25 d'abord** : chaque jalon suivant ajoute des panneaux |
| D18 | Les voies des bâtiments : choix définitif, ou modifiable ? | **Modifiable à chaque Saison**, pour essayer sans regret |
| D19 | Le temps qu'il fait : purement au hasard, ou le joueur peut-il l'influencer ? | **Au hasard, avec trois temps de prévision** ; une règle de l'atelier (M30) pourra en choisir un |
| D20 | Les récompenses des demandes : immédiates, ou en réserve ? | **En réserve** (coups de main), trois au plus, lancés quand le joueur veut |
| D21 | Le puits des Savoirs : approfondir l'atelier, ou une quatrième couche ? | **Approfondir** : atelier à niveaux et deux paysages de plus |

---

## 7. Mécaniques déjà livrées (v1 à v3)

La v1 (2026-10-10), la v2 et la v3 (2026-10-11) proposaient vingt-trois mécaniques, toutes livrées entre M5 et M24 ;
leur détail est maintenant dans le design doc.

| # | Mécanique | Jalon | Design doc |
|---|---|---|---|
| P1 | Parcelles du quartier à restaurer, gardées pour toujours | M6 | §6.1 |
| P2 | Arbre des Saisons | M7 | §7.1 |
| P3 | Coopératives (automatisation gagnée) | M7 | §7.2 |
| P4 | Projets du quartier | M6 | §6.2 |
| P5 | Herbier | M8 | §9.5 |
| P6 | Sons discrets | M6 | §6.3 |
| P7 | Saisons à défi | M8 | §7.3 |
| P8 | La Biorégion, l'Eau et le Cycle de l'eau | M9 | §7.4 |
| P9 | Les visites sur la carte, soir et nuit en décor | M11 | §9.6 |
| P10 | Les quartiers voisins | M12 | §6.4 |
| P11 | La Canopée, le semoir, les fontainiers | M13 | §7.1 |
| P12 | Le potager de la cour et la Grainothèque | M14 | §9.7 |
| P13 | Le delta des Sources, les Coteaux, l'éclusier, les Cycles à défi | M15 | §7.5 |
| P14 | Deux avenirs par parcelle, le décor, le mode photo | M16 | §6.5 |
| P15 | Première minute guidée, retour en images, rappels facultatifs | M17 | §9.1, §10.6 |
| P16 | La musique du quartier | M17 | §6.3 |
| P17 | Les visites de la ville | M18 | §9.6 |
| P18 | Le simulateur de fin de partie, les bras du delta à niveaux | M19 | §7.5, §8 |
| P19 | Les grands chantiers | M20 | §6.6 |
| P20 | Les trames verte et bleue | M21 | §6.7 |
| P21 | Le verger et les ruches | M22 | §9.8 |
| P22 | Les villes sœurs et les Savoirs | M23 | §7.6 |
| P23 | Les alliances et la grande floraison | M24 | §9.9 |
| — | Confort : temps avant achat, prochain objectif, raccourcis, courbes, PWA | M10 | §10.5 |
| — | Vue du dessus animée et équilibrage plus doux par les synergies | M5 | §5.3, §6, §8 |
