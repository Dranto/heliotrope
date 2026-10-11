# Heliotrope — Feuille de route

> Statut : v3.1 (2026-10-11), validée par Antoine, sauf l'album, remplacé par les alliances (P23). La v1 (M5 à M12) et la v2 (M13 à M18) sont livrées ;
> cette version propose la suite, de M19 à M24, à la demande d'Antoine (« établis un plan des nouvelles
> fonctionnalités à mettre dans une nouvelle roadmap »).
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
7. [Mécaniques déjà livrées (v1 et v2)](#7-mécaniques-déjà-livrées-v1-et-v2)

---

## 1. État des lieux

Ce que le jeu propose aujourd'hui (main au 2026-10-11, après les PR #40 à #46, sauvegarde version 20) :

| Système | Contenu | Où (design doc) |
|---|---|---|
| Clic et générateurs | Héliotrope cliquable et ses améliorations, 8 bâtiments, achat ×1 / ×10 / ×100 / Max, temps avant achat | §4, §5.2, §10.5 |
| Améliorations | ×2 par générateur, synergies entre bâtiments, avec le clic et entre améliorations, biodiversité | §5 |
| Le quartier | 8 parcelles à deux avenirs chacune, 16 projets par Saison, 8 quartiers voisins, décor à poser, mode photo | §6.1, §6.2, §6.4, §6.5 |
| Saisons | Graines qui mûrissent en 15 min, Arbre (17 talents) et Canopée à niveaux (~1 900 Graines), semoir, Coopératives, 4 Saisons à défi | §7 à §7.3 |
| Biorégion | Eau, 4 collecteurs, 5 sites, Cycle de l'eau, delta des Sources (5 bras, 26 Sources), éclusier, 3 Cycles à défi | §7.4, §7.5 |
| Le vivant | Herbier, Papillon doré, 7 visiteurs du quartier et de la ville, soir et nuit en décor | §9.2, §9.5, §9.6 |
| Potager | 6 carrés de la cour, 4 cultures à temps réel, Grainothèque de 6 variétés | §9.7 |
| Succès | 132 Jalons à +1 % chacun | §9.3 |
| Accueil et ambiance | Première minute guidée sans texte, retour hors ligne en images, rappels facultatifs, musique générative | §6.3, §9.1, §10.6 |
| Carte | Vue du dessus en PixiJS (SVG en secours), 4 vues du Balcon à la Biorégion, dessins retravaillés (PR #39, #46) | §6, §10.4 |

**Bilan.** Toutes les couches ont maintenant leurs choix et leur automatisation. Ce qui s'essouffle, c'est de
nouveau **le très long terme**, et cette fois aussi **la mesure** de ce long terme :

- **Personne ne mesure la fin de partie.** Le simulateur s'arrête aux Saisons qui suivent le premier Cycle ; il ne
  joue ni la Canopée, ni le delta, ni les Cycles suivants. La décision D9 (troisième couche) attendait justement cette
  mesure. Et la Saison conseillée arrive déjà à −28 % de sa cible (1 h 12 pour 1 h 40), au bord de la marge de ±30 %.
- **Les Sources redeviennent un bonus plat** une fois le delta ouvert (26 Sources, quelques Cycles) : le problème que
  la Canopée a réglé pour les Graines revient une couche plus haut.
- **Il n'y a pas de grand objectif qui relie tout.** Lumière, Eau, Graines, récoltes et espèces avancent chacune de
  leur côté ; rien sur la carte ne se construit lentement avec toutes à la fois.
- **Les choix du quartier ne se répondent pas.** Les deux avenirs d'une parcelle (M16) se valent et ne dépendent pas
  des voisines : le joueur façonne la carte sans qu'elle réagisse à l'ensemble.
- **Le potager plafonne vite.** Six carrés et six variétés : une fois la Grainothèque complète, la boucle de soin ne
  donne plus que des bonus ponctuels.
- **Les couches ne se parlent presque pas.** Les synergies relient des bâtiments, des améliorations et le clic, mais
  presque jamais le potager à l'Herbier, un quartier voisin à une visite, ou une couche de prestige à une autre.
- **Le jeu n'a pas de sommet.** Aucun moment ne fête la région entière restaurée.

---

## 2. Ce qui manque encore

| Ce qui rend un incrémental satisfaisant sur la durée | Référence | Heliotrope aujourd'hui |
|---|---|---|
| Chaque couche garde un **puits à dépenser** | Cookie Clicker, Antimatter Dimensions | Delta épuisé à 26 Sources |
| Une **troisième couche** qui change d'échelle et de règles | Antimatter Dimensions (Reality), Kittens Game | Deux couches (Saisons, Cycles) |
| Un **grand projet** de longue haleine qui consomme toutes les ressources | Kittens Game (merveilles), Factorio (fusée) | Aucun |
| Des **voisinages qui se répondent** : l'emplacement compte | Townscaper, Islanders | Chaque parcelle vaut seule |
| Une **boucle lente** qui s'étoffe avec le temps | Melvor Idle, Cats & Soup | Potager complet en quelques jours |
| Un **sommet** atteint, puis une partie libre | Universal Paperclips, A Dark Room | Pas de fin, pas de fête finale |
| Des **synergies entre systèmes** que le joueur compose | Melvor Idle (synergies d'invocation), Path of Exile (arbre de passifs) | Synergies fixes, surtout entre bâtiments |

---

## 3. Nouvelles mécaniques proposées, par priorité

Mêmes critères que la v1 et la v2 : ce que la mécanique apporte au **thème solarpunk** (réparer un monde, ensemble)
et à la **satisfaction du joueur**, et un effort relatif. Les règles d'Antoine valent pour toutes : chaque mécanique se
lie à l'existant par une **synergie** plutôt qu'un multiplicateur isolé, rien n'est raconté par du texte, et on ne
punit jamais le joueur absent.

### P18 — Mesurer la fin de partie, et le delta qui s'élargit

D'abord l'outil, puis le puits :

- **Le simulateur joue tout.** Il apprend la Canopée, le semoir, le delta, l'éclusier et les Coteaux, et enchaîne les
  Cycles (par exemple jusqu'au 5ᵉ). Le design doc §8 reçoit des cibles pour les Cycles 2 à 5 (durée d'un Cycle, d'une
  Saison tardive), vérifiées par un test comme les cibles de la 1ʳᵉ Saison. On en profite pour redonner de la marge à
  la Saison conseillée (−28 %), par la cible ou par une synergie de début plus douce, selon ce que le simulateur
  montre.
- **Les bras s'élargissent.** Une fois les cinq bras ouverts, chacun s'**élargit** par niveaux, au prix qui grandit,
  comme la Canopée : le bras des semences fait mûrir les Graines un peu plus vite (sans descendre sous 5 min), le bras
  de la mémoire garde un peu plus des collecteurs, celui des coteaux relève les Coteaux, celui des crues renforce les
  récompenses des Cycles à défi. Sur le dessin du delta, le bras s'élargit et sa mare grandit.

- **Thème :** la rivière creuse son lit à mesure qu'on la laisse vivre.
- **Satisfaction :** les Sources tardives gardent un usage, et les jalons suivants s'appuient sur des chiffres mesurés.
- **Effort :** moyen : surtout le simulateur ; les bras à niveaux reprennent le modèle de la Canopée.

### P19 — Les grands chantiers

Des ouvrages de toute la ville, **en plusieurs étapes**, gardés pour toujours (après une Saison comme après un
Cycle), qui se paient chacun avec **plusieurs ressources à la fois** : Lumière, Eau, récoltes du potager, et des
espèces présentes dans l'Herbier comme condition. Chaque étape se voit sur la carte, chantier puis ouvrage fini, et
donne une synergie qui relie deux systèmes. Quatre chantiers, par exemple :

| Chantier | Étapes (exemples) | Synergie à la fin |
|---|---|---|
| **Le tram solaire** | Rails, caténaires végétalisées, stations, premier tram | Les quartiers voisins (§6.4) se renforcent entre eux |
| **La rivière rouverte** | Dalle cassée, berges, passerelles, baignade | Eau ×, et les espèces de la rivière (§7.5) reviennent plus vite |
| **Les halles nourricières** | Charpente, étals, cuisine commune | Les récoltes du potager durent plus longtemps |
| **La tour des semences** | Fondations, étages de culture, grainothèque, belvédère | Graines ×, et la tour se voit de toutes les vues |

- **Rythme :** une étape coûte environ une Saison tardive d'efforts ; un chantier complet, plusieurs Cycles. On peut
  laisser une étape à moitié payée : ce qui est versé reste.
- **Thème :** les grands ouvrages communs, bâtis lentement et ensemble, sont le cœur du solarpunk.
- **Satisfaction :** un objectif lointain qui donne une raison d'être à chaque ressource, et la carte qui change
  d'échelle.
- **Effort :** moyen à élevé : données et écran simples, mais quatre ouvrages à dessiner en plusieurs états.

### P20 — Les trames verte et bleue

Les choix de M16 se répondent : quand des parcelles **voisines** sur la carte prennent des avenirs **de la même
famille** (vert : parc, prairie, verger ; bleu : jardins de pluie, mares, rivière), elles forment une **trame**. Une
trame se dessine sur la carte (une haie continue, un ruisseau qui relie les parcelles), attire une espèce qui ne
vient que par elle, et donne une petite synergie qui grandit avec sa longueur.

- **Règle :** les avenirs gardent leur valeur propre ; la trame ajoute un bonus modeste et une espèce, jamais une
  pénalité. Comme les avenirs (D7), on peut tout réarranger à chaque Cycle de l'eau.
- **Thème :** les corridors écologiques, une vraie notion d'urbanisme vivant.
- **Satisfaction :** l'emplacement compte enfin, un petit casse-tête sans erreur possible, lisible sur la carte.
- **Effort :** faible à moyen : une table de voisinage des parcelles, quelques dessins de liaison.

### P21 — Le verger et les ruches

Le potager s'étend sur les toits et sur une parcelle, avec une boucle **encore plus lente** :

- **Le verger.** Quelques arbres fruitiers plantés une fois, qui mettent plusieurs jours de temps réel à grandir
  (jeune plant, premières fleurs, premiers fruits), puis donnent une récolte à intervalle régulier. Comme les
  cultures, ils ne meurent jamais et grandissent hors ligne.
- **Les ruches.** Posées près des carrés, elles **pollinisent** les cultures voisines : pousse plus rapide, et une
  chance de variété plus grande. Leur miel est une récolte rare, qui sert aux grands chantiers (P19).
- **La Grainothèque s'agrandit** avec les fruitiers et leurs variétés anciennes (pomme reinette, poire curé…), une
  nouvelle planche de l'Herbier.

- **Thème :** planter des arbres pour plus tard, le geste de long terme par excellence.
- **Satisfaction :** des rendez-vous de plusieurs jours, et une raison de revenir qui grandit avec le joueur.
- **Effort :** moyen : un état par arbre et par ruche, des dessins à plusieurs stades sur SVG et PixiJS.

### P22 — Les villes sœurs (troisième couche)

La décision D9, à prendre avec les mesures de P18. Quand la Biorégion est restaurée, le joueur peut **essaimer** :
fonder une **ville sœur** ailleurs dans la région, ce qui relance les Saisons, la Biorégion et le Cycle, mais garde
l'Herbier, les Jalons, le décor, les grands chantiers et la carte des villes. La nouvelle monnaie, les **Savoirs**,
se gagne selon les Sources obtenues.

- **Un choix à chaque essaimage :** trois villes proposées, chacune avec son paysage et une règle propre (la ville
  du littoral : l'Eau compte double mais les Panneaux moins ; la ville de montagne : le Papillon et les visites plus
  fréquents ; la ville des plaines : les Coopératives plus rapides). Le paysage change les dessins de la carte, pas
  seulement un chiffre.
- **Le réseau :** les villes déjà fondées restent sur une carte de la région et échangent : chacune envoie un petit
  bonus lié à sa règle, et des boutures (§7.1) au démarrage de la suivante. Aucun serveur : tout est simulé dans la
  sauvegarde.
- **Les Savoirs** se dépensent dans un atelier qui **change des règles** (comme le delta) et automatise la couche du
  dessous : relancer la Biorégion, bâtir les sites tout seuls.

- **Thème :** le savoir-faire se partage de ville en ville, la réparation se propage.
- **Satisfaction :** un changement d'échelle et un renouveau visuel complet, avec des choix qui comptent.
- **Effort :** élevé : une couche entière, un nouvel écran, des variantes de carte. C'est le plus gros jalon.

### P23 — Les alliances et la grande floraison

- **Les alliances.** Une nouvelle famille de synergies, **entre systèmes** plutôt qu'entre bâtiments. Chaque alliance
  relie deux choses que le joueur a déjà fait grandir, souvent de deux couches différentes, et s'éveille quand les
  deux atteignent un seuil. Par exemple :

  | Alliance | Relie | Effet (ordre de grandeur) |
  |---|---|---|
  | Les abeilles du verger | Ruches (P21) et espèces pollinisatrices de l'Herbier | Le Papillon doré revient plus vite par espèce pollinisatrice |
  | Le marché du tram | Tram solaire (P19) et quartiers voisins (§6.4) | Chaque quartier voisin relève le clic |
  | La rivière nourricière | Trame bleue (P20) et Coteaux (§7.5) | L'Eau fait pousser le potager plus vite |
  | Les graines voyageuses | Villes sœurs (P22) et Grainothèque (§9.7) | Chaque variété trouvée relève les Savoirs |
  | La fête au village | Visites de la ville (§9.6) et halles nourricières (P19) | Une visite accueillie prolonge les récoltes en cours |
  | Les racines profondes | Canopée (§7.1) et bras du delta (P18) | Les niveaux de l'une rendent l'autre moins chère |

  Le joueur **choisit** quelles alliances sont actives : quelques places au début (par exemple 3), une de plus avec
  certains chantiers et chaque ville sœur. Composer ses alliances devient la décision de fin de partie, et on peut les
  changer à chaque Cycle de l'eau, comme les avenirs (D7). Sur la carte, chaque alliance active tend un **fil de
  lumière dorée** entre les deux lieux qu'elle relie, qui pulse quand l'effet joue.
- **La grande floraison.** Quand toute la région est restaurée (tous les sites, tous les chantiers, l'Herbier
  complet), une animation sans texte fait fleurir toute la carte, des quartiers aux collines, puis le jeu continue
  librement : rien ne se remet à zéro. Elle ouvre aussi la dernière place d'alliance.

- **Thème :** la ville tient par ses liens ; on voit le réseau de l'entraide se tisser sur la carte.
- **Satisfaction :** des choix de composition qui récompensent tout ce qui a été construit, et un sommet à viser.
- **Effort :** moyen : une table d'alliances, un écran de choix, des fils animés sur la carte (SVG et PixiJS) ;
  l'équilibrage passe par le simulateur de M19, chaque alliance restant modeste.

---

## 4. Jalons

Chaque jalon reste livrable et jouable seul. Ils se construisent dans l'ordre ; chacun met à jour le design doc,
rejoue le simulateur et, si l'état change, ajoute une migration de sauvegarde (`STATE_VERSION`).

| Jalon | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| M5 à M18 | *Livrés* : carte, parcelles, projets, Arbre, Coopératives, Herbier, défis, Biorégion, confort, visites, quartiers voisins, Canopée, potager, delta, avenirs et décor, accueil et musique, visites de la ville (voir §7) | — |
| **M19 — Mesurer la fin de partie** | P18 : le simulateur joue la Canopée, le delta et les Cycles 2 à 5, cibles du §8 étendues et testées, marge rendue à la Saison conseillée ; les bras du delta à niveaux | Tout le reste s'équilibre sur ces mesures, et la décision D9 les attend |
| **M20 — Les grands chantiers** | P19 : quatre chantiers en étapes payés avec Lumière, Eau, récoltes et espèces, leurs dessins sur la carte, leurs Jalons | Le grand objectif qui relie tous les systèmes existants, sans nouvelle couche |
| **M21 — Les trames verte et bleue** | P20 : voisinage des parcelles, trames dessinées, espèces des trames | Petit jalon qui donne du sens aux avenirs de M16 ; peut s'échanger avec M22 |
| **M22 — Le verger et les ruches** | P21 : arbres fruitiers sur plusieurs jours, ruches qui pollinisent, miel pour les chantiers, Grainothèque des fruitiers | Étoffe la boucle de soin pour tous les joueurs ; le miel nourrit M20 |
| **M23 — Les villes sœurs** | P22 : essaimage, trois paysages au choix, carte de la région, Savoirs et leur atelier | La plus grosse pièce, une fois la fin de partie mesurée (M19) et les grands objectifs en place (M20) |
| **M24 — Les alliances et la grande floraison** | P23 : synergies entre systèmes à choisir, leurs fils de lumière sur la carte, sommet de la région fêté sans texte | Clôt la v3 : les alliances relient tout ce que M19 à M23 ont construit, et le sommet n'a de sens qu'à la fin |

**Synergies (décision d'Antoine, 2026-10-10).** Comme avant, chaque mécanique se lie à l'existant (un chantier aux
quartiers voisins, une trame à l'Herbier, une ruche au potager, une ville sœur à une règle de la carte) plutôt que
d'ajouter un multiplicateur isolé.

**Récit par le jeu (décision d'Antoine, 2026-10-10).** Aucun jalon n'ajoute de journal ni de texte narratif : seuls
les noms et les effets sont écrits ; les chantiers, les trames, les villes sœurs et la grande floraison se racontent
par la carte et les animations.

**Dessins.** M20, M22, M23 et M24 demandent beaucoup d'illustrations : elles partent des dessins retravaillés par le
fil « Assets PixiJS de la carte » (PR #39, #46), dans les fichiers SVG partagés pour que les deux rendus suivent.

---

## 5. Ce qu'on écarte ou repousse

Repris des versions précédentes, toujours valables :

- **Cycle jour / nuit avec production variable** : décor seulement (§9.6), on ne punit pas le joueur qui joue la nuit.
- **Classements en ligne et sauvegarde dans le nuage** : demandent un serveur ; le jeu reste statique sur GitHub Pages.
  Les villes sœurs (P22) sont simulées dans la sauvegarde, sans échange entre joueurs.
- **Événements à date réelle, récompense de connexion quotidienne** : ils poussent à se connecter à heure fixe (§1).
- **Cultures qui fanent** : le potager attend ; le verger et les ruches (P21) non plus ne meurent jamais.
- **Autoclic gagné** : le clic reste le geste du joueur.
- **Revente de bâtiments**, **monétisation** : toujours non (§14 Q6).

Nouveaux :

- **Placer soi-même les bâtiments sur la carte** : trop lourd pour huit générateurs comptés par centaines ; les
  trames (P20) donnent le plaisir de l'emplacement à l'échelle des parcelles.
- **Une fin qui remet tout à zéro** : la grande floraison (P23) est un sommet, pas une fin de partie forcée.
- **Des nombres au-delà de 1e308** : à revoir seulement si le simulateur de M19 montre que les villes sœurs les
  atteignent (CLAUDE.md : bibliothèque de grands nombres seulement si nécessaire).

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

Questions de la v3 (Antoine a validé les jalons le 2026-10-11, sauf l'album). En attendant la réponse d'Antoine, les jalons appliqueront le choix recommandé.

| # | Question | Choix recommandé (appliqué par défaut) |
|---|---|---|
| D10 | Quoi d'abord : mesurer la fin de partie (M19) ou du contenu neuf (M20, chantiers) ? | **M19 d'abord** : c'est petit, et tout le reste s'équilibre dessus |
| D11 | Une troisième couche de prestige (les villes sœurs) ? | **Oui, en M23**, si le simulateur de M19 confirme que le joueur atteint le bout du delta ; sinon M23 se réduit au réseau sans relance |
| D12 | Les grands chantiers se paient-ils aussi en Graines ou en Sources ? | **Non** : Lumière, Eau, récoltes et espèces ; Graines et Sources restent à l'Arbre et au delta |
| D13 | La grande floraison termine-t-elle la partie ? | **Non** : un sommet fêté, puis le jeu continue librement, sans remise à zéro |
| D14 | Une ville sœur se choisit-elle parmi trois, ou est-elle imposée ? | **Au choix parmi trois**, chacune avec son paysage et sa règle |
| D15 | ~~L'album~~ | **Décidé (2026-10-11) :** pas d'album ; M24 propose les alliances à la place (P23) |
| D16 | Les alliances : toutes actives, ou un nombre de places à composer ? | **Des places à composer** (3 au début, plus avec chantiers, villes sœurs et floraison), changeables à chaque Cycle |

---

## 7. Mécaniques déjà livrées (v1 et v2)

La v1 (2026-10-10) et la v2 (2026-10-11) proposaient dix-sept mécaniques, toutes livrées entre M5 et M18 ; leur
détail est maintenant dans le design doc.

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
| — | Confort : temps avant achat, prochain objectif, raccourcis, courbes, PWA | M10 | §10.5 |
| — | Vue du dessus animée et équilibrage plus doux par les synergies | M5 | §5.3, §6, §8 |
