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
- **Raconté par le jeu, pas par du texte.** Décision d'Antoine (2026-10-10) : pas de journal ni de récit écrit. L'histoire se lit uniquement dans le gameplay : la scène qui reverdit, les animations, les événements en jeu. Si un moment doit être raconté, il devient quelque chose qui se passe à l'écran ou une règle qui change, jamais une ligne de texte (voir §6).
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

Huit générateurs, du balcon à la ville entière. Les valeurs de base partent de la progression éprouvée de Cookie Clicker (coût ×~10 et production ×~6 par palier), qui donne un rythme où chaque nouveau palier rentabilise rapidement son prix. Les valeurs ont été retouchées au jalon 4 puis adoucies juste après le MVP (voir les notes sous le tableau).

| # | Nom | Texte d'ambiance | Coût de base | Production de base (Lumière/s) | Rentabilité du 1er exemplaire |
|---|---|---|---|---|---|
| 1 | Héliotrope en pot | « Elle suit le soleil. Nous aussi. » | 15 | 0,1 | 150 s |
| 2 | Panneau de balcon | « Un panneau, une prise, un début. » | 100 | 1 | 100 s |
| 3 | Potager sur le toit | « Les tomates aiment la vue. » | 400 | 8 | 50 s |
| 4 | Serre communautaire | « Chacun apporte ses semis. » | 6 000 | 30 | 200 s |
| 5 | Ferme verticale | « Douze étages de laitues et de lumière. » | 200 000 | 260 | 769 s |
| 6 | Centrale à miroirs | « Mille miroirs, un seul soleil. » | 3 000 000 | 1 400 | 2 143 s |
| 7 | Canopée urbaine | « Les rues deviennent des sous-bois. » | 28 000 000 | 7 800 | 3 590 s |
| 8 | Arcologie vivante | « Une ville qui respire. » | 200 000 000 | 44 000 | 4 545 s |

> Passe d'équilibrage du jalon 4 (2026-10-10) : les Jalons (+1 % chacun) et le Papillon doré accélèrent surtout le milieu de partie. Avec les coûts d'origine (130 000, 1,4 M, 20 M et 330 M), le simulateur atteignait la Centrale à miroirs en 27 min au lieu d'une heure et la Canopée en 49 min au lieu de deux. Les coûts de base des générateurs 5 à 8 sont donc multipliés par 1,5, 2, 2,5 et 2,5 (arrondis), leurs améliorations ×2 suivent puisqu'elles sont indexées sur le coût de base, et la Floraison passe de ×7 à ×3 (§9.2). Les productions ne changent pas.

> Équilibrage adouci (après le MVP, 2026-10-10) : Antoine trouvait la progression trop lente et voulait mieux sentir chaque palier. Le rythme cible du §8 est raccourci d'environ un tiers (1ʳᵉ Saison conseillée vers 2 h 40 au lieu de 4 h). Le Potager passe à 400 (au lieu de 1 100), la Serre à 6 000 pour 30 Lumière/s (au lieu de 12 000 pour 47), la Canopée à 28 M (au lieu de 50 M) et l'Arcologie à 200 M (au lieu de 800 M). La rentabilité du 1ᵉʳ exemplaire monte désormais en pente douce d'un palier à l'autre, au lieu de tripler à chaque palier en fin de partie (6 410 s puis 18 182 s auparavant). La Serre produit un peu moins pour que l'arrivée de la Ferme verticale ne s'emballe pas. Les améliorations ×2 et les synergies suivent, puisqu'elles sont indexées sur les coûts de base.

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
| Mains tièdes | 15 clics et 1 Héliotrope en pot | 15 | Clic ×2 |
| Gants de jardinage | 300 Lumière gagnées au total | 100 | Clic ×2 |
| Sécateur | 200 clics | 500 | Clic ×2 |
| Coup de main | 10 Héliotropes en pot | 2 000 | Le clic rapporte +0,05 Lumière de base par bâtiment possédé |
| Arrosoir en cuivre | 50 000 au total | 10 000 | Clic ×2 |
| Mains du voisinage | 25 Panneaux de balcon | 50 000 | +0,1 Lumière de base par bâtiment possédé |
| Chapeau de paille | 2 000 clics | 200 000 | Le clic rapporte +0,5 % de la production/s |
| Mains vertes | 10 M au total | 1 M | Le clic rapporte +1 % de la production/s |
| Geste partagé | 1 Md au total | 100 M | +1 % de la production/s |
| Cueillette solaire | 100 Md au total | 10 Md | +1 % de la production/s |

Le clic vaut donc `(1 + bonusParBâtiment × bâtimentsPossédés) × multiplicateursDeClic + (% de la production/s)`. Cela garde le clic pertinent toute la partie sans le rendre obligatoire.

> Clic plus agréable (après le MVP, 2026-10-10) : Antoine voulait plus d'améliorations de clic en début de partie. Cinq s'ajoutent aux cinq d'origine (Mains tièdes, Sécateur, Coup de main, Mains du voisinage, Chapeau de paille) ; les Gants arrivent à 300 Lumière au lieu de 1 000 et l'Arrosoir à 50 000 au lieu de 100 000. Dans les cinq premières minutes, le clic passe ainsi de 1 à 16 Lumière, plus un bonus qui grandit avec le quartier. Trois des nouvelles améliorations se débloquent en cliquant : le compteur de clics couvre toutes les Saisons, donc un joueur qui a déjà joué les retrouve tout de suite. Les Mains tièdes attendent le premier pot pour que le premier achat reste un bâtiment. Chaque amélioration de clic dore une pousse de l'arche autour de la fleur (dix emplacements) et fait fleurir la jardinière de la cour (une étape toutes les deux améliorations).

### 5.3 Synergies

Petites améliorations qui lient deux générateurs, pour récompenser une ville variée plutôt qu'un seul bâtiment empilé. Le générateur indiqué gagne un bonus (additif) par exemplaire possédé de la source.

**Entre bâtiments voisins.** Chaque paire de bâtiments voisins est liée dans les deux sens : le plus cher aide généreusement le moins cher, et le moins cher, possédé en nombre, aide un peu le plus cher.

| Nom | Gagne | Par exemplaire de | Bonus |
|---|---|---|---|
| Pots au soleil | Héliotrope en pot | Panneau de balcon | +5 % |
| Toits branchés | Panneau de balcon | Potager sur le toit | +5 % |
| Compost partagé | Potager sur le toit | Serre communautaire | +5 % |
| Tours à semis | Serre communautaire | Ferme verticale | +4 % |
| Lumière réfléchie | Ferme verticale | Centrale à miroirs | +3 % |
| Miroirs au frais | Centrale à miroirs | Canopée urbaine | +3 % |
| Racines vivantes | Canopée urbaine | Arcologie vivante | +3 % |
| Boutures de pot | Panneau de balcon | Héliotrope en pot | +1 % |
| Prises sur le toit | Potager sur le toit | Panneau de balcon | +1 % |
| Coin des jardiniers | Serre communautaire | Potager sur le toit | +1 % |
| Étages pépinière | Ferme verticale | Serre communautaire | +1 % |
| Fleurs de ferme | Centrale à miroirs | Ferme verticale | +1 % |
| Clairières ensoleillées | Canopée urbaine | Centrale à miroirs | +1 % |
| Corridors de canopée | Arcologie vivante | Canopée urbaine | +1 % |

