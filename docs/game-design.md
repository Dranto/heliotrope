# Heliotrope — Document de game design

> Statut : brouillon v0.1 (2026-10-10). Ce document fait foi pour les mécaniques, l'équilibrage et le ton du jeu.
> Toute décision de design qui change doit être reportée ici, dans la même PR que le code qui l'implémente.
> Les chiffres marqués *(à valider)* sont des points de départ à confirmer avec l'outil de simulation (voir §8).

## Sommaire

1. [Pitch et ton](#1-pitch-et-ton)
2. [Boucle de jeu](#2-boucle-de-jeu)
3. [Ressources](#3-ressources)
4. [Générateurs](#4-générateurs)
5. [Améliorations](#5-améliorations)
6. [Phases de progression](#6-phases-de-progression)
7. [Prestige : les Saisons](#7-prestige--les-saisons)
8. [Équilibrage](#8-équilibrage)
9. [Systèmes annexes](#9-systèmes-annexes)
10. [Écrans et interface](#10-écrans-et-interface)
11. [Contraintes pour l'implémentation](#11-contraintes-pour-limplémentation)
12. [Périmètre MVP et jalons](#12-périmètre-mvp-et-jalons)
13. [Au-delà du MVP](#13-au-delà-du-mvp)
14. [Questions ouvertes](#14-questions-ouvertes)

---

## 1. Pitch et ton

**Pitch.** Sur un balcon de béton gris, une seule fleur d'héliotrope suit le soleil. Le joueur récolte sa lumière, installe un premier panneau, puis un potager sur le toit, une serre partagée, une ferme verticale… Clic après clic, puis automatiquement, le quartier redevient vert, la ville respire, et chaque nouvelle saison repart d'un sol plus riche.

**Genre.** Jeu incrémental (idle/clicker) dans le navigateur, sessions courtes et fréquentes, progression qui continue hors ligne.

**Fantasme du joueur.** Voir un monde gris reverdir grâce à soi et à une communauté. La progression doit se *voir* : la scène centrale passe du gris au vert à mesure que le joueur avance.

**Piliers de ton.**

- **Optimiste, jamais naïf.** Le monde a souffert, mais le jeu parle de réparation, pas de catastrophe. Pas de compte à rebours, pas de punition.
- **Collectif.** Les bâtiments sont partagés (serre *communautaire*, réseau *d'entraide*). Les textes parlent de « nous » et de voisins, pas d'un magnat qui accumule.
- **Organique et technique à la fois.** Le solarpunk mêle plantes et technologie douce : panneaux solaires couverts de lierre, miroirs de concentration au milieu des vergers.
- **Élégant et lumineux.** Design moderne et épuré, lumière dorée, touches florales (voir §10.4), animations lentes, sons discrets. Le joueur doit pouvoir laisser l'onglet ouvert sans être agressé.

**Ce que le jeu n'est pas.** Pas de pay-to-win, pas de minuteurs frustrants, pas de pénalité pour l'absence, pas d'humour cynique.

---

## 2. Boucle de jeu

### Boucle courte (secondes)

1. Cliquer sur l'héliotrope → gagner de la **Lumière**.
2. Acheter un générateur dès qu'on peut → la production par seconde augmente.
3. Recommencer, avec un objectif visible (le prochain générateur ou amélioration grisé, avec son prix).

### Boucle moyenne (minutes à heures)

1. Les générateurs produisent seuls ; le clic devient secondaire (mais reste utile grâce aux améliorations de clic et au Papillon doré, §9.2).
2. Acheter des **améliorations** qui multiplient les générateurs.
3. Débloquer des paliers (nouveaux générateurs, nouvelles phases visuelles du quartier).
4. Revenir après une absence et récolter la production hors ligne.

### Boucle longue (heures à jours)

1. La progression ralentit (les coûts croissent exponentiellement plus vite que la production).
2. Le joueur lance une **Nouvelle Saison** (prestige) : il repart de zéro mais gagne des **Graines d'Héliotrope**, un bonus permanent.
3. Chaque saison va plus loin et plus vite que la précédente.

**Règle d'or :** à tout moment, le joueur doit avoir un objectif atteignable en moins de ~2 minutes de jeu actif, et un objectif lointain visible.

---

## 3. Ressources

| Ressource | Rôle | Obtention | Remise à zéro à la Saison ? |
|---|---|---|---|
| **Lumière** ☀ | Monnaie principale, sert à tout acheter | Clic, générateurs, Papillon doré | Oui |
| **Graines d'Héliotrope** 🌱 | Monnaie de prestige, bonus permanent | Nouvelle Saison | Non |
| **Jalons** 🏅 | Succès, petit bonus global | Objectifs atteints | Non |

Le MVP se limite volontairement à **une seule monnaie de jeu** (la Lumière). Une deuxième couche de ressources (eau, biodiversité, habitants) est prévue après le MVP (§13) : elle n'a de sens qu'une fois la boucle de base solide.

---

## 4. Générateurs

Huit générateurs, du balcon à la ville entière. Les valeurs de base reprennent la progression éprouvée de Cookie Clicker (coût ×~10 et production ×~6 par palier), qui donne un rythme où chaque nouveau palier rentabilise rapidement son prix.

| # | Nom | Texte d'ambiance | Coût de base | Production de base (Lumière/s) | Rentabilité du 1er exemplaire |
|---|---|---|---|---|---|
| 1 | Héliotrope en pot | « Elle suit le soleil. Nous aussi. » | 15 | 0,1 | 150 s |
| 2 | Panneau de balcon | « Un panneau, une prise, un début. » | 100 | 1 | 100 s |
| 3 | Potager sur le toit | « Les tomates aiment la vue. » | 1 100 | 8 | 138 s |
| 4 | Serre communautaire | « Chacun apporte ses semis. » | 12 000 | 47 | 255 s |
| 5 | Ferme verticale | « Douze étages de laitues et de lumière. » | 130 000 | 260 | 500 s |
| 6 | Centrale à miroirs | « Mille miroirs, un seul soleil. » | 1 400 000 | 1 400 | 1 000 s |
| 7 | Canopée urbaine | « Les rues deviennent des sous-bois. » | 20 000 000 | 7 800 | 2 564 s |
| 8 | Arcologie vivante | « Une ville qui respire. » | 330 000 000 | 44 000 | 7 500 s |

**Règles.**

- Coût du n-ième exemplaire (n commençant à 0) : `coût(n) = coûtBase × 1,15^n`.
- Production d'un type : `prodBase × nombrePossédé × multiplicateursDuType × multiplicateurGlobal`.
- Un générateur est **visible** (silhouette + prix) dès que le joueur a gagné au total la moitié de son coût de base, et **achetable** dès qu'il a assez de Lumière. Seul le prochain générateur non découvert est montré en silhouette, pour garder un objectif visible sans tout dévoiler.
- Achat par lot : ×1, ×10, ×100, Max. Coût de k exemplaires à partir de n : `coûtBase × 1,15^n × (1,15^k − 1) / 0,15`.
- Pas de revente dans le MVP (simplifie l'équilibrage, et le joueur n'en a pas besoin).

---

## 5. Améliorations

Les améliorations sont des achats uniques, affichés au-dessus de la liste des générateurs, triés par prix. Elles apparaissent quand leur condition est remplie et restent visibles jusqu'à l'achat.

### 5.1 Améliorations de générateur (×2)

Pour chaque générateur, une amélioration qui **double** sa production se débloque à chaque seuil de possession.

| Seuil possédé | 1 | 5 | 25 | 50 | 100 | 150 | 200 |
|---|---|---|---|---|---|---|---|
| Coût (× coût de base du générateur) | 10 | 50 | 500 | 50 000 | 5 000 000 | 500 000 000 | 50 000 000 000 |

Soit 8 générateurs × 7 seuils = 56 améliorations, chacune avec un nom et une ligne d'ambiance (ex. « Terreau de compost » pour le Potager, « Miroirs auto-orientables » pour la Centrale).

### 5.2 Améliorations de clic

| Nom *(provisoire)* | Condition | Coût | Effet |
|---|---|---|---|
| Gants de jardinage | 1 000 Lumière gagnées au total | 100 | Clic ×2 |
| Arrosoir en cuivre | 100 000 au total | 10 000 | Clic ×2 |
| Mains vertes | 10 M au total | 1 M | Le clic rapporte +1 % de la production/s |
| Geste partagé | 1 Md au total | 100 M | +1 % de la production/s |
| Cueillette solaire | 100 Md au total | 10 Md | +1 % de la production/s |

Le clic vaut donc `(1 × multiplicateursDeClic) + (% de la production/s)`. Cela garde le clic pertinent toute la partie sans le rendre obligatoire.

### 5.3 Synergies

Petites améliorations qui lient deux générateurs, pour récompenser une ville variée plutôt qu'un seul bâtiment empilé. Exemples :

- **Compost partagé** : le Potager sur le toit gagne +5 % par Serre communautaire possédée.
- **Ombre utile** : la Canopée urbaine gagne +1 % par Panneau de balcon possédé.
- **Chaleur récupérée** : la Serre communautaire gagne +2 % par Centrale à miroirs possédée.

Condition : 15 exemplaires de chacun des deux générateurs. Coût : ~10 000 × le coût de base du plus cher des deux *(à valider)*.

### 5.4 Bonus de biodiversité

Mécanique passive propre au thème : **chaque type de générateur possédé à 10 exemplaires ou plus donne +2 % de production globale** ; +2 % supplémentaires à 50, et encore à 100. Avec 8 types, le maximum est +48 %. Cela pousse doucement à faire grandir tout le quartier, et non une seule monoculture.

---

## 6. Phases de progression

Chaque phase change la scène centrale (le décor reverdit) et débloque des éléments d'interface. Les durées sont des cibles pour un joueur qui joue activement la première fois *(à valider)*.

| Phase | Nom | Durée cible (1ʳᵉ partie) | Ce qui se débloque | La scène montre |
|---|---|---|---|---|
| 1 | **Le Balcon** | 0 – 10 min | Clic, générateurs 1 à 3, premières améliorations | Un balcon gris, une fleur, puis des pots et un panneau |
| 2 | **Le Quartier** | 10 min – 1 h | Générateurs 4 et 5, synergies, Jalons, Papillon doré | Les toits verdissent, une serre apparaît |
| 3 | **La Ville** | 1 h – 4 h | Générateurs 6 à 8, bonus de biodiversité complet, prestige disponible | Des miroirs au loin, les rues deviennent des sous-bois |
| 4 | **Les Saisons** | après la 1ʳᵉ Saison | Écran des Saisons, statistiques de prestige | La scène change de teinte selon la saison (printemps, été, automne, hiver) |

Les phases se déclenchent sur la **Lumière totale gagnée pendant la Saison en cours** (seuils indicatifs : Phase 2 à 10 000, Phase 3 à 10 M).

**Journal du quartier.** Un fil de courts messages narratifs déclenchés par les paliers (« Mme Okafor a ramené des boutures de sa sœur. », « La rue des Tilleuls a voté pour un jardin partagé. »). Il porte l'histoire sans jamais bloquer le jeu.

---

## 7. Prestige : les Saisons

### Principe

Quand la progression ralentit, le joueur peut lancer une **Nouvelle Saison**. Thématiquement : l'hiver passe, on replante tout, mais la terre garde la mémoire de ce qui a poussé.

**Remis à zéro :** Lumière, générateurs, améliorations, phase visuelle.
**Conservé :** Graines d'Héliotrope, Jalons, statistiques globales, options.

### Formule

```
grainesTotalesMéritées = floor( sqrt( lumièreTotaleToutesSaisons / 1e9 ) )
grainesGagnées         = grainesTotalesMéritées − grainesDéjàObtenues
bonusProduction        = +5 % par Graine possédée (additif)
```

Points de repère *(à valider)* :

| Lumière totale cumulée | Graines | Bonus |
|---|---|---|
| 1 Md (1e9) | 1 | +5 % |
| 100 Md (1e11) | 10 | +50 % |
| 10 000 Md (1e13) | 100 | +500 % |

- Le bouton Nouvelle Saison est disponible dès qu'on gagnerait au moins **1** Graine, mais l'interface conseille d'attendre d'en gagner au moins 10 pour la première (« La terre n'est pas encore prête »). On ne bloque pas, on conseille.
- L'écran de confirmation montre clairement : ce qui sera perdu, les Graines gagnées, le bonus avant/après.
- Cible : 1ʳᵉ Saison rentable vers **3–4 h** de jeu, puis des Saisons de plus en plus courtes pour atteindre le même point.

### Arbre des Saisons (post-MVP)

Les Graines servent aussi de monnaie pour un arbre de talents permanents (garder 10 % des générateurs, Papillon doré plus fréquent, production hors ligne plus longue…). Dépenser une Graine **ne réduit pas** le bonus de +5 % : le bonus dépend des Graines obtenues au total, la monnaie dépensable est un compteur séparé. C'est le modèle de Cookie Clicker (niveau de prestige vs. puces célestes) : le joueur n'est jamais puni pour avoir dépensé.

---

## 8. Équilibrage

### Formules de référence

```
productionGlobale/s = Σ_types( prodBase × possédés × multTypes )
                      × (1 + 0,05 × graines)
                      × (1 + 0,01 × jalons)
                      × (1 + bonusBiodiversité)
                      × multÉvénement            // Papillon doré
coût(n)             = coûtBase × 1,15^n
valeurClic          = 1 × multClic + pctClic × productionGlobale/s
```

### Courbes et intentions

- **Coût exponentiel, production linéaire par générateur** : chaque générateur finit par devenir cher à empiler, ce qui pousse vers le palier suivant puis vers les améliorations, puis vers le prestige.
- **Les améliorations ×2 compensent la croissance des coûts** par paliers : elles créent des « marches » de progression qu'on sent.
- **Le prestige compense le mur final.** Avec `sqrt`, gagner 10× plus de Graines demande 100× plus de Lumière : les Saisons longues restent rentables, mais le retour diminue, ce qui pousse à relancer régulièrement.

### Rythme cible (1ʳᵉ partie, joueur actif)

| Événement | Moment cible |
|---|---|
| 1ᵉʳ Héliotrope en pot | < 15 s |
| 1ᵉʳ Panneau de balcon | ~1 min |
| 1ᵉʳ Potager sur le toit | ~4 min |
| 1ʳᵉ Serre communautaire | ~12 min |
| 1ʳᵉ Ferme verticale | ~30 min |
| 1ʳᵉ Centrale à miroirs | ~1 h |
| 1ʳᵉ Canopée urbaine | ~2 h |
| 1ʳᵉ Arcologie vivante | ~3 h 30 |
| 1ʳᵉ Saison conseillée (10 Graines) | ~4 h |

### Outil de simulation

L'équilibrage doit être vérifié par un **simulateur sans interface** qui rejoue une stratégie simple (acheter à chaque instant l'option au meilleur ratio coût / gain de production) et sort le moment de chaque événement du tableau ci-dessus. Il réutilise exactement les mêmes fonctions de calcul et les mêmes données que le jeu. Tout changement de chiffre dans ce document devrait être accompagné d'une sortie du simulateur.

### Affichage des nombres

- Jusqu'à 999 999 : chiffres complets avec séparateur de milliers (« 12 345 »).
- Au-delà : suffixes courts avec 3 chiffres significatifs (« 1,23 M », « 45,6 Md », « 7,89 Bn »…), puis notation scientifique au-delà du dernier suffixe.
- Option pour forcer la notation scientifique partout.

---

## 9. Systèmes annexes

### 9.1 Progression hors ligne

- Au retour, le jeu calcule la production pendant l'absence à **100 %** de la production/s au moment du départ, **plafonnée à 8 h** *(à valider)*.
- Une fenêtre « Pendant ton absence… » résume le gain, avec une phrase d'ambiance du Journal.
- Les événements temporaires (Papillon doré) ne comptent pas hors ligne.

### 9.2 Papillon doré

Un papillon traverse l'écran à intervalle aléatoire (**toutes les 3 à 8 min**), reste cliquable **12 s**. Le cliquer donne un effet au hasard :

| Probabilité | Effet | Détail |
|---|---|---|
| 50 % | **Floraison** | Production ×7 pendant 60 s |
| 40 % | **Récolte** | Gain immédiat = min(15 % de la Lumière en réserve, 15 min de production) |
| 10 % | **Pollinisation** | Valeur de clic ×100 pendant 10 s |

C'est la principale raison de garder l'onglet ouvert et de jouer activement, sans être obligatoire.

### 9.3 Jalons (succès)

Environ 40 jalons dans le MVP, chacun donnant **+1 % de production globale**. Familles :

- Lumière totale gagnée (1 000, 1 M, 1 Md…)
- Nombre de chaque générateur possédé (1, 50, 100)
- Clics (100, 1 000, 10 000)
- Papillons attrapés (1, 10, 50)
- Saisons accomplies (1, 5, 10)
- Quelques jalons cachés amusants (ex. « Photosynthèse lente » : ne rien acheter pendant 10 min)

### 9.4 Sauvegarde

- Sauvegarde automatique toutes les 30 s et à la fermeture de l'onglet.
- Export / import d'une sauvegarde en texte (base64) depuis les Options.
- Remise à zéro complète avec double confirmation.
- Chaque sauvegarde porte un numéro de version, avec une migration quand le format change.

---

## 10. Écrans et interface

### 10.1 Écran principal (bureau)

```
┌───────────────────────────────────────────────────────────────────┐
│  HELIOTROPE           ☀ 1,23 M Lumière   (+4 560 /s)     [≡ Menu] │
├───────────────┬─────────────────────────────┬─────────────────────┤
│               │                             │ Améliorations       │
│   (fleur      │      Scène du quartier      │ [▣][▣][▣][▢][▢]     │
│   cliquable,  │   (reverdit selon la phase) │─────────────────────│
│   tourne vers │                             │ Acheter ×1 ×10 ×100 │
│   le soleil)  │                             │ Héliotrope en pot 42│
│               │                             │ Panneau de balcon 18│
│   +12 / clic  │                             │ Potager sur le toit │
│               │   Journal du quartier ▸     │ ░░ ??? ░░  1,4 M    │
└───────────────┴─────────────────────────────┴─────────────────────┘
```

- **Gauche :** l'héliotrope cliquable (petite animation et nombre flottant à chaque clic), valeur du clic.
- **Centre :** la scène, qui évolue par phase ; le Papillon doré la traverse ; le Journal du quartier en bas.
- **Droite :** améliorations disponibles (icônes avec infobulle) puis liste des générateurs (nom, quantité, prix, production, infobulle avec le détail des multiplicateurs).
- **Haut :** compteur de Lumière, production/s, menu.

### 10.2 Autres écrans (onglets ou panneaux)

| Écran | Contenu | Dès |
|---|---|---|
| **Jalons** | Grille des succès, débloqués en couleur, cachés en « ? » | Phase 2 |
| **Saisons** | Graines actuelles, Graines à gagner, bonus avant/après, bouton Nouvelle Saison avec confirmation | Prestige disponible |
| **Statistiques** | Lumière totale (saison / toutes), clics, temps de jeu, papillons, saisons | Toujours |
| **Options** | Notation des nombres, volume, sauvegarde manuelle, export / import, remise à zéro | Toujours |
| **Retour hors ligne** | Fenêtre modale du gain d'absence | Au chargement |

### 10.3 Mobile

Même contenu, une colonne : compteur en haut, fleur + scène au centre, barre d'onglets en bas (Récolte / Bâtir / Améliorer / Plus). Les cibles tactiles font au moins 44 px.

### 10.4 Direction artistique

**Intention (décidée par Antoine, 2026-10-10) :** élégant et très moderne, dans un esprit solarpunk ensoleillé, avec une touche florale et naturelle légère. On vise l'interface d'un bel objet design, pas un jeu « cartoon » : beaucoup d'air, des lignes fines, de la lumière dorée.

**Mots-clés.** Lumière de fin d'après-midi · verre dépoli · lignes botaniques fines · arches et courbes inspirées de l'Art nouveau · sobriété.

**Typographie.**

- **Titres et noms (générateurs, Saisons, Journal) : [Fraunces](https://fonts.google.com/specimen/Fraunces)**, serif variable aux formes douces et organiques ; réglée avec un peu de « SOFT » pour un côté floral sans être fantaisiste.
- **Interface et chiffres : [Manrope](https://fonts.google.com/specimen/Manrope)**, sans-serif géométrique moderne, avec chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour que les compteurs ne « sautent » pas.
- Deux polices au maximum, toutes deux sous licence libre (OFL) et hébergées avec le jeu (pas d'appel à un service tiers au chargement).

**Palette.**

| Rôle | Couleur | Valeur indicative |
|---|---|---|
| Fond principal | Crème lumineuse | `#FBF6EC` |
| Accent principal (Lumière, boutons) | Or soleil | `#E9A93B` |
| Accent secondaire | Vert sauge | `#8FAE8B` |
| Végétation, succès | Vert feuille profond | `#2F6B4F` |
| Touche florale | Rose héliotrope / lilas | `#B79AD6` |
| Chaleur | Terracotta | `#C8734F` |
| Texte | Vert-noir encre | `#1F2A24` |
| Monde non restauré | Gris béton | `#A7A39C` |

L'or et le lilas (la couleur de la fleur d'héliotrope) forment le duo signature ; le reste reste discret.

**Formes et matières.**

- Cartes et panneaux en verre dépoli légèrement translucide sur un fond en dégradé doux (aube → midi → fin d'après-midi selon la phase), coins arrondis généreux, ombres très légères.
- Motifs botaniques en trait fin (tiges, feuilles, pétales) en filigrane dans les bordures et les séparateurs, jamais chargés.
- Arches et cadres courbes inspirés de l'Art nouveau pour les éléments importants (fleur cliquable, écran des Saisons).
- Illustrations de la scène en vectoriel (SVG), aplats doux et dégradés subtils, un léger grain pour éviter l'effet « plat numérique ».
- Icônes en trait fin, cohérentes avec les motifs botaniques.

**Mouvement.** Animations lentes et fluides : l'héliotrope pivote doucement vers le curseur ou le soleil, les pétales s'ouvrent au clic, des particules de pollen dorées flottent. Rien de clignotant.

**Accessibilité.** Contraste AA sur tout le texte (l'or et le lilas servent d'accents, pas de couleur de texte sur fond clair), animations réduites si `prefers-reduced-motion`, aucune information portée par la couleur seule.

---

## 11. Contraintes pour l'implémentation

Ces points ne choisissent pas la technique (c'est le rôle du fil de mise en place), mais en découlent directement du design :

- **Contenu piloté par les données.** Générateurs, améliorations, jalons et messages du Journal sont décrits dans des fichiers de données, pas codés en dur. Ajouter un générateur ne doit pas demander de toucher la logique.
- **Logique pure, séparée de l'affichage.** Calcul de la production, des coûts, du prestige : fonctions pures testables et réutilisées par le simulateur (§8).
- **Boucle basée sur le temps écoulé**, pas sur le nombre d'images : la production dépend du delta de temps réel, ce qui rend la progression hors ligne et les onglets en arrière-plan cohérents.
- **Grands nombres.** Le MVP reste sous 1e300 ; les nombres JavaScript standards suffisent, mais tous les calculs passent par un petit module numérique pour pouvoir basculer plus tard vers une bibliothèque de grands nombres.
- **Textes externalisés** pour pouvoir traduire le jeu.

---

## 12. Périmètre MVP et jalons

Chaque jalon est livrable et jouable seul, et peut être pris par un fil d'implémentation distinct. Le jalon M0 (mise en place du projet, outillage, CI, déploiement) est traité à part.

### M1 — Boucle de base

- État du jeu, boucle de mise à jour basée sur le temps.
- Clic sur l'héliotrope, compteur de Lumière et production/s.
- Générateurs 1 à 4 avec coût exponentiel, achat ×1.
- Formatage des nombres (§8).
- Données des générateurs dans un fichier de données.

**Critère de fin :** on peut jouer 15 minutes, acheter les 4 premiers générateurs, et les nombres s'affichent correctement.

### M2 — Contenu complet et persistance

- Les 8 générateurs, achat ×10 / ×100 / Max, apparition progressive (silhouette).
- Améliorations : ×2 par générateur, clic, synergies, bonus de biodiversité.
- Sauvegarde automatique, export / import, progression hors ligne.
- Simulateur d'équilibrage et première passe d'équilibrage sur le tableau du §8.

**Critère de fin :** une partie de 4 h est jouable, survit à un rechargement, et le simulateur sort les temps cibles à ±30 %.

### M3 — Les Saisons (prestige)

- Calcul des Graines, écran des Saisons, confirmation, remise à zéro, bonus.
- Écran Statistiques.

**Critère de fin :** on peut enchaîner deux Saisons, et la seconde atteint plus vite chaque palier.

### M4 — Vie et finitions

- Jalons (succès) et leur bonus.
- Papillon doré.
- Journal du quartier.
- Scène centrale évolutive par phase, saisons visuelles.
- Mise en page mobile, accessibilité, écran Options complet.

**Critère de fin :** le jeu est présentable à des joueurs extérieurs.

**Le MVP = M1 à M4.**

---

## 13. Au-delà du MVP

Idées à reprendre quand le MVP est stable, par ordre de priorité proposé :

1. **Carte du quartier.** Une grille de parcelles grises (friches, parkings, toits nus) à restaurer contre de la Lumière. Chaque parcelle restaurée apporte un bonus ciblé (un parc : +clic ; une rivière dépolluée : +1 h de plafond hors ligne ; un verger : +% à un générateur). Rend la restauration du monde concrète et visuelle.
2. **Arbre des Saisons** (§7) : talents permanents achetés avec les Graines.
3. **Cycle jour / nuit et batteries.** La production solaire varie au fil d'une journée de jeu ; des batteries stockent le surplus. À tester avec prudence : ne doit jamais punir le joueur absent.
4. **Deuxième couche : la Biorégion.** Nouvelle ressource (Eau ou Biodiversité), nouveaux générateurs, deuxième niveau de prestige.
5. **Défis de Saison.** Saisons à contraintes (« sans Panneaux », « clic seulement ») qui donnent des récompenses uniques.

---

## 14. Questions ouvertes

Décisions qui appartiennent à Antoine. En attendant sa réponse, le document applique le choix recommandé.

| # | Question | Choix recommandé (appliqué par défaut) |
|---|---|---|
| Q1 | Langue de l'interface du jeu ? | Français d'abord, textes externalisés pour ajouter l'anglais ensuite |
| Q2 | Plateforme visée ? | Navigateur, bureau d'abord, mais jouable sur mobile (responsive) |
| Q3 | Production hors ligne : 100 % plafonnée à 8 h ? | Oui |
| Q4 | La Carte du quartier dans le MVP ou après ? | Après le MVP, pour livrer plus vite une boucle complète |
| Q5 | ~~Style graphique ?~~ | **Décidé :** élégant, très moderne, solarpunk ensoleillé et légèrement floral (voir §10.4) |
| Q6 | Monétisation ? | Aucune : jeu gratuit, sans pub |
| Q7 | Récit : simple ambiance (Journal) ou vraie histoire avec personnages ? | Ambiance légère via le Journal du quartier |
