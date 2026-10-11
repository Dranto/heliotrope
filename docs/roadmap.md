# Heliotrope — Feuille de route

> Statut : v2.0 (2026-10-11). La v1 (M5 à M12) est entièrement livrée ; cette version propose la suite, de M13 à M18,
> à la demande d'Antoine (« établis un plan des nouvelles fonctionnalités et une nouvelle roadmap »).
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
7. [Mécaniques de la v1 (livrées)](#7-mécaniques-de-la-v1-livrées)

---

## 1. État des lieux

Ce que le jeu propose aujourd'hui (main au 2026-10-11, après les PR #32 à #36) :

| Système | Contenu | Où (design doc) |
|---|---|---|
| Clic et générateurs | Héliotrope cliquable et ses améliorations, 8 bâtiments, achat ×1 / ×10 / ×100 / Max, temps avant achat | §4, §5.2, §10.5 |
| Améliorations | ×2 par générateur, synergies entre bâtiments, avec le clic et entre améliorations, biodiversité | §5 |
| Le quartier | 8 parcelles à restaurer pour toujours, 16 projets par Saison, 8 quartiers voisins | §6.1, §6.2, §6.4 |
| Saisons | Graines qui mûrissent en 15 min, Arbre des Saisons (17 talents, 44 Graines), Coopératives, 4 Saisons à défi | §7 à §7.3 |
| Biorégion | Eau, 4 collecteurs, 4 sites, 2ᵉ prestige « Cycle de l'eau » (Sources, bonus plat) | §7.4 |
| Le vivant | Herbier (19 espèces), Papillon doré, visites (boutures, averse, migrateurs), soir et nuit en décor | §9.2, §9.5, §9.6 |
| Succès | 116 Jalons à +1 % chacun | §9.3 |
| Carte | Vue du dessus en PixiJS (SVG en secours), 4 vues du Balcon à la Biorégion, ville qui s'agrandit | §6, §10.4 |
| Confort | Hors ligne plafonné à 8 h (24 h avec l'Arbre), PWA, raccourcis, courbes de production, anglais, sons | §9, §10 |

En parallèle, le fil « Assets PixiJS de la carte » retravaille les dessins de la carte ; cette feuille de route ne le
reprend pas, mais plusieurs jalons s'appuient dessus.

**Bilan.** Les trois boucles existent et la carte raconte enfin le progrès. Ce qui s'essouffle maintenant, c'est
**le très long terme**, là où se trouve le joueur qui a tout débloqué :

- **Les Graines n'ont plus d'usage** une fois l'Arbre complet (44 Graines), alors que les Saisons tardives en
  rapportent des centaines. Chaque Saison redevient un bonus plat, le problème que M7 avait réglé.
- **Les Sources sont un bonus plat**, sans aucun choix : le Cycle de l'eau répète l'erreur des premières Saisons.
- **Chaque Saison se relance à la main**, et chaque Cycle refait la Biorégion à la main, alors que les Saisons
  tardives durent désormais au moins 15 minutes (PR #35) : la répétition revient par le haut.
- **Le joueur ne façonne pas son quartier** : chaque parcelle n'a qu'un avenir possible, deux joueurs voient la même
  ville.
- **Entre deux visites, rien ne pousse à son rythme** : tout suit la Lumière. Il manque une boucle de soin, lente et
  douce, qui récompense le retour sans punir l'absence.

---

## 2. Ce qui manque encore

| Ce qui rend un incrémental satisfaisant sur la durée | Référence | Heliotrope aujourd'hui |
|---|---|---|
| Le prestige garde un **puits à dépenser** à chaque palier | Cookie Clicker (améliorations célestes), Realm Grinder | Arbre épuisé à 44 Graines |
| Chaque couche de prestige donne des **choix**, pas seulement un bonus | Antimatter Dimensions (Eternity, Time Studies) | Sources : bonus plat |
| L'**automatisation monte avec les couches** : on automatise le prestige du dessous | Antimatter Dimensions, Trimps | Coopératives des bâtiments seulement |
| Une **boucle lente à temps réel**, qui pousse même hors ligne | Melvor Idle (cultures), Cats & Soup | Aucune |
| Le joueur **façonne** son monde et le reconnaît | Egg, Inc. (ferme), Townscaper | Un seul avenir par parcelle |
| Une **musique** qui évolue avec la progression | A Dark Room, Cats & Soup | Sons ponctuels, oiseaux |
| Un **accueil** qui montre quoi faire sans mur de texte | Universal Paperclips (révélation progressive) | Le panneau se dévoile, sans repère pour la 1ʳᵉ minute |

---

## 3. Nouvelles mécaniques proposées, par priorité

Mêmes critères que la v1 : ce que la mécanique apporte au **thème solarpunk** (réparer un monde, ensemble) et à la
**satisfaction du joueur**, et un effort relatif. Les règles d'Antoine valent pour toutes : chaque mécanique se lie à
l'existant par une **synergie** plutôt qu'un multiplicateur isolé, rien n'est raconté par du texte, et on ne punit
jamais le joueur absent.

### P11 — L'Arbre s'étend : la Canopée

Au-dessus de la ramure, une quatrième partie de l'Arbre des Saisons, la **Canopée**, s'ouvre une fois les 17 talents
appris. Ce sont des talents **à niveaux**, au prix qui grandit (par exemple ×1,5 par niveau), pour que les Graines
des Saisons tardives aient toujours un usage :

- **Rameaux** (un par branche) : synergies entre bâtiments +5 % par niveau, Papillon +3 % plus fréquent par niveau,
  Coopératives qui gardent une réserve plus fine ;
- **Le semoir** : relance la Saison **automatiquement** dès que les Graines ont mûri et atteint le palier que le joueur
  choisit (×2 par défaut, réglable, éteint par défaut) ; c'est l'automatisation de la couche du dessous, comme dans
  Antimatter Dimensions ;
- **Les fontainiers** : une Coopérative qui bâtit les collecteurs d'eau (§7.4) ;
- **Pépinière** : les Boutures (§7.1) gardent 10 % de plus par niveau, jusqu'à 50 %.

- **Thème :** l'arbre de la mémoire continue de grandir, Saison après Saison ; on le voit s'élever au-dessus du
  quartier dans l'écran de l'Arbre.
- **Satisfaction :** chaque Saison tardive rapporte de nouveau un choix, et la relance répétitive devient un réglage.
- **Effort :** faible à moyen : les données et l'écran existent, il faut des talents à niveaux et un réglage.

### P12 — Le potager de la cour

Une boucle de soin **à temps réel**. Dans la cour, au pied de la fleur, quelques carrés de potager (3 au début,
jusqu'à 9) où le joueur **sème** une culture, la regarde **pousser** sur la carte, puis la **récolte** d'un clic.
Chaque culture a sa durée (de 3 min pour les radis à 4 h pour les courges), et sa récolte un effet lié à l'existant :

| Culture (exemples) | Pousse en | Récolte |
|---|---|---|
| Radis | 3 min | Une bouffée de Lumière (quelques minutes de production) |
| Tournesols | 20 min | Floraison du Papillon doré qui dure plus longtemps à sa prochaine venue |
| Haricots grimpants | 1 h | Potagers et Serres ×2 jusqu'à la fin de la Saison |
| Courges | 4 h | Une Graine qui mûrit tout de suite, ou de l'Eau |

- **Ce qui la rend douce :** une culture pousse hors ligne comme en ligne, et **ne fane jamais** : elle attend le
  joueur. L'Averse d'été (§9.6) arrose et fait gagner du temps, les Jardins de pluie et l'Eau de la Biorégion aussi.
- **Collection :** croiser deux cultures voisines fait parfois apparaître une **variété** nouvelle (tomate cerise,
  haricot violet…), rangée dans une **Grainothèque**, une planche de l'Herbier (§9.5). Une variété ramène parfois une
  espèce (les abeilles sur les tournesols).
- **Thème :** jardiner ensemble dans la cour, le geste le plus solarpunk qui soit.
- **Satisfaction :** des rendez-vous choisis par le joueur (« je reviens dans une heure pour les haricots »), et une
  raison de revenir qui ne dépend pas de la Lumière.
- **Effort :** moyen : un état par carré, des dessins de cultures à plusieurs stades, sur la carte SVG et PixiJS.

### P13 — Le delta des Sources

Les Sources deviennent elles aussi une monnaie à dépenser, sans perdre leur bonus (même modèle que les Graines,
§7.1) : un **delta** de bras de rivière à ouvrir, dessiné dans l'écran du Cycle de l'eau. Chaque bras **change une
règle** de la Biorégion ou des Saisons plutôt que d'ajouter de la vitesse :

- les Graines mûrissent plus vite (15 min → 12 min → 10 min) ;
- un collecteur ou un site reste à moitié bâti après un Cycle ;
- un cinquième site de la biorégion (les **Coteaux**, vignes et terrasses), qui relève le clic et les visites ;
- **L'éclusier** : relance le Cycle automatiquement au palier choisi (l'automatisation de la couche du dessous, comme
  le semoir de P11) ;
- des **Cycles à défi**, sur le modèle des Saisons à défi (§7.3) : « l'année sèche » (Eau ÷4), « la crue » (les
  collecteurs coûtent ×10), chacun avec une espèce rare de la rivière (loutre, saumon, cigogne noire).

- **Thème :** la rivière se ramifie et irrigue toute la région, à mesure que le joueur la comprend.
- **Satisfaction :** la deuxième couche gagne enfin ses décisions, comme la première en M7.
- **Effort :** moyen : un deuxième arbre (écran et données), des défis qui réutilisent ceux des Saisons.

### P14 — Un quartier à son image

Le joueur façonne son quartier, sans que cela change sa puissance totale :

- **Deux avenirs par parcelle.** Au moment de la restaurer, chaque parcelle propose deux dessins et deux effets de
  même valeur (le parking devient un parc ou un marché couvert ; le toit nu, une prairie ou un potager), et l'on peut
  changer d'avis à chaque Cycle de l'eau. Le choix se lit sur la carte, pas dans un texte.
- **Le décor.** Des éléments purement décoratifs (bancs, fresques, guirlandes, fontaines, couleur des fleurs de
  l'héliotrope) gagnés avec les Jalons et l'Herbier, posés d'un clic sur des emplacements de la carte.
- **Le mode photo.** Masquer le panneau et le compteur, choisir l'heure du jour et la saison de la scène, puis
  enregistrer l'image de son quartier (PNG), pour le montrer.

- **Thème :** chaque quartier ressemble à ceux qui l'habitent.
- **Satisfaction :** l'attachement, et des choix sans erreur possible.
- **Effort :** moyen à élevé : surtout des illustrations, à faire sur les dessins retravaillés par le fil des assets.

### P15 — L'accueil et le retour en images

- **Première minute guidée sans texte.** Un halo doré respire sur la fleur tant qu'on n'a pas cliqué, puis sur le
  premier bâtiment abordable, puis sur la première amélioration ; il disparaît dès que le geste est fait. Aucune
  bulle d'explication, seulement le regard guidé.
- **Le retour en images.** La fenêtre du retour hors ligne montre, en accéléré sur la carte, ce qui a poussé pendant
  l'absence (bâtiments achetés par les Coopératives, cultures mûres, Graines devenues mûres), avec les chiffres
  actuels seulement.
- **Rappels facultatifs.** Avec la PWA (§10.5), une notification **désactivée par défaut** quand les Graines sont mûres
  ou qu'une culture du potager est prête. Le jeu ne pousse jamais à se connecter à heure fixe (§5).

- **Thème et règle d'Antoine :** l'accueil passe par la scène et les animations, pas par du texte.
- **Satisfaction :** le nouveau joueur trouve tout seul, le joueur qui revient voit d'un coup ce qu'il a gagné.
- **Effort :** faible à moyen.

### P16 — La musique du quartier

Une musique d'ambiance **générative**, synthétisée comme les sons (§6.3, aucun fichier audio), sur la même gamme
pentatonique : quelques notes lentes au Balcon, puis une voix de plus à chaque phase, à chaque quartier voisin et à
chaque site de la biorégion (les zones humides ajoutent des gouttes, la forêt ancienne un bourdon grave). Le tempo et
la couleur suivent la saison visuelle et l'heure du soir (§9.6). Un réglage de volume séparé dans les Options, et
coupée par défaut sur mobile.

- **Thème :** on entend la ville respirer à mesure qu'elle revit.
- **Satisfaction :** un effet fort pour peu de code, et une progression qui s'entend.
- **Effort :** faible à moyen.

### P17 — Les saisons qui passent sur la carte

Les visites (§9.6) se diversifient avec ce que le joueur a bâti dans la Biorégion et les quartiers voisins, toujours
chacune liée à l'existant par une synergie : la **transhumance** (les moutons des prairies agrivoltaïques traversent
la ville et tondent : les Panneaux produisent plus un moment), la **fête des récoltes** (les halles du parking relais
s'animent : Récolte du Papillon doublée), les **lucioles** du soir dans les jardins d'eau (le clic vaut plus tant
qu'elles sont là), la **brocante solaire** des ateliers (un bâtiment moins cher un moment). De nouvelles espèces de
l'Herbier viennent avec elles.

- **Thème :** le récit par les événements, comme le veut la règle d'Antoine, à l'échelle de toute la ville.
- **Satisfaction :** les objectifs lointains de M12 et M9 se remettent à vivre, et la carte réserve encore des
  surprises au joueur qui a tout.
- **Effort :** moyen : le planificateur des visites existe, il faut des dessins et des animations.

---

## 4. Jalons

Chaque jalon reste livrable et jouable seul. Ils se construisent dans l'ordre ; chacun met à jour le design doc,
rejoue le simulateur et, si l'état change, ajoute une migration de sauvegarde (`STATE_VERSION`).

| Jalon | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| M5 à M12 | *Livrés* : carte, parcelles, projets, sons, Arbre, Coopératives, Herbier, défis, anglais, Biorégion, confort, visites, quartiers voisins (voir §7) | — |
| **M13 — L'Arbre s'étend** *(livré)* | P11 : la Canopée (talents à niveaux), le semoir (relance automatique de la Saison), les fontainiers, la Pépinière ; leurs Jalons — voir game-design §7.1 | Règle d'abord ce qui s'essouffle chez le joueur avancé : les Graines sans usage et les relances répétées, juste après l'allongement des Saisons (PR #35) |
| **M14 — Le potager de la cour** | P12 : les carrés de la cour, cultures à temps réel, Grainothèque et variétés, synergies avec l'Averse, l'Eau et l'Herbier | Une boucle neuve pour tous les joueurs, dès la 1ʳᵉ Saison, qui donne des rendez-vous sans punir l'absence |
| **M15 — Le delta des Sources** | P13 : les Sources à dépenser, les bras du delta, le site des Coteaux, l'éclusier, 3 Cycles à défi et leurs espèces | Donne ses choix à la deuxième couche, une fois que la première (M13) a montré le modèle |
| **M16 — Un quartier à son image** | P14 : deux avenirs par parcelle, le décor à poser, le mode photo | Après le fil des assets PixiJS, pour dessiner les variantes sur les nouveaux dessins |
| **M17 — L'accueil et le retour** | P15 : première minute guidée, retour hors ligne en images, rappels facultatifs ; P16 : la musique du quartier | Du soin pour tous, peu risqué pour l'équilibrage ; peut glisser plus tôt si Antoine le préfère |
| **M18 — La ville en fête** | P17 : quatre visites nouvelles liées à la Biorégion et aux quartiers voisins, leurs espèces et leurs Jalons | Fait revivre la fin de partie une fois tout le reste en place |

**Synergies (décision d'Antoine, 2026-10-10).** Comme en v1, chaque nouvelle mécanique se lie à l'existant (une
culture à l'Averse, un bras du delta aux Graines, une visite à un quartier voisin) plutôt que d'ajouter un
multiplicateur isolé. Les talents à niveaux de M13 et le delta de M15 restent sous les cibles du §8 : ils allègent et
diversifient les Saisons tardives sans relancer leur emballement.

**Récit par le jeu (décision d'Antoine, 2026-10-10).** Aucun jalon n'ajoute de journal ni de texte narratif : seuls
les noms et les effets sont écrits ; le reste passe par la carte, les animations et les événements.

**Après M18, à décider plus tard.** Une **troisième couche** au-dessus du Cycle de l'eau (le réseau des villes sœurs,
qui s'échangent des boutures et des savoir-faire, simulé sans serveur) ne vaut que si le joueur de référence atteint
encore le bout de M15 trop vite. On la réévaluera avec le simulateur après M15.

---

## 5. Ce qu'on écarte ou repousse

Repris de la v1, toujours valables :

- **Cycle jour / nuit avec production variable** : décor seulement (§9.6), on ne punit pas le joueur qui joue la nuit.
- **Classements en ligne et sauvegarde dans le nuage** : demandent un serveur ; le jeu reste statique sur GitHub Pages.
- **Événements à date réelle** (fête du solstice) : ils poussent à se connecter à heure fixe, ce que le §1 évite. La
  « fête des récoltes » de P17 est une visite tirée au hasard, pas une date.
- **Revente de bâtiments** : toujours peu utile.

Nouveaux :

- **Cultures qui fanent** ou carrés qui se perdent si l'on ne revient pas : contraire au §1, le potager attend.
- **Récompense de connexion quotidienne** : même raison que les événements à date réelle.
- **Autoclic gagné** (un clic automatique) : le clic reste le geste du joueur ; l'automatisation porte sur les achats
  et les relances, pas sur le clic.
- **Monétisation** : aucune (§14 Q6).

---

## 6. Décisions d'Antoine

Décisions de la v1, validées le 2026-10-10 :

| # | Question | Décision |
|---|---|---|
| D1 | Après la vue du dessus, quoi d'abord ? | Restaurer le quartier d'abord (M6 avant M7) |
| D2 | Les parcelles restaurées restent-elles d'une Saison à l'autre ? | Oui, elles restent |
| D3 | L'automatisation se gagne ou est disponible d'emblée ? | Elle se gagne, dès la 2ᵉ Saison |
| D4 | Deuxième ressource de la Biorégion ? | L'Eau |

Questions de la v2. En attendant la réponse d'Antoine, les jalons appliquent le choix recommandé.

| # | Question | Choix recommandé (appliqué par défaut) |
|---|---|---|
| D5 | Quoi d'abord : la fin de partie (M13, Arbre) ou une boucle neuve pour tous (M14, potager) ? | **M13 d'abord** : c'est là que le jeu s'essouffle aujourd'hui, et c'est le plus petit jalon |
| D6 | Relance automatique de la Saison (le semoir) et du Cycle (l'éclusier) ? | **Oui, gagnée** dans l'Arbre et le delta, éteinte par défaut et réglable |
| D7 | Les deux avenirs d'une parcelle : choix définitif ou modifiable ? | **Modifiable à chaque Cycle de l'eau** : on ose choisir, sans regret |
| D8 | Notifications de la PWA ? | **Facultatives, désactivées par défaut**, seulement Graines mûres et cultures prêtes |
| D9 | Troisième couche de prestige après M18 ? | **Plus tard**, réévaluée avec le simulateur après M15 |

---

## 7. Mécaniques de la v1 (livrées)

La v1 (2026-10-10) proposait dix mécaniques, toutes livrées entre M5 et M12 ; leur détail est maintenant dans le
design doc.

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
| — | Confort : temps avant achat, prochain objectif, raccourcis, courbes, PWA | M10 | §10.5 |
| — | Vue du dessus animée et équilibrage plus doux par les synergies | M5 | §5.3, §6, §8 |