**Entre bâtiments éloignés.**

| Nom | Gagne | Par exemplaire de | Bonus |
|---|---|---|---|
| Ombre utile | Canopée urbaine | Panneau de balcon | +1 % |
| Chaleur récupérée | Serre communautaire | Centrale à miroirs | +2 % |
| Mille pots | Arcologie vivante | Héliotrope en pot | +0,5 % |
| Réseau citoyen | Centrale à miroirs | Panneau de balcon | +0,5 % |

Condition : 10 exemplaires de chacun des deux générateurs, ou 5 quand l'un des deux fait partie des trois derniers (Centrale, Canopée, Arcologie), plus rares. Coût : 2 000 × le coût de base du plus cher des deux, ou 100 × pour les synergies des trois derniers, pour qu'elles restent à portée. Celles des derniers bâtiments arrivent surtout à partir de la 2ᵉ Saison, ce qui laisse quelque chose à découvrir après le premier prestige.

**Entre améliorations.** Trois améliorations grandissent avec les autres améliorations achetées. Leur bonus s'ajoute à toute la production (multiplicateur global, §8) :

| Nom | Condition | Coût | Effet |
|---|---|---|---|
| Savoirs partagés | 10 améliorations achetées | 50 000 | +0,5 % par amélioration achetée |
| Grainothèque | 30 améliorations achetées | 50 M | +0,5 % par amélioration achetée |
| Les communs | 6 synergies entre bâtiments achetées | 500 M | +3 % par synergie entre bâtiments achetée |

**Avec le clic.** Trois bâtiments grandissent avec les améliorations de clic achetées (§5.2) : soigner la fleur à la main profite aussi au quartier.

| Nom | Condition | Coût | Effet |
|---|---|---|---|
| Pots choyés | 10 Héliotropes en pot, 3 améliorations de clic | 1 000 | Héliotrope en pot : +5 % par amélioration de clic achetée |
| Tournée du jardinier | 10 Potagers sur le toit, 5 améliorations de clic | 30 000 | Potager sur le toit : +3 % par amélioration de clic achetée |
| Pollinisation à la main | 10 Serres communautaires, 6 améliorations de clic | 300 000 | Serre communautaire : +3 % par amélioration de clic achetée |

> Synergies (après le MVP, 2026-10-10) : Antoine voulait adoucir encore l'équilibrage en ajoutant beaucoup de synergies plutôt qu'en touchant aux valeurs des générateurs. On passe de 3 synergies à 18 entre bâtiments et 3 entre améliorations. Les synergies se débloquent plus tôt (10 exemplaires au lieu de 15) et coûtent moins cher (2 000 × au lieu de 10 000 × le coût de base). Les coûts et productions des générateurs ne changent pas. La 1ʳᵉ Saison conseillée arrive vers 2 h 15 au lieu de 2 h 50 (§8).

### 5.4 Bonus de biodiversité

Mécanique passive propre au thème : **chaque type de générateur possédé à 10 exemplaires ou plus donne +2 % de production globale** ; +2 % supplémentaires à 50, et encore à 100. Avec 8 types, le maximum est +48 %. Cela pousse doucement à faire grandir tout le quartier, et non une seule monoculture.

---

## 6. Phases de progression

Chaque phase change la scène centrale (le décor reverdit) et débloque des éléments d'interface. Les durées sont des cibles pour un joueur qui joue activement la première fois *(à valider)*.

| Phase | Nom | Durée cible (1ʳᵉ partie) | Ce qui se débloque | La scène montre |
|---|---|---|---|---|
| 1 | **Le Balcon** | 0 – 5 min | Clic, générateurs 1 à 3, premières améliorations | Un balcon gris, une fleur, puis des pots et un panneau |
| 2 | **Le Quartier** | 5 min – 25 min | Générateurs 4 et 5, synergies, Jalons, Papillon doré | Les toits verdissent, une serre apparaît |
| 3 | **La Ville** | 25 min – 1 h 40 | Générateurs 6 à 8, bonus de biodiversité complet, prestige disponible | Des miroirs au loin, les rues deviennent des sous-bois |
| 4 | **Les Saisons** | après la 1ʳᵉ Saison | Écran des Saisons, statistiques de prestige | La scène change de teinte selon la saison (printemps, été, automne, hiver) |

Les phases se déclenchent sur la **Lumière totale gagnée pendant la Saison en cours** (seuils indicatifs : Phase 2 à 10 000, Phase 3 à 10 M).

**Le récit passe par le gameplay (2026-10-10).** Le Journal du quartier livré au jalon 4 a été retiré : il n'y a plus de messages narratifs. Ses temps forts sont repris ainsi :

- **Déjà portés par la scène.** Premier pot, premier panneau, premier potager, serre, ferme verticale, miroirs, canopée, arcologie : chaque bâtiment apparaît sur la carte avec son animation. « Le quartier se réveille » et « d'autres quartiers verdissent » : la caméra qui recule de phase en phase et le quartier qui reverdit avec la production. Premier Papillon doré : le papillon lui-même. Dix Jalons : l'annonce et l'écran des Jalons (§9.3). Les Saisons accomplies : la teinte de saison de la scène.
- **Pistes d'événements en jeu, plus tard.** Les voisins qui apportent des boutures et le vote du jardin partagé de la rue des Tilleuls peuvent devenir des Projets du quartier visibles sur la carte (roadmap, M6). « La terre se souvient » d'une Saison à l'autre prend corps avec les parcelles qui restent restaurées et l'Arbre des Saisons (roadmap, M6 et M7). Rien de tout cela n'est construit pour l'instant.

**Implémentation (jalon 4).** `src/game/phases.ts`.

- La scène suit la phase : le ciel passe de l'aube (phase 1) au plein midi (phase 2) puis à la fin d'après-midi (phase 3), et le nom de la phase s'affiche en légende.
- Phase 4 : à partir de la 2ᵉ Saison, la scène prend la teinte d'une saison, en commençant par le printemps puis en suivant le cycle (printemps, été, automne, hiver). La 1ʳᵉ Saison n'a pas de teinte propre. Le feuillage et le ciel changent de couleur ; rien d'autre ne change.

**Scène vue du dessus (post-MVP, 2026-10-10).** Demande d'Antoine : une progression plus visuelle, la ville au centre de l'écran, vue du dessus, où les bâtiments apparaissent avec des animations élégantes au fil des achats. `src/ui/Neighbourhood.tsx` dessine la scène, `src/ui/neighbourhood.ts` porte le plan et les règles.

