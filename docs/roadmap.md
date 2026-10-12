# Heliotrope — Feuille de route

> Statut : v5.1 (2026-10-12), proposée à Antoine (« fais une roadmap pour améliorer les mécaniques existantes, en
> étendre certaines, les rendre plus agréables, mieux les synergiser ») et validée le même jour (« implémente la
> roadmap »), avec un ajout : des Jalons qui interagissent avec le jeu (P36, M37). La v1 (M5 à M12), la v2 (M13 à
> M18), la v3 (M19 à M24) et la v4 (M25 à M30) sont livrées ; cette version construit la suite, de M31 à M37.
> Ce document classe les mécaniques à ajouter. Il ne fixe aucun chiffre : `docs/game-design.md` reste la référence pour
> les mécaniques et l'équilibrage, et chaque mécanique retenue y sera décrite dans la PR qui l'implémente. Les valeurs
> données ici sont des ordres de grandeur à confirmer avec le simulateur (§8) et la partie complète (`wholeGame.ts`).

## Sommaire

1. [État des lieux](#1-état-des-lieux)
2. [Ce qui manque encore](#2-ce-qui-manque-encore)
3. [Améliorations proposées, par priorité](#3-améliorations-proposées-par-priorité)
4. [Jalons](#4-jalons)
5. [Ce qu'on écarte ou repousse](#5-ce-quon-écarte-ou-repousse)
6. [Décisions d'Antoine](#6-décisions-dantoine)
7. [Mécaniques déjà livrées (v1 à v4)](#7-mécaniques-déjà-livrées-v1-à-v4)

---

## 1. État des lieux

Ce que le jeu propose aujourd'hui (main au 2026-10-12, après les PR #61 à #66, sauvegarde version 31) :

| Système | Contenu | Où (design doc) |
|---|---|---|
| Clic et pollen | Héliotrope cliquable, 10 améliorations de clic, jauge de pollen et envolée (×1,5 pendant 10 s) | §5.2, §5.6 |
| Générateurs | 8 bâtiments, ×2 à 7 seuils, 3 formes à 50, 100 et 200 exemplaires avec deux voies chacune | §4, §5.1, §5.5 |
| Synergies | 18 entre bâtiments, 3 entre améliorations, 3 avec le clic | §5.3 |
| Le quartier | 8 parcelles à deux avenirs, trames, 16 projets par Saison, 8 quartiers voisins, décor, photo | §6.1 à §6.7 |
| Moments actifs | Papillon doré (3 effets, inchangé depuis le MVP), 7 visiteurs, coups de main en réserve | §9.2, §9.6, §9.11 |
| Le ciel | Cinq temps qui favorisent, prévision de trois temps, dès la 2ᵉ Saison | §9.10 |
| Petites boucles | Potager (4 cultures, 6 carrés, 6 variétés), verger (4 arbres, 2 ruches, miel), demandes des voisins | §9.7, §9.8, §9.11 |
| Grands chantiers et alliances | 4 ouvrages en étapes, 6 alliances sur 3 à 6 places, grande floraison | §6.6, §9.9 |
| Prestige | Saisons, Arbre et Canopée, Coopératives, Cycles de l'eau et delta, villes sœurs et atelier à niveaux | §7 |
| Le vivant et les succès | Herbier de 28 espèces, 151 Jalons à +1 % chacun | §9.3, §9.5 |
| Mesure | Simulateur de la 1ʳᵉ Saison au 2ᵉ essaimage, cibles vérifiées par des tests | §8 |

**Bilan.** Les quatre premières versions ont surtout **ajouté** : chaque jalon a posé un système neuf, relié à un ou
deux autres. Le jeu est riche ; ce qui se voit maintenant, ce sont les **coutures** entre ces systèmes et les
**gestes répétés** qu'ils demandent :

- **Les moments actifs vivent chacun de leur côté.** Papillon, envolée, visites, haricots et coups de main sont des
  effets en cours qui ne se répondent presque pas (seul le Papillon pendant une envolée dure plus longtemps). Rien ne
  récompense le joueur qui les fait coïncider. Le Papillon n'a pas changé depuis le MVP, et l'envolée, réduite à
  ×1,5 pendant 10 s pour tenir le §8, se sent peu.
- **Les petites boucles demandent beaucoup de clics.** Six carrés à récolter puis ressemer un par un, quatre arbres,
  deux ruches, trois demandes, seize projets à relancer à chaque Saison. Le geste plaît au début ; à la 20ᵉ Saison il
  devient une corvée. Et le **miel** ne sert qu'aux deux dernières étapes des chantiers.
- **M28 et M29 ont laissé des liens de côté.** Les voies et les alliances liées à un temps, le retour en images qui
  montre le temps passé, les demandes d'espèce et l'étape de chantier moins chère en récompense (§9.10, §9.11).
- **Les alliances arrivent trop tard.** Toutes demandent une ruche, un chantier, une ville sœur ou la Canopée : un
  joueur ne compose rien avant le 3ᵉ Cycle. Et aucune ne touche les systèmes de la v4 (voies, pollen, temps, demandes).
- **L'Herbier compte, mais ne fait rien.** Une espèce revenue ajoute de la biodiversité et se promène sur la carte.
  On ne peut ni la cliquer, ni la demander, et ses familles (pollinisateurs, oiseaux, gens de la rivière) ne forment
  aucun ensemble, alors que les alliances s'en servent déjà.
- **Le temps qu'il fait se subit.** La prévision montre trois temps, mais le joueur ne peut rien en faire de plus que
  d'attendre ; un seul bâtiment ou système par temps en profite.

---

## 2. Ce qui manque encore

| Ce qui rend un incrémental satisfaisant sur la durée | Référence | Heliotrope aujourd'hui |
|---|---|---|
| Des **combos** quand plusieurs bonus se rencontrent | Cookie Clicker (frénésie + clic), Idle Slayer | Effets en cours indépendants |
| Des boucles de soin qui **restent légères** : tout récolter, ressemer d'un geste | Stardew Valley (arroseur), Melvor Idle | Un clic par carré, par arbre, par projet |
| Des **ressources secondaires utiles** partout | Hay Day, Kittens Game | Miel et paniers réservés à quelques usages |
| Des **synergies à composer tôt** dans la partie | Antimatter Dimensions (défis), Realm Grinder | Alliances en fin de partie seulement |
| Un **bestiaire qui participe** au jeu | Cats & Soup, Ecosystem | Herbier qui compte, sans geste |
| Un **temps qu'on prépare**, pas seulement qu'on regarde | Kittens Game (saisons), Frostpunk (prévisions) | Prévision passive |

---

## 3. Améliorations proposées, par priorité

Cette fois, **pas de nouveau système** : chaque proposition étend, adoucit ou relie ce qui existe. Mêmes critères que
les versions précédentes : ce que l'amélioration apporte au **thème solarpunk** (réparer un monde, ensemble) et à la
**satisfaction du joueur**, et un effort relatif. Les règles d'Antoine valent pour toutes : chaque extension se lie à
l'existant par une **synergie** plutôt qu'un multiplicateur isolé, rien n'est raconté par du texte, on ne punit jamais
le joueur absent, et la carte reste ce qu'on regarde.

**Garde-fou d'équilibrage.** Les leçons de la v4 valent pour chaque jalon : le 2ᵉ Cycle (cible 35 min) se joue en
Saisons de 12 min et bascule de 3 à 2 Saisons au moindre bonus permanent de trop ; tout ce qui fait revenir le
Papillon ou les visites plus souvent double l'Eau par leurs Averses. Les bonus gardés restent donc **modestes**
(×1,1 à ×1,25), les fréquences du Papillon et des visites **ne bougent pas**, et chaque jalon rejoue le simulateur
de la 1ʳᵉ Saison, de la fin de partie et de la partie complète.

### P30 — Les moments forts qui s'enchaînent

Le clic, le Papillon, l'envolée et les visites deviennent une seule famille de moments qui se renforcent :

- **Le bouquet.** Quand plusieurs effets en cours se chevauchent (Floraison, Pollinisation, envolée, Averse d'été,
  Nuée, transhumance, lucioles, haricots, coups de main lancés), chaque effet au-delà du premier ajoute un petit bonus
  de production (de l'ordre de +10 % par effet, plafonné vers +50 %). La couronne de la fleur gagne un pétale doré
  par effet en cours : on voit d'un coup d'œil que le bouquet est beau. Le joueur a déjà de quoi le composer : les
  coups de main gardés en réserve (§9.11) se lancent au moment où le Papillon passe.
- **Une envolée qui se sent.** L'anneau d'or qui traverse la carte fait briller au passage chaque bâtiment qui
  a une voie (§5.5), et les bâtiments touchés gardent un reflet pendant l'effet. Attraper le Papillon ou accueillir
  un visiteur remplit la jauge de pollen d'un dixième : le joueur attentif enchaîne.
- **Le Papillon prend la couleur du temps.** Ses trois effets restent, mais leurs chances suivent le ciel (plus de
  Floraisons au grand soleil, plus de Récoltes par vent, plus de Pollinisations dans la brume), sans jamais en retirer
  un. Pas plus fréquent : c'est un choix de préparation, pas un bonus de plus.
- **Le premier clic de chaque Saison compte.** Les dix premières secondes d'une Saison, la fleur remplit la jauge
  deux fois plus vite : la relance commence par un geste et une envolée, plutôt que par une attente.

- **Thème :** la ville fête ensemble ses beaux moments.
- **Satisfaction :** un vrai plaisir actif, sans pénaliser l'absent : le bouquet ne fait que s'ajouter.
- **Effort :** faible à moyen : un compteur d'effets en cours, des chances pondérées, des animations sur l'existant.

### P31 — Le potager et le verger, moins de clics et plus de choix

Les petites boucles gardent leur geste, mais sans corvée, et le miel trouve sa place :

- **Tout récolter, ressemer pareil.** Un seul geste (sur la carte, un clic sur la fleur quand des carrés sont mûrs ;
  dans le panneau, un bouton) récolte tout ce qui est mûr, potager, arbres et miel, et ressème dans chaque carré la
  culture qu'il portait. Le joueur qui veut choisir garde le carré par carré.
- **La rotation.** Une culture semée après une culture différente pousse plus vite (de l'ordre de ×1,2) : la terre
  se repose. Alterner devient un plaisir de jardinier, pas une règle à apprendre, et sert déjà la grainothèque.
- **Chaque culture a son temps.** Le grand soleil fait pousser les tournesols, la chaleur les courges, la brume les
  haricots, l'averse tout le potager (comme aujourd'hui) : la prévision (§9.10) dit quoi semer.
- **Une cinquième culture, les fraises.** Ouvertes avec la première ruche, elles poussent en 10 min et remplissent la
  jauge de pollen d'un quart. Quatre variétés de plus, une par paire avec les cultures existantes, chacune liée à un
  système de la v4 (la jauge, les voies, le temps, les demandes) : la grainothèque passe de 6 à 10.
- **Le miel sert.** Un pot de miel lance une **envolée** à la demande ; les voisins demandent parfois du miel ; une
  ruche pleine fait butiner ses abeilles jusqu'au potager (la variété suivante plus probable). Les chantiers en
  gardent l'usage.
- **Les arbres qui vieillissent.** Un fruitier cueilli souvent grandit (10, 25, 50 cueillettes) : un panier de plus
  par cueillette et une couronne plus large sur la carte. Rien ne se perd si on l'oublie.

- **Thème :** un jardin partagé qui se cultive avec plaisir, au rythme des saisons et du ciel.
- **Satisfaction :** revenir et tout cueillir d'un geste ; des choix de semis qui comptent.
- **Effort :** moyen : surtout l'interface et une culture à dessiner ; une migration de sauvegarde (les dernières
  cultures, les fraises, l'âge des arbres).

### P32 — Les voies et le ciel

Ce que M28 a laissé de côté, et un temps qu'on prépare :

- **Les voies sous leur ciel.** Sous le temps qui favorise un bâtiment (§9.10), ses voies jouent un peu plus fort
  (de l'ordre de ×1,5 sur leur effet). Chaque temps profite ainsi à deux ou trois bâtiments et à leurs liens, et une
  voie peut se choisir en pensant au ciel.
- **Changer le prochain temps.** Une fois par Saison, le joueur échange le temps suivant avec l'un des deux d'après,
  d'un clic sur la prévision. Une règle de l'atelier (§7.6) peut ajouter un échange par Saison.
- **Quatre espèces du temps.** Après l'escargot sous l'averse : le lézard des murailles au grand soleil, le faucon
  crécerelle par vent, la salamandre dans la brume, la cigale par la chaleur. Comme l'escargot, elles enrichissent
  l'Herbier sans être exigées pour l'Herbier complet.
- **Le retour en images montre le ciel.** Le retour (M17) rejoue les temps passés hors ligne, et la prévision au
  retour dit ce qui vient.

- **Thème :** une ville qui vit avec son climat et l'anticipe.
- **Satisfaction :** la prévision devient une décision ; chaque temps a plusieurs gagnants.
- **Effort :** moyen : des règles simples, quatre espèces à dessiner sur les deux rendus.

### P33 — Des alliances dès le milieu de partie

Les alliances (§9.9) s'ouvrent plus tôt et relient enfin la v4 :

| Alliance | Ce qu'elle relie (seuils) | Effet (ordre de grandeur) |
|---|---|---|
| Le pollen des ruches | 1 ruche · 50 envolées | La jauge de pollen se remplit ×1,25 plus vite |
| Les jardins sous la pluie | 10 averses vécues · 3 variétés du potager | Les récoltes du potager donnent un panier de plus |
| Les formes du quartier | 6 voies qui jouent · 4 parcelles restaurées | +1 % de production par voie qui joue |
| L'entraide | 10 demandes servies · 1 quartier voisin lié | Une place de plus dans la réserve des coups de main |
| Les vélos dans le vent | 3 Coopératives · 5 temps vécus | Par vent, les Coopératives achètent aussi les synergies |
| Les nuées de la canopée | 10 Nuées accueillies · 10 Canopées urbaines | La Nuée dure ×1,5 |

- **Plus tôt.** Le panneau s'ouvre dès la 2ᵉ Saison, avec **deux places** ; la troisième vient avec la Biorégion,
  puis les places actuelles. Avec douze alliances pour huit places au plus, composer reste un choix.
- **Retirer.** Avant le premier Cycle, une alliance se retire une fois par Saison ; ensuite une fois par Cycle,
  comme aujourd'hui.
- **Sur la carte.** Les nouveaux fils dorés relient la cour au verger, aux quartiers voisins, aux vélos.

- **Thème :** chaque système nourrit les autres, comme un écosystème.
- **Satisfaction :** des décisions de composition dès la 2ᵉ Saison, sur des systèmes que le joueur pratique déjà.
- **Effort :** faible à moyen : la table existe, il s'agit de seuils, d'effets et de fils.

### P34 — L'Herbier et les voisins qui participent

Le vivant revenu devient un acteur, et les demandes s'élargissent :

- **Saluer une espèce.** Une espèce qui passe sur la carte se clique (ou Entrée) : un petit pas de jauge de pollen et
  un son, une fois par passage. La carte devient un endroit où l'on cherche.
- **Les familles de l'Herbier.** Les espèces se rangent en familles déjà visibles dans le jeu : **pollinisateurs**,
  **oiseaux**, **gens de la rivière**, **habitants de la nuit**, **espèces du temps**. Une famille complète donne un
  bonus lié à son monde (pollinisateurs : la jauge ; oiseaux : la Nuée ; rivière : l'Eau ; nuit : les lucioles ;
  temps : les voies sous leur ciel), et sa planche de l'Herbier se dore.
- **Les demandes oubliées (M29).** Un voisin demande à **voir une espèce** (la saluer sur la carte), un **pot de
  miel**, ou une **forme** de bâtiment ; deux récompenses de plus entrent dans la réserve : une **étape de chantier
  moins chère** et un **temps choisi** (P32).
- **Les liens qui se voient.** Un quartier voisin au lien plein envoie ses habitants en vélo-cargo jusqu'à la cour,
  et ses demandes offrent un coup de main de plus.

- **Thème :** une ville qui partage ses rues avec le vivant et ses voisins.
- **Satisfaction :** l'Herbier gagne des objectifs à moyen terme et un geste ; les demandes varient.
- **Effort :** moyen : un clic sur des espèces déjà dessinées, une table de familles, des lignes de plus aux demandes.

### P35 — Des Coopératives pour les petites boucles, et tout remesurer

Comme M30 pour la v4, la v5 se clôt par l'automatisation gagnée de ce qui devient répétitif, et la mesure :

- **Le conseil de quartier mène les projets.** Un talent de la Canopée (§7.1) lui confie les seize projets du
  quartier : il les relance à chaque Saison, du moins cher au plus cher, comme il achète déjà les améliorations.
- **Les jardiniers.** Une Coopérative de plus **ressème** les carrés récoltés (la culture d'avant, ou la rotation),
  mais **ne récolte jamais** : la cueillette reste le geste et la raison de revenir.
- **Les apiculteurs.** Avec les deux ruches, le miel trop plein part seul vers le chantier en cours.
- **Le simulateur joue la v5.** Le bouquet (le joueur de référence lance ses coups de main avec le Papillon), la
  rotation, les fraises, les alliances du milieu de partie et le temps choisi. Les cibles du §8 et de la partie
  complète tiennent à ±30 %, et le 2ᵉ Cycle garde sa marge.

- **Thème :** les voisins prennent le relais des tâches répétées.
- **Satisfaction :** la fin de partie garde les gestes qui plaisent et perd ceux qui lassent.
- **Effort :** moyen : deux Coopératives sur le modèle existant, surtout du simulateur.

### P36 — Des Jalons qui comptent

Ajout d'Antoine (2026-10-12 : « ajoute aussi des interactions avec les jalons et d'autres mécaniques du jeu pour
rendre leur complétion satisfaisante »). Aujourd'hui, un Jalon éclot en médaillon et ajoute +1 % : rien d'autre ne le
lit. P36 les fait entrer dans le jeu :

- **Un cadeau à l'éclosion.** Chaque Jalon atteint laisse un petit geste lié à sa famille, visible sur la carte
  (une bouffée de Lumière, un pas de jauge de pollen, une pousse du potager qui avance, une goutte d'Eau).
- **Les familles complètes.** Finir une famille dore son titre dans l'écran des Jalons et donne un bonus gardé, relié
  à son monde (la famille des clics à la jauge, celle du Papillon au bouquet, celle du quartier aux projets), et une
  couleur de fleur ou une pièce de décor (§6.5).
- **Voir le prochain.** L'écran des Jalons montre, pour chaque famille, le prochain Jalon et sa progression ; le
  prochain objectif (M10) peut en désigner un quand il est proche.
- **D'autres mécaniques les lisent.** Les voisins demandent parfois un Jalon proche (§9.11), des alliances et un
  talent comptent les familles complètes.

- **Thème :** chaque étape de la réparation de la ville se fête et sert.
- **Satisfaction :** atteindre un Jalon se sent tout de suite, et compléter une famille devient un objectif.
- **Effort :** moyen : une table de cadeaux par famille, l'écran des Jalons, quelques liens.

---

## 4. Jalons

Chaque jalon reste livrable et jouable seul. Ils se construisent dans l'ordre ; chacun met à jour le design doc,
rejoue le simulateur et la partie complète et, si l'état change, ajoute une migration de sauvegarde (`STATE_VERSION`).

| Jalon | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| M5 à M30 | *Livrés* (voir §7) | — |
| **M31 — Les moments qui s'enchaînent** *(livré)* | P30 : bouquet, envolée qui fait briller les voies, Papillon selon le temps, premier clic de Saison | Touche tous les joueurs dès la 1ʳᵉ Saison ; petit, et le bouquet sert de point d'accroche aux jalons suivants |
| **M32 — Le potager et le verger** *(livré)* | P31 : tout récolter et ressemer, rotation, cultures et temps, fraises et 4 variétés, miel utile, arbres qui vieillissent | Retire la corvée la plus visible ; les fraises et le miel nourrissent la jauge de M31 |
| **M33 — Les voies et le ciel** *(livré)* | P32 : voies sous leur ciel, temps échangé, quatre espèces du temps, ciel dans le retour en images | Les cultures de M32 suivent aussi le temps : la prévision devient une vraie décision |
| **M34 — Les alliances du milieu** | P33 : six alliances de plus, places dès la 2ᵉ Saison, fils sur la carte | Relie ce que M31 à M33 ont étendu ; a besoin des espèces et des temps vécus |
| **M35 — L'Herbier et les voisins** | P34 : saluer une espèce, familles et leurs bonus, demandes d'espèce, de miel et de forme, deux récompenses | Les familles comptent les espèces du temps de M33 ; les demandes s'appuient sur le miel de M32 |
| **M36 — Les boucles confiées, la partie remesurée** | P35 : projets menés par le conseil, jardiniers, apiculteurs, simulateur de la v5 | Clôt la v5 : automatise ce qui lasse et mesure tout ce que M31 à M35 ont ajouté |
| **M37 — Des Jalons qui comptent** | P36 : cadeaux à l'éclosion, familles complètes et leurs bonus, prochain Jalon visible, demandes et alliances qui les lisent | En dernier : compte aussi les Jalons ajoutés par M31 à M36 |

**Synergies (décision d'Antoine, 2026-10-10).** Chaque extension se lie à l'existant (les fraises à la jauge, le temps
aux voies, les familles aux alliances, le miel aux envolées) plutôt que d'ajouter un multiplicateur isolé.

**Récit par le jeu (décision d'Antoine, 2026-10-10).** Aucun jalon n'ajoute de journal ni de texte narratif : le
bouquet se voit aux pétales, les familles aux planches dorées, le temps échangé sur la prévision.

**Avec les fils en cours.** Le fil « Prise en main progressive » règle l'ordre d'apparition des mécaniques (une
nouveauté à la fois, §10.8) : ce que M31 à M37 ouvrent (fraises, alliances dès la 2ᵉ Saison) passe par sa file. Le fil « Audit et
corrections graphiques » corrige les dessins existants ; les dessins neufs (fraises, quatre espèces, pétales du
bouquet) partent de son état.

---

## 5. Ce qu'on écarte ou repousse

Repris des versions précédentes, toujours valables :

- **Cycle jour / nuit avec production variable** : décor seulement (§9.6).
- **Classements en ligne et sauvegarde dans le nuage** : demandent un serveur ; le jeu reste statique sur GitHub Pages.
- **Événements à date réelle, récompense de connexion quotidienne** : ils poussent à se connecter à heure fixe (§1).
- **Cultures qui fanent**, **autoclic gagné**, **revente de bâtiments**, **monétisation** : toujours non.
- **Placer soi-même les bâtiments sur la carte** : les trames et les voies donnent le plaisir du choix sans cela.
- **Un album ou un journal**, **un tutoriel écrit** : écartés par Antoine.
- **Une météo qui pénalise**, **une quatrième couche de prestige** : toujours non.

Nouveaux :

- **Un Papillon ou des visites plus fréquents** : leurs Averses doublent l'Eau et font basculer le 2ᵉ Cycle (leçon
  de M28). P30 change ce que donne le Papillon, jamais quand il vient.
- **Une récolte automatique** : les Coopératives ressèment et mènent les projets, mais la cueillette reste au joueur
  (P35), pour garder une raison douce de revenir.
- **De nouveaux bâtiments ou une neuvième voie** : la v5 relie l'existant ; un 9ᵉ bâtiment déplacerait toutes les
  cibles du §8.
- **Un combo qui punit** (bouquet qui se perd si l'on rate un effet) : le bouquet ne fait que s'ajouter.

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

Questions de la v4, livrée avec le choix recommandé (Antoine a validé la roadmap le 2026-10-12 sans trancher) :

| # | Question | Choix appliqué |
|---|---|---|
| D17 | Quoi d'abord : ranger l'interface (M25) ou du contenu neuf (M26) ? | M25 d'abord : chaque jalon suivant ajoute des panneaux |
| D18 | Les voies des bâtiments : choix définitif, ou modifiable ? | Modifiable à chaque Saison, pour essayer sans regret |
| D19 | Le temps qu'il fait : purement au hasard, ou le joueur peut-il l'influencer ? | Au hasard, avec trois temps de prévision ; une règle de l'atelier (M30) pourra en choisir un |
| D20 | Les récompenses des demandes : immédiates, ou en réserve ? | En réserve (coups de main), trois au plus, lancés quand le joueur veut |
| D21 | Le puits des Savoirs : approfondir l'atelier, ou une quatrième couche ? | Approfondir : atelier à niveaux et deux paysages de plus |

Questions de la v5, à trancher par Antoine. En attendant sa réponse, les jalons appliqueront le choix recommandé.

| # | Question | Choix recommandé (appliqué par défaut) |
|---|---|---|
| D22 | Quoi d'abord : les moments actifs (M31) ou le potager et le verger (M32) ? | **M31 d'abord** : touche tous les joueurs dès la 1ʳᵉ Saison, et les jalons suivants s'y branchent |
| D23 | Le bouquet : bonus de production, ou effets qui durent plus longtemps ? | **Bonus de production**, modeste et plafonné : plus lisible, et sans allonger les Averses qui doublent l'Eau |
| D24 | « Tout récolter » ressème-t-il tout seul, ou laisse-t-il les carrés vides ? | **Il ressème la même culture** ; le carré par carré reste pour choisir |
| D25 | Le temps : échanger le prochain temps, ou le choisir librement ? | **Échanger une fois par Saison** avec l'un des deux suivants : une décision, sans enlever la surprise |
| D26 | Les alliances : places plus tôt, ou plus de places au total ? | **Plus tôt** (deux dès la 2ᵉ Saison), huit au plus pour douze alliances : composer reste un choix |
| D27 | Les Coopératives des boucles récoltent-elles aussi ? | **Non** : elles ressèment et mènent les projets, la cueillette reste au joueur |

---

## 7. Mécaniques déjà livrées (v1 à v4)

La v1 (2026-10-10), la v2 et la v3 (2026-10-11) et la v4 (2026-10-12) proposaient vingt-neuf mécaniques, toutes livrées
entre M5 et M30 ;
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
| P24 | Une interface rangée par couches | M25 | §10.7 |
| P25 | Les bâtiments qui grandissent, deux voies par forme | M26 | §5.5 |
| P26 | Le pollen | M27 | §5.6 |
| P27 | Le temps qu'il fait | M28 | §9.10 |
| P28 | Les demandes des voisins | M29 | §9.11 |
| P29 | La partie complète mesurée, l'atelier à niveaux, forêt et marais | M30 | §7.6, §8 |
| — | Confort : temps avant achat, prochain objectif, raccourcis, courbes, PWA | M10 | §10.5 |
| — | Vue du dessus animée et équilibrage plus doux par les synergies | M5 | §5.3, §6, §8 |