- **Le plan.** Un quartier en SVG vu du dessus : trois rangées de trois îlots séparés par deux avenues et deux rues. Au centre, l'immeuble du joueur entoure une cour où pousse l'héliotrope. Au départ tout est gris : toits en béton, friches, parkings.
- **Chaque générateur a ses places.** Pots autour de la cour, panneaux sur les toits voisins, potagers qui remplacent les toits gris (du plus proche au plus lointain), serres sur les friches, fermes verticales à la place de trois tours, champ de miroirs sur le parking du sud-est, arbres le long des rues (la canopée part de la cour et gagne la ville), arcologie en rosace de terrasses sur la grande friche du nord-ouest.
- **Chaque achat se voit.** Chacun des premiers exemplaires ajoute un élément ; ensuite les éléments arrivent à des paliers de plus en plus espacés (12, 14, 16, 18, 20, 23… jusqu'à 500), pour qu'un achat tardif change encore l'image. Les arbres arrivent par bosquets de quatre et les miroirs par deux. Un nouvel élément pousse en place en 1,2 s, accompagné d'un anneau doré qui s'élargit ; ce qui existait déjà au chargement s'affiche sans animation.
- **Les améliorations aussi.** Chaque amélioration ×2 (§5.1) fait scintiller une fois tous les éléments du générateur et les enrichit : plus de pétales dans les pots, cadre doré des panneaux, tomates puis fleurs dans les potagers, serres plus nervurées puis chauffées, terrasses supplémentaires sur les fermes, miroirs dorés puis rayons vers la tour, arbres en fleurs, arcologie fleurie. Les améliorations de clic font fleurir l'héliotrope de la cour, et chaque synergie (§5.3) trace un fil doré entre les deux générateurs qu'elle relie.
- **La caméra recule par paliers.** Phase 1 : la cour et l'immeuble du joueur. Phase 2 : le quartier. Phase 3 : la ville entière. La caméra recule plus tôt si le joueur achète un générateur dont la place est hors champ, pour qu'aucun achat ne soit construit hors de vue. Le recul dure 2,8 s.
- **La lumière suit la phase.** Les ombres des bâtiments tournent et changent de longueur (aube : longues vers l'ouest ; midi : courtes ; fin d'après-midi : longues vers l'est), un voile de lumière teinte la scène, des ombres de nuages la traversent lentement. Le quartier reverdit avec la production, et les teintes de saison (phase 4) s'appliquent au feuillage et à la lumière.
- **Animations réduites.** Avec le réglage des Options ou `prefers-reduced-motion`, rien ne bouge : les éléments apparaissent directement, la caméra change de cadre sans transition, pas de scintillement.

### 6.1 Parcelles à restaurer (M6, post-MVP)

Le quartier garde des places grises qu'aucun bâtiment n'occupe : une avenue, deux rues, un parking, un entrepôt, les toits, les carrefours. Le joueur les **restaure une à une contre de la Lumière**. Une parcelle restaurée **le reste pour toujours**, d'une Saison à l'autre (décision D2 d'Antoine) : la terre se souvient, et le quartier de la Saison suivante démarre déjà plus vert. Les données sont dans `src/game/parcels.ts`, les règles dans `src/game/restoration.ts`.

| Parcelle | Place sur la carte | Phase | Coût | Effet |
|---|---|---|---|---|
| Rue jardin | L'avenue devant l'immeuble, dépavée, avec îlots fleuris et bancs | 1 | 1 500 | Clic ×2 |
| Jardins de pluie | L'avenue derrière l'immeuble : deux noues plantées de roseaux | 1 | 8 000 | Héliotropes en pot ×2, Panneaux de balcon ×1,5 |
| Corridor des pollinisateurs | La rue ouest, sur toute sa longueur : une prairie fleurie | 2 | 100 000 | Le Papillon doré revient 20 % plus vite |
| Rivière retrouvée | La rue est : la rivière enterrée coule à nouveau, sous des passerelles | 2 | 2 M | +2 h de plafond hors ligne (§9.1) |
| Parc du parking | Le parking de l'est : pelouse, étang, bosquets | 3 | 30 M | Toute la production +10 % |
| Verger de l'entrepôt | L'entrepôt du sud-ouest ouvre son toit à deux rangées d'arbres fruitiers | 3 | 300 M | Potagers ×1,5, Serres ×1,5 |
| Toits vivants | Tous les toits gris se couvrent d'orpin et de fleurs | 3 | 3 Md | Bonus de biodiversité ×2 |
| Places plantées | Les quatre carrefours autour de l'immeuble deviennent des places rondes autour d'un arbre | 3 | 30 Md | Chaque Jalon donne +2 % au lieu de +1 % |

- **Quand une parcelle est proposée.** Quand sa place est dans le cadre de la caméra (sa phase) et que la Saison en cours a récolté la moitié de son prix, comme pour les générateurs (§4). Une première Saison en restaure environ six ; les deux dernières sont des objectifs lointains pour les Saisons suivantes.
- **Sur la carte.** Une parcelle proposée est cernée d'un pointillé doré qui respire, avec une épingle en forme de pousse là où elle commencera à reverdir ; l'épingle est dorée quand on peut se l'offrir, et un clic dessus la restaure. Passer sur la parcelle dans le panneau sous la carte éclaire sa place.
- **L'animation.** La parcelle restaurée se dévoile depuis son épingle : un cercle qui s'élargit découvre le nouveau sol pendant que des pétales jaillissent, avec un anneau doré. Une parcelle déjà restaurée au chargement s'affiche sans animation.
- **Le panneau « Le quartier ».** Sous la carte, une rangée de huit pastilles montre les parcelles restaurées pour toujours, puis les quatre offres les moins chères (parcelles et projets mêlés) avec leur effet et leur prix.

### 6.2 Projets du quartier (M6, post-MVP)

Des décisions uniques du quartier qui **changent une règle** plutôt que de multiplier un chiffre : des bâtiments moins chers, un Papillon qui revient plus vite, une biodiversité qui compte plus tôt… Ils se mènent **pour la Saison en cours** et se relancent à chaque Saison, comme les améliorations. Chaque projet laisse **une trace visible sur la carte** (un stand, des guirlandes, un tram, des lanternes…) : il n'y a ni récit ni texte d'ambiance, seulement le nom du projet et son effet (règle d'Antoine : l'histoire se raconte par le jeu, la scène et les animations). Données dans `src/game/projects.ts`.

| Projet | Condition | Coût | Effet | Trace sur la carte |
|---|---|---|---|---|
| Troc de graines | 5 Héliotropes en pot | 250 | Le clic rapporte +0,2 par Héliotrope en pot | Une table de sachets dans la cour |
| Outilthèque | 5 Panneaux de balcon | 2 000 | Tous les bâtiments coûtent 10 % de moins | Une cabane dans la cour |
| Compost collectif | 5 Potagers | 20 000 | La biodiversité (§5.4) compte aussi chaque bâtiment possédé à 5 exemplaires | Trois bacs dans la cour |
| Batteries partagées | 25 Panneaux | 50 000 | Panneaux +5 % par type de bâtiment possédé | Des armoires de batteries sous les panneaux |
| Ruchers partagés | Phase 2, 1 Serre | 150 000 | Le Papillon doré revient 20 % plus vite | Deux ruches et des abeilles dans la cour |
| Fête de quartier | 10 Serres | 800 000 | La Floraison dure ×1,5 | Des guirlandes de fanions au-dessus de la cour |
| Pistes cyclables | 1 Ferme verticale, 2 parcelles restaurées | 3 M | Toute la production +2 % par parcelle restaurée | Des pistes vertes sur les avenues |
| Marché paysan | 10 Fermes verticales | 20 M | Récolte du Papillon doré ×2 | Des étals rayés sur l'avenue nord-est |
| Repair café | Phase 3 | 50 M | Tous les bâtiments coûtent encore 10 % de moins | Une terrasse de parasols |
| Eau de pluie | Rivière retrouvée, 1 Ferme verticale | 100 M | Serres et Fermes verticales ×1,25 | Des citernes près du parking |
| Jardin à papillons | Corridor des pollinisateurs, phase 3 | 200 M | La Pollinisation dure ×2 | Des buddleias le long du corridor |
| Ombrières solaires | 10 Centrales à miroirs | 500 M | Centrales +10 % par type de bâtiment possédé | Des ombrières sur l'avenue sud-ouest |
| Tram végétalisé | 10 Canopées | 2 Md | Chaque Jalon donne +0,5 % de plus | Un tram qui glisse sur une voie engazonnée |
| Assemblée de quartier | 5 parcelles restaurées, phase 3 | 10 Md | Synergies (§5.3) ×1,5 | Des gradins autour de l'héliotrope |
| Fête des lumières | 1 Arcologie | 30 Md | Toute la production +25 % | Des lanternes le long de toutes les rues |

Les effets des parcelles et des projets s'ajoutent aux formules du §8 : les multiplicateurs par générateur se multiplient aux ×2, les bonus globaux s'additionnent entre eux puis multiplient la production, les remises se multiplient (deux remises de 10 % donnent ×0,81).

### 6.3 Sons discrets (M6, post-MVP)

Le pilier « Élégant et lumineux » (§1) promettait des sons discrets. Ils sont synthétisés dans le navigateur (Web Audio, aucun fichier audio) et accordés sur une même gamme pentatonique, pour ne jamais sonner faux quand ils se superposent : une note pincée à chaque clic, qui change de hauteur d'un clic à l'autre ; un petit accord à chaque bâtiment ; un scintillement pour une amélioration ; un arpège pour une parcelle restaurée ; une cloche pour un projet ; un trille pour le Papillon doré ; deux notes pour un Jalon ; un accord lent pour une nouvelle Saison. À partir de la phase 2, des oiseaux chantent de temps en temps quand l'onglet est visible. Quand plusieurs choses arrivent ensemble, seul le son le plus rare joue. Les Options règlent le volume (50 % par défaut) et coupent le son. Code dans `src/ui/sound.ts` et `src/ui/useSounds.ts`.

---

## 7. Prestige : les Saisons

### Principe

Quand la progression ralentit, le joueur peut lancer une **Nouvelle Saison**. Thématiquement : l'hiver passe, on replante tout, mais la terre garde la mémoire de ce qui a poussé.

**Remis à zéro :** Lumière, générateurs, améliorations, projets du quartier (§6.2), phase visuelle.
**Conservé :** Graines d'Héliotrope, Jalons, parcelles restaurées (§6.1), talents de l'Arbre des Saisons et réglages des Coopératives (§7.1, §7.2), statistiques globales, options.

### Formule

```
grainesTotalesMéritées = floor( sqrt( lumièreTotaleToutesSaisons / 2e7 ) )
grainesGagnées         = grainesTotalesMéritées − grainesDéjàObtenues
bonusProduction        = +5 % par Graine possédée (additif)
```

Points de repère *(à valider)* :

| Lumière totale cumulée | Graines | Bonus |
|---|---|---|
| 20 M (2e7) | 1 | +5 % |
| 2 Md (2e9) | 10 | +50 % |
| 200 Md (2e11) | 100 | +500 % |

> Première passe d'équilibrage (jalon 2, 2026-10-10) : le diviseur passe de 1e9 à 5e7. Avec 1e9, le simulateur n'atteignait 10 Graines qu'après plus de 8 h de jeu, ce qui contredisait la cible de ~4 h du §8 alors que le rythme des générateurs, lui, tombait juste. Le diviseur est le seul réglage qui corrige cet écart sans décaler l'arrivée des générateurs.

> Équilibrage adouci (après le MVP) : le diviseur passe de 5e7 à 2e7 pour que les 10 Graines conseillées arrivent vers 2 h 40, au même rythme raccourci d'un tiers que les générateurs (§8).

- Le bouton Nouvelle Saison est disponible dès qu'on gagnerait au moins **1** Graine, mais l'interface conseille d'attendre d'en gagner au moins 10 pour la première (« La terre n'est pas encore prête »). On ne bloque pas, on conseille.
- L'écran de confirmation montre clairement : ce qui sera perdu, les Graines gagnées, le bonus avant/après.
- Cible : 1ʳᵉ Saison rentable vers **1 h 30 – 1 h 45** de jeu, puis des Saisons de plus en plus courtes pour atteindre le même point.

**Implémentation (jalon 3).** `src/game/seasons.ts`. Précisions retenues :

- Le bonus des Graines multiplie la production des générateurs (et donc la part du clic indexée sur la production, §5.2), pas la valeur de base du clic : `multiplicateurGlobal = (1 + 0,05 × graines) × (1 + bonusBiodiversité)`.
- Le conseil « La terre n'est pas encore prête » ne s'affiche que pour la première Saison, tant qu'on gagnerait moins de 10 Graines. Les Saisons suivantes ne sont jamais déconseillées.
- L'écran des Saisons apparaît dès qu'une Graine est à gagner, puis reste accessible une fois une Saison accomplie. Le bouton du menu montre les Graines à gagner.
- La Lumière totale cumulée, les clics, le temps de jeu, le nombre de Saisons et les Graines sont conservés ; la durée et la Lumière de la Saison en cours repartent de zéro. Le temps de jeu compte aussi la progression hors ligne.
- La nouvelle Saison est sauvegardée immédiatement.

### 7.1 Arbre des Saisons (M7)

Les Graines servent aussi de monnaie pour un arbre de talents permanents. Dépenser une Graine **ne réduit pas** le bonus de +5 % : le bonus dépend des Graines obtenues au total, la monnaie dépensable est un compteur séparé (`Graines à semer = Graines obtenues − Graines dépensées`). C'est le modèle de Cookie Clicker (niveau de prestige vs. puces célestes) : le joueur n'est jamais puni pour avoir dépensé. Les talents appris restent acquis d'une Saison à l'autre, et l'Arbre n'est accessible qu'avec une première Graine, donc dès la 2ᵉ Saison : la 1ʳᵉ Saison garde toutes ses décisions (décision D3).

L'arbre compte **17 talents en trois branches**. Chaque talent demande son parent (le talent d'où part sa branche), sauf le premier de chaque branche. Les effets réutilisent la forme des bonus des parcelles et des projets (§6.1, §6.2), et chacun se lie à une mécanique existante plutôt que d'ajouter un multiplicateur isolé (synergies, biodiversité, Papillon doré, Saisons, hors ligne).

| Branche | Talent | Coût | Après | Effet |
|---|---|---|---|---|
| **Racines** (production) | Mycorhizes | 1 | — | Synergies entre bâtiments ×1,25 |
| | Sous-bois | 1 | Mycorhizes | La biodiversité compte aussi chaque bâtiment à 5 exemplaires |
| | Boutures | 2 | Mycorhizes | Chaque nouvelle Saison garde 10 % de chaque bâtiment (arrondi en dessous) |
| | Sol vivant | 3 | Boutures | +5 % de production par Saison accomplie |
| | Arbre-mère | 5 | Sous-bois | +3 % de production par type de bâtiment possédé |
| **Pollinisateurs** (jeu actif) | Fleurs nectarifères | 1 | — | Clic ×2 |
| | Haies fleuries | 1 | Fleurs nectarifères | Le Papillon doré revient 15 % plus vite |
| | Longue floraison | 2 | Haies fleuries | La Floraison dure ×1,5 |
| | Grand essaim | 3 | Haies fleuries | Récolte ×2, la Pollinisation dure ×1,5 |
| | Danse des abeilles | 5 | Longue floraison | Clic ×3 |
| **Mémoire** (confort) | Les jardiniers | 1 | — | Coopérative : pots et panneaux (§7.2) |
| | Veilleurs de nuit | 1 | Les jardiniers | +4 h de plafond hors ligne |
| | Les maraîchers | 2 | Les jardiniers | Coopérative : potagers et serres |
| | Les ingénieurs du soleil | 3 | Les maraîchers | Coopérative : fermes verticales et centrales à miroirs |
| | Le conseil de quartier | 3 | Les maraîchers | Coopérative : les améliorations |
| | Les forestiers | 5 | Les ingénieurs du soleil | Coopérative : canopées et arcologies |
| | Longue mémoire | 5 | Veilleurs de nuit | +12 h de plafond hors ligne (24 h avec les Veilleurs) |

L'arbre complet coûte 44 Graines : un joueur en a 10 après sa 1ʳᵉ Saison conseillée, puis de plus en plus à chaque Saison. Les premières Graines suffisent pour un premier talent dans chaque branche et les deux premières coopératives.

**Écran.** Un écran « L'Arbre des Saisons » s'ouvre du menu dès la première Graine, avec un badge quand une Graine peut être semée, et depuis l'écran des Saisons. Il dessine l'arbre (§10.4) : le tronc sort du sol, les Racines s'étendent sous terre, les Pollinisateurs (à gauche) et la Mémoire (à droite) se partagent la ramure. Un talent appris est une fleur ouverte, un talent qu'on peut semer est un bourgeon qui respire, les autres restent des bourgeons pâles. En semant, une sève dorée monte le long de la branche puis la fleur s'ouvre ; le tronc s'épaissit et le feuillage s'étoffe à mesure que l'arbre se remplit. Aucun texte narratif : seuls le nom et l'effet de chaque talent sont écrits.

### 7.2 Coopératives (M7)

Des voisins achètent à la place du joueur : ce sont les talents de la branche Mémoire qui les font venir. Chaque coopérative s'occupe de deux bâtiments, le conseil de quartier des améliorations.

- **Ce qu'elles achètent.** Les coopératives de bâtiments choisissent ensemble, parmi leurs bâtiments déjà révélés, celui qui rembourse le plus vite son prix (`coût / gain de production d'un exemplaire`). Si c'est aussi une bonne affaire comparé à tous les bâtiments révélés (au plus 1,25 fois moins rentable que le meilleur), elles l'achètent dès qu'elles peuvent ; sinon le joueur économise sans doute pour mieux, et elles ne l'achètent qu'avec au plus 10 % de la réserve. Le conseil achète l'amélioration la moins chère, et les autres attendent qu'il l'ait achetée tant qu'elle ne coûte pas plus de 30 fois leur prochain bâtiment.
- **Réglages.** Chaque coopérative peut être mise à l'arrêt, et l'option « Garder une réserve » limite chaque achat à 10 % de la Lumière en réserve. Les réglages restent d'une Saison à l'autre.
- **Temps.** Elles achètent à chaque pas de simulation, en ligne comme hors ligne (par tranches de 60 s, §9.1) : seule la Lumière disponible compte, jamais un nombre de pas.
- **Elles ne sont pas le joueur.** Leurs achats ne remettent pas à zéro le temps sans achat du Jalon caché « Photosynthèse lente » (§9.3).
- **Panneau.** Un panneau « Coopératives » sous les bâtiments liste celles qui sont venues, ce qu'elles achètent, leur nombre d'achats et un interrupteur « En marche / À l'arrêt ». Sur mobile, il est dans l'onglet Améliorer.
- **Sur la carte.** Chaque coopérative est un vélo-cargo à sa couleur qui fait sa tournée dans les rues du quartier tant qu'elle travaille ; à chaque achat, un anneau doré part du vélo, et le bâtiment acheté apparaît sur la carte comme d'habitude. Une coopérative à l'arrêt gare son vélo. Avec les animations réduites (option ou réglage de l'appareil), les vélos restent garés.

---

## 8. Équilibrage

### Formules de référence

```
productionGlobale/s = Σ_types( prodBase × possédés × multTypes )
                      × (1 + 0,05 × graines)
                      × (1 + bonusGlobauxParcellesEtProjets)   // §6.1, §6.2
                      × (1 + 0,01 × jalons)
                      × (1 + bonusBiodiversité)
                      × (1 + bonusSynergiesAméliorations)   // §5.3, entre améliorations
                      × multÉvénement            // Floraison du Papillon doré : ×3
coût(n)             = coûtBase × remises × 1,15^n      // remises des projets, §6.2
valeurClic          = (1 × multClic + pctClic × productionGlobale/s)
                      × multPollinisation         // Papillon doré : ×100
```

### Courbes et intentions

- **Coût exponentiel, production linéaire par générateur** : chaque générateur finit par devenir cher à empiler, ce qui pousse vers le palier suivant puis vers les améliorations, puis vers le prestige.
- **Les améliorations ×2 compensent la croissance des coûts** par paliers : elles créent des « marches » de progression qu'on sent.
- **Le prestige compense le mur final.** Avec `sqrt`, gagner 10× plus de Graines demande 100× plus de Lumière : les Saisons longues restent rentables, mais le retour diminue, ce qui pousse à relancer régulièrement.

### Rythme cible (1ʳᵉ partie, joueur actif)

| Événement | Moment cible |
|---|---|
| 1ᵉʳ Héliotrope en pot | < 15 s |
| 1ᵉʳ Panneau de balcon | ~35 s |
| 1ᵉʳ Potager sur le toit | ~1 min 30 |
| 1ʳᵉ Serre communautaire | ~5 min 30 |
| 1ʳᵉ Ferme verticale | ~12 min |
| 1ʳᵉ Centrale à miroirs | ~26 min |
| 1ʳᵉ Canopée urbaine | ~50 min |
| 1ʳᵉ Arcologie vivante | ~1 h 20 |
| 1ʳᵉ Saison conseillée (10 Graines) | ~1 h 40 |

Depuis l'équilibrage adouci (après le MVP), ces cibles sont environ un tiers plus courtes qu'au MVP (qui visait 4 h pour la 1ʳᵉ Saison), et l'écart entre deux paliers grandit doucement (×3 au début, ×2 au milieu, puis moins) au lieu de laisser un long creux avant les derniers bâtiments. Les synergies (§5.3) raccourcissent ensuite surtout la fin de la 1ʳᵉ Saison : la Saison conseillée passe de ~2 h 40 à ~2 h 15, sans toucher au début de partie. Les améliorations de clic précoces (§5.2) accélèrent ensuite surtout le début : le Potager arrive vers 1 min 30 au lieu de 2 min 40. Avec les parcelles et les projets du jalon 6 (§6.1, §6.2), qui accélèrent la seconde moitié, la Saison conseillée arrive vers 1 h 30 – 1 h 40.

### Outil de simulation

L'équilibrage doit être vérifié par un **simulateur sans interface** qui rejoue une stratégie simple (acheter à chaque instant l'option au meilleur ratio coût / gain de production) et sort le moment de chaque événement du tableau ci-dessus. Il réutilise exactement les mêmes fonctions de calcul et les mêmes données que le jeu. Tout changement de chiffre dans ce document devrait être accompagné d'une sortie du simulateur.

**Implémentation (jalon 2).** `src/game/simulator.ts`, lancé par `npm run simulate`, et vérifié par un test qui échoue si un événement sort de ±30 % de sa cible (le 1ᵉʳ Héliotrope en pot n'a qu'un plafond de 15 s). Depuis le jalon 3, il joue aussi une **seconde Saison** : il lance la Nouvelle Saison dès les 10 Graines conseillées, rejoue la même stratégie avec le bonus de +50 %, et un test vérifie que chaque événement arrive plus tôt que dans la première Saison (critère de fin du jalon 3, §12). Le joueur de référence clique **2,5 fois par seconde**. À chaque décision, il choisit l'option qui minimise *attente pour se l'offrir + coût / gain de production* (gain mesuré clic compris), et il essaie chaque nouveau générateur dès qu'il peut se l'offrir. Depuis le jalon 4, les Jalons se débloquent pendant la simulation comme en jeu, et le joueur de référence **attrape chaque Papillon doré** dès qu'il apparaît (tirages aléatoires reproductibles, graine fixe). Le résultat dépend un peu de la graine, surtout en milieu de partie où un Papillon tombe plus ou moins tôt (chiffres sous le tableau ci-dessous).

Sortie actuelle (améliorations de clic, parcelles et projets) :

| Événement | Cible | Simulé, 1ʳᵉ Saison | Écart | Simulé, 2ᵉ Saison (10 Graines) |
|---|---|---|---|---|
| 1ᵉʳ Héliotrope en pot | < 15 s | 10 s | ok | 3 s |
| 1ᵉʳ Panneau de balcon | ~35 s | 31,5 s | −10 % | 15,4 s |
| 1ᵉʳ Potager sur le toit | ~1 min 30 | 1,5 min | 0 % | 47 s |
| 1ʳᵉ Serre communautaire | ~5 min 30 | 5,7 min | +3 % | 3,0 min |
| 1ʳᵉ Ferme verticale | ~12 min | 11,6 min | −3 % | 6,7 min |
| 1ʳᵉ Centrale à miroirs | ~26 min | 23,1 min | −11 % | 15,2 min |
| 1ʳᵉ Canopée urbaine | ~50 min | 44 min | −12 % | 27 min |
| 1ʳᵉ Arcologie vivante | ~1 h 20 | 1 h 11 | −11 % | 41 min |
| Saison conseillée (2 Md de Lumière dans la Saison) | ~1 h 40 | 1 h 28 | −12 % | 52 min |

Le joueur simulé atteint 20 Jalons, attrape 17 Papillons, achète 39 améliorations (dont 8 de clic, 6 synergies entre bâtiments, 3 avec le clic et 2 entre améliorations), restaure 5 parcelles et mène 5 projets pendant sa 1ʳᵉ Saison. Sur six graines de hasard, chaque événement reste entre −14 % et +9 % de sa cible. La 2ᵉ Saison, qui garde les parcelles, atteint les mêmes paliers environ 40 % plus vite. Les tout premiers achats, portés par le clic que les Graines n'augmentent pas, n'accélèrent que peu.

> Restaurer le quartier (M6) : le joueur de référence considère aussi les parcelles et les projets, avec la même règle (attente + coût / gain de revenu). Ceux dont l'effet ne touche pas le revenu (Papillon, plafond hors ligne, remises) ne lui rapportent rien de mesurable et ne sont achetés que lorsqu'un autre effet les rend rentables (les Pistes cyclables, par exemple, donnent du prix à chaque parcelle). Dans sa 1ʳᵉ Saison, il restaure cinq parcelles et mène cinq projets, et le rythme s'accélère encore : Ferme verticale à 15,0 min (0 %), Centrale à 31,6 min (−10 %), Canopée à 55,2 min (−15 %), Arcologie à 1 h 28 (−16 %), Saison conseillée à 1 h 46 (−21 %, la marge la plus faible). Les effets ont été réduits pour rester dans les ±30 % (Batteries partagées +5 % par type au lieu de +25 %, Verger ×1,5 au lieu de ×2, Eau de pluie ×1,25, Pistes cyclables +2 % par parcelle). Comme les parcelles restent acquises, la 2ᵉ Saison est bien plus rapide : Saison conseillée en 1 h au lieu de 1 h 22.

> La terre se souvient (M7) : la 1ʳᵉ Saison ne change pas (pas encore de Graine à semer). Au début de la 2ᵉ, le joueur de référence sème ses 10 Graines dans cet ordre, tant qu'elles suffisent : les jardiniers, Fleurs nectarifères, Mycorhizes, les maraîchers, Haies fleuries, Boutures, Sous-bois, Veilleurs de nuit (ordre complet dans `REFERENCE_TALENTS`). Les deux coopératives achètent pour lui pendant qu'il joue sa stratégie habituelle (environ 45 et 95 achats). Sa 2ᵉ Saison conseillée passe de 52 min à 43 min (Arcologie à 36 min au lieu de 41), sans toucher aux cibles de la 1ʳᵉ.

### Affichage des nombres

- Jusqu'à 999 999 : chiffres complets avec séparateur de milliers (« 12 345 »).
- Au-delà : suffixes courts de l'échelle longue avec 3 chiffres significatifs (« 1,23 M », « 45,6 Md », « 7,89 Bn »…) : M (million, 1e6), Md (milliard), Bn (billion), Bd (billiard), Tn (trillion), Td (trilliard), Qn (quadrillion), Qd (quadrilliard, 1e27), puis notation scientifique (« 1,23e30 ») au-delà du dernier suffixe.
- Option pour forcer la notation scientifique partout.
- En anglais (M8, §14 Q1) : mêmes règles avec le point décimal, la virgule comme séparateur de milliers et les suffixes de l'échelle courte (« 12,345 », « 1.23 M », « 45.6 B », « 7.89 T » ; puis Qa, Qi, Sx, Sp, Oc).

---

## 9. Systèmes annexes

### 9.1 Progression hors ligne

- Au retour, le jeu calcule la production pendant l'absence à **100 %** de la production/s au moment du départ, **plafonnée à 8 h** *(à valider)*, ou 10 h une fois la Rivière retrouvée (§6.1).
- Une fenêtre « Pendant ton absence… » résume le gain.
- Les événements temporaires (Papillon doré) ne comptent pas hors ligne.

### 9.2 Papillon doré

Un papillon traverse l'écran à intervalle aléatoire (**toutes les 3 à 8 min**), reste cliquable **12 s**. Le cliquer donne un effet au hasard :

| Probabilité | Effet | Détail |
|---|---|---|
| 50 % | **Floraison** | Production ×7 pendant 60 s |
| 40 % | **Récolte** | Gain immédiat = min(15 % de la Lumière en réserve, 15 min de production) |
| 10 % | **Pollinisation** | Valeur de clic ×100 pendant 10 s |

C'est la principale raison de garder l'onglet ouvert et de jouer activement, sans être obligatoire.

> Jalon 4 : la Floraison passe de ×7 à ×3. À ×7, le simulateur arrivait à la Centrale à miroirs en 27 min au lieu d'une heure, même avec des générateurs plus chers (voir §4 et §8).

**Implémentation (jalon 4).** `src/game/butterfly.ts`. Précisions retenues :

- Le papillon vient à partir de la **phase 2** (Le Quartier, §6), comme prévu au tableau des phases.
- Le hasard vient d'un générateur pseudo-aléatoire dont la graine est dans la sauvegarde : chaque transition reste une fonction pure, testable et reproductible, et recharger la page ne permet pas de retirer un effet.
- Attraper le même effet pendant qu'il dure le relance pour sa durée complète, sans cumul.
- Hors ligne, le papillon et les effets en cours sont **mis en pause** : ils ne produisent rien pendant l'absence et reprennent où ils en étaient au retour.
- Avec les animations réduites, le papillon attend immobile au lieu de traverser la scène.

### 9.3 Jalons (succès)

Environ 40 jalons dans le MVP, chacun donnant **+1 % de production globale**. Familles :

- Lumière totale gagnée (1 000, 1 M, 1 Md…)
- Nombre de chaque générateur possédé (1, 50, 100)
- Clics (100, 1 000, 10 000)
- Papillons attrapés (1, 10, 50)
- Saisons accomplies (1, 5, 10)
- Quelques jalons cachés amusants (ex. « Photosynthèse lente » : ne rien acheter pendant 10 min)

**Implémentation (jalon 4).** `src/game/achievements.ts`, 43 jalons au départ.

**Plus de jalons (post-M7, 2026-10-10).** Demande d'Antoine : renforcer le sentiment de progression avec des jalons créatifs ou liés à des actions et des événements du jeu. On passe à **92 jalons**, toujours **+1 % chacun** (le simulateur reste dans les cibles du §8 : 1ʳᵉ Saison conseillée à 83 min au lieu de 88, ratio 0,83 ; 2ᵉ Saison 39 min au lieu de 43). L'écran les range par famille, avec le compte de chacune :

- **Lumière** : récolter 1 000, 1 M, 1 Md, 1 Bn, 1 Bd, 1 Tn, 1 Td, 1 Qn Lumière au total (8) ; produire 1 000, 1 M, 1 Md Lumière par seconde (3).
- **Bâtiments** : 1, 50, 100 et 200 exemplaires de chacun des 8 générateurs, dans la Saison en cours (32) ; « Mosaïque » (10 de chaque), « Courtepointe » (50 de chaque) ; cachés : « Jardin sauvage » (100 de chaque), « Tout dans le même pot » (50 Héliotropes en pot et aucun autre bâtiment).
- **Améliorations** (dans une même Saison) : 10, 25, 50, 75 améliorations ; « Fil doré » (une première synergie entre bâtiments), « Toile dorée » (les 18 synergies entre bâtiments), « Mains d'or » (les 10 améliorations du clic).
- **La fleur** : 10, 100, 1 000, 10 000, 100 000 clics ; un clic qui vaut 1 000 puis 1 M Lumière ; caché : « Graine qui dort » (récolter 1 000 Lumière dans une Saison sans aucun bâtiment).
- **Papillon doré** : 1, 10, 25, 50, 100 papillons ; « Pollen d'or » (cliquer la fleur pendant une Pollinisation) ; caché : « De justesse » (attraper le papillon dans ses 2 dernières secondes).
- **Le quartier** : 1, 4, 8 parcelles restaurées ; 1, 8, 15 projets dans une même Saison ; 1, 9, 17 talents de l'Arbre des Saisons ; 100 et 1 000 achats des coopératives.
- **Saisons** : 1, 3, 5, 10, 25 Saisons ; 1 h et 24 h de jeu ; « Saison éclair » (la Lumière de 10 Graines en moins de 30 min de Saison) ; « Longue saison » (4 h dans la même Saison) ; « Moisson tardive » (gagner 50 Graines d'un coup) ; cachés : « Photosynthèse lente » (10 min sans rien acheter, avec au moins un bâtiment), « Semis précoce » (lancer une Saison avant les 10 Graines conseillées).

Les jalons sont conservés d'une Saison à l'autre. Chaque jalon atteint **éclot** en haut de l'écran : un médaillon dont l'anneau doré se dessine, une couronne de laurier qui pousse feuille à feuille, des pétales lilas qui s'ouvrent, avec le nom du jalon, sa condition et « Production +1 % » ; il s'efface après environ 4 s. Plusieurs jalons atteints ensemble éclosent l'un après l'autre (au-delà de trois d'un coup, un seul médaillon les compte). Le compteur du bouton « Jalons » scintille à chaque nouveau jalon. Pas de texte d'ambiance : seulement le nom et la condition. Avec les animations réduites, le médaillon apparaît et disparaît sans mouvement. Les lecteurs d'écran entendent « Jalon atteint : nom ».

**Pistes pour M8 (Herbier, Saisons à défis).** À brancher quand ces systèmes existeront : espèces de l'Herbier découvertes (1, 10, toutes), une Saison à défi réussie, toutes les Saisons à défis réussies.

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
│               │                             │ ░░ ??? ░░  1,4 M    │
└───────────────┴─────────────────────────────┴─────────────────────┘
```

- **Gauche :** l'héliotrope cliquable (petite animation et nombre flottant à chaque clic), valeur du clic.
- **Centre :** la scène du quartier vue du dessus (§6), plus large que les deux colonnes latérales depuis 2026-10-10 : c'est la pièce maîtresse de l'écran. Le Papillon doré la traverse.
- **Droite :** améliorations disponibles (icônes avec infobulle) puis liste des générateurs (nom, quantité, prix, production, infobulle avec le détail des multiplicateurs).
- **Haut :** compteur de Lumière, production/s, menu.

### 10.2 Autres écrans (onglets ou panneaux)

| Écran | Contenu | Dès |
|---|---|---|
| **Jalons** | Grille des succès, débloqués en couleur, cachés en « ? » | Phase 2 |
| **Saisons** | Graines actuelles, Graines à gagner, bonus avant/après, bouton Nouvelle Saison avec confirmation | Prestige disponible |
| **Arbre des Saisons** | L'arbre de talents dessiné, Graines à semer, détail et bouton Semer du talent choisi (§7.1) | 1ʳᵉ Graine |
| **Statistiques** | Lumière totale (saison / toutes), clics, temps de jeu, papillons, saisons | Toujours |
| **Options** | Langue (français ou anglais), notation des nombres, animations réduites, volume et son coupé, sauvegarde manuelle, export / import, remise à zéro | Toujours |
| **Retour hors ligne** | Fenêtre modale du gain d'absence | Au chargement |

Les Options proposent aussi de réduire les animations, en plus du réglage `prefers-reduced-motion` de l'appareil (§10.4), et, depuis M6, de régler le volume des sons ou de les couper (§6.3).

### 10.3 Mobile

Même contenu, une colonne : compteur en haut, fleur + scène au centre, barre d'onglets en bas (Récolte / Bâtir / Améliorer / Plus). Les cibles tactiles font au moins 44 px. *Livré au jalon 4 : « Plus » rassemble les Jalons, les Saisons, les Statistiques et les Options.*

### 10.4 Direction artistique

**Intention (décidée par Antoine, 2026-10-10) :** élégant et très moderne, dans un esprit solarpunk ensoleillé, avec une touche florale et naturelle légère. On vise l'interface d'un bel objet design, pas un jeu « cartoon » : beaucoup d'air, des lignes fines, de la lumière dorée.

**Mots-clés.** Lumière de fin d'après-midi · verre dépoli · lignes botaniques fines · arches et courbes inspirées de l'Art nouveau · sobriété.

**Typographie.**

- **Titres et noms (générateurs, Saisons, Jalons) : [Fraunces](https://fonts.google.com/specimen/Fraunces)**, serif variable aux formes douces et organiques ; réglée avec un peu de « SOFT » pour un côté floral sans être fantaisiste.
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

**La fleur grandit (2026-10-10).** Demande d'Antoine : une fleur cliquable plus travaillée, qui évolue avec la progression. Elle pousse dans un pot en terre cuite sous l'arche, et passe par sept stades selon la Lumière gagnée pendant la Saison en cours (`src/ui/flower.ts`) :

| Stade | Lumière de la Saison | La fleur montre |
|---|---|---|
| 0 Pousse | 0 | Deux cotylédons et un bourgeon vert |
| 1 Bouton | 100 | Une tige, une paire de feuilles, une tête de boutons violets |
| 2 Premières fleurs | 2 000 | Le cœur de la tête s'ouvre, les boutons restent au bord |
| 3 Floraison | 10 000 (phase 2) | Une tête pleine, trois paires de feuilles nervurées |
| 4 Bouquet | 1 M | Une tête latérale sur une ramification |
| 5 Couronne | 10 M (phase 3) | Deux têtes latérales, du pollen doré flotte |
| 6 Héliotrope solaire | 1 Md | Toutes les fleurs ouvertes, cœurs dorés, rayons qui tournent lentement |

Les têtes sont des dômes de fleurettes à cinq lobes, disposées selon l'angle d'or, ouvertes du centre vers le bord comme les vraies cymes d'héliotrope. Le halo grandit et se teinte selon la saison visuelle. Chaque amélioration de clic (§5.2) dore un rameau sur l'arche, et chaque Saison accomplie laisse une graine dorée sur le bord du pot (jusqu'à six). Une Nouvelle Saison replante la fleur : elle repart en pousse. Au passage d'un stade, la plante s'étire et s'illumine une fois ; à chaque clic, les fleurettes s'ouvrent un peu plus ; au repos, la plante se balance très lentement. Aucun texte n'annonce les stades : seule l'image raconte.

**Détails de la scène (2026-10-10).** Les bâtiments montrent leur façade sud (une bande de fenêtres dont la hauteur suit le nombre d'étages) et un toit éclairé du côté du soleil, avec ses équipements (verrières, citernes, climatiseurs). Les rues ont trottoirs et passages piétons, l'asphalte un léger grain, la cour un dallage. Les parkings ont des voitures aux teintes éteintes, les friches des fissures, des gravats et des herbes folles. Les arbres alternent trois essences (tilleul, platane, cerisier en fleur) à houppier lobé, avec une ombre qui suit le soleil. Quand le quartier reverdit, des touffes d'herbe et de petites fleurs gagnent les îlots.

**Accessibilité.** Contraste AA sur tout le texte (l'or et le lilas servent d'accents, pas de couleur de texte sur fond clair), animations réduites si `prefers-reduced-motion`, aucune information portée par la couleur seule.

---

## 11. Contraintes pour l'implémentation

Ces points ne choisissent pas la technique (c'est le rôle du fil de mise en place), mais en découlent directement du design :

- **Contenu piloté par les données.** Générateurs, améliorations et jalons sont décrits dans des fichiers de données, pas codés en dur. Ajouter un générateur ne doit pas demander de toucher la logique.
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

*Livré (jalon 3) : Graines, écran des Saisons avec conseil et confirmation, écran Statistiques, sauvegarde v4 ; le simulateur vérifie le critère de fin.*

### M4 — Vie et finitions

- Jalons (succès) et leur bonus.
- Papillon doré.
- ~~Journal du quartier~~ (retiré le 2026-10-10, voir §6).
- Scène centrale évolutive par phase, saisons visuelles.
- Mise en page mobile, accessibilité, écran Options complet.

**Critère de fin :** le jeu est présentable à des joueurs extérieurs.

*Livré (jalon 4) : 43 Jalons et leur écran, Papillon doré, Journal du quartier (retiré depuis, §6), ciel par phase et teintes de saison, barre d'onglets mobile, options d'affichage, fenêtres accessibles au clavier, sauvegarde v5 ; nouvelle passe d'équilibrage (§4, §8, §9.2).*

**Le MVP = M1 à M4.**

---

## 13. Au-delà du MVP

Idées à reprendre quand le MVP est stable, par ordre de priorité proposé :

1. ~~**Carte du quartier.**~~ *Livré en M6 (§6.1).* Une grille de parcelles grises (friches, parkings, toits nus) à restaurer contre de la Lumière. Chaque parcelle restaurée apporte un bonus ciblé (un parc : +clic ; une rivière dépolluée : +1 h de plafond hors ligne ; un verger : +% à un générateur). Rend la restauration du monde concrète et visuelle.
2. ~~**Arbre des Saisons** (§7) : talents permanents achetés avec les Graines.~~ *Livré en M7 (§7.1), avec les Coopératives (§7.2).*
3. **Cycle jour / nuit et batteries.** La production solaire varie au fil d'une journée de jeu ; des batteries stockent le surplus. À tester avec prudence : ne doit jamais punir le joueur absent.
4. **Deuxième couche : la Biorégion.** Nouvelle ressource (Eau ou Biodiversité), nouveaux générateurs, deuxième niveau de prestige.
5. **Défis de Saison.** Saisons à contraintes (« sans Panneaux », « clic seulement ») qui donnent des récompenses uniques.
6. ~~**Sons discrets** (§1) et leur réglage de volume dans les Options.~~ *Livré en M6 (§6.3).*

---

## 14. Questions ouvertes

Décisions qui appartiennent à Antoine. En attendant sa réponse, le document applique le choix recommandé.

| # | Question | Choix recommandé (appliqué par défaut) |
|---|---|---|
| Q1 | Langue de l'interface du jeu ? | Français d'abord. *Livré en M8 :* version anglaise complète, choisie dans les Options (le français reste la langue par défaut). Tous les textes sont dans `src/i18n/` (`fr.ts` fait référence, `en.ts` a la même forme). |
| Q2 | Plateforme visée ? | Navigateur, bureau d'abord, mais jouable sur mobile (responsive) |
| Q3 | Production hors ligne : 100 % plafonnée à 8 h ? | Oui |
| Q4 | La Carte du quartier dans le MVP ou après ? | Après le MVP : livrée en M6 (parcelles, §6.1) |
| Q5 | ~~Style graphique ?~~ | **Décidé :** élégant, très moderne, solarpunk ensoleillé et légèrement floral (voir §10.4) |
| Q6 | Monétisation ? | Aucune : jeu gratuit, sans pub |
| Q7 | ~~Récit : simple ambiance (Journal) ou vraie histoire avec personnages ?~~ | **Décidé (2026-10-10) :** ni l'un ni l'autre. Pas de journal ni de texte narratif : l'histoire est racontée uniquement par le gameplay (scène, animations, événements en jeu), voir §1 et §6 |
