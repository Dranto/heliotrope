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
| **Eau** 💧 *(M9)* | Deuxième ressource, étend les sites de la biorégion (§7.4) | Collecteurs d'eau, dès la 3ᵉ Saison | Non, seulement au Cycle de l'eau |
| **Sources** *(M9)* | Deuxième monnaie de prestige, bonus permanent | Nouveau Cycle de l'eau (§7.4) | Jamais |

Le MVP se limite volontairement à **une seule monnaie de jeu** (la Lumière). La deuxième couche, l'**Eau** de la Biorégion, arrive avec M9 (§7.4), une fois la boucle des Saisons riche.

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

Condition : 10 exemplaires de chacun des deux générateurs, ou 5 quand l'un des deux fait partie des trois derniers (Centrale, Canopée, Arcologie), plus rares. Coût : 2 000 × le coût de base du plus cher des deux, 100 × quand le plus cher est la Ferme verticale (son coût de base fait un bond ×33), et 10 × quand c'est l'un des trois derniers, pour qu'elles se rentabilisent en une vingtaine à une quarantaine de minutes, comme un bâtiment, au moment où elles apparaissent. Celles de la Canopée et de l'Arcologie arrivent surtout après le premier prestige, ce qui laisse quelque chose à découvrir après le premier prestige.

> Peaufinage (2026-10-13) : mesurées dans le simulateur, 12 des 18 synergies entre bâtiments et Les communs n'étaient jamais achetées pendant la 1ʳᵉ Saison (11 pendant la 2ᵉ). À 36 min de 1ʳᵉ Saison, Lumière réfléchie, Chaleur récupérée ou Tours à semis demandaient 4 h 30 à 23 h de production pour se rembourser, contre 25 à 30 min pour un bâtiment : elles restaient grisées dans le panneau, et la 1ʳᵉ Saison passait 9 min (de 39 à 48 min) sans rien de nouveau à acheter. Elles coûtent maintenant 10 fois moins (Tours à semis et Étages pépinière 20 fois moins). Le joueur de référence achète Tours à semis et Étages pépinière vers 32 min, les synergies de la Centrale entre 45 et 55 min ; le plus long moment sans nouveauté de la 1ʳᵉ Saison passe de 9 min à 4 min. Comme Antoine préfère adoucir par les synergies, la 1ʳᵉ Saison conseillée passe de 66 à 59 min et le 1ᵉʳ Cycle de 2 h 39 à 2 h 08, dans les ±30 % de leurs cibles ; la Saison sobre, où ces synergies comptent double, demande 3 Md au lieu de 2 Md pour rester au-delà de 20 min.

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

### 5.5 Les bâtiments qui grandissent (M26)

Roadmap P25. Chaque bâtiment prend **trois formes** à **50, 100 et 200 exemplaires** possédés dans la Saison, et à chacune le joueur **choisit une voie** parmi deux. Les deux voies se valent : l'une renforce souvent le bâtiment lui-même, l'autre le relie à un autre système. Code dans `src/game/growth.ts`, choix dans le panneau Bâtir (`src/ui/Generators.tsx`), marques sur la carte dans `src/ui/GrowthArt.tsx`.

| Bâtiment | 50 exemplaires | 100 exemplaires | 200 exemplaires |
|---|---|---|---|
| Héliotrope en pot | Jardinière fleurie : clic +0,25 par pot · ou le Potager sur le toit +0,25 % par pot | Mur de pots : pots ×1,5 · ou le potager de la cour pousse ×1,15 plus vite | Cascade de pots : pots +5 % par espèce de l'Herbier · ou la jauge de pollen (§5.6) se remplit ×1,25 plus vite |
| Panneau de balcon | Pergola solaire : clic +1 par panneau · ou la Serre +0,25 % par panneau | Treille photovoltaïque : panneaux ×1,5 · ou la Floraison dure ×1,25 | Façade solaire : panneaux ×1,5 · ou panneaux +5 % par parcelle restaurée |
| Potager sur le toit | Potager en terrasses : le potager de la cour pousse ×1,15 plus vite · ou potagers +4 % par parcelle | Toit nourricier : potagers ×1,5 · ou la Ferme verticale +0,2 % par potager | Jardin suspendu : Récolte du Papillon ×1,5 · ou potagers +2,5 % par espèce |
| Serre communautaire | Serre à étages : serres ×1,25 · ou le Potager sur le toit +0,5 % par serre | Jardin d'hiver : le potager pousse ×1,2 plus vite · ou serres +2,5 % par espèce | Palais de verre : serres ×1,5 · ou toute la production +2 % |
| Ferme verticale | Tour maraîchère : fermes ×1,25 · ou clic +25 par ferme | Ferme-cathédrale : la Centrale +0,25 % par ferme · ou fermes ×1,4 | Ferme-forêt : fermes ×1,5 · ou biodiversité ×1,05 |
| Centrale à miroirs | Miroirs-tournesols : la Floraison dure ×1,25 · ou l'Eau ×1,15 | Couronne de miroirs : centrales ×1,5 · ou le Papillon revient 10 % plus vite | Soleil captif : centrales ×1,5 · ou la Canopée urbaine +0,5 % par centrale |
| Canopée urbaine | Allée ombragée : canopées ×1,25 · ou les visites reviennent 10 % plus vite | Forêt urbaine : canopées +1 % par espèce · ou biodiversité ×1,05 | Canopée continue : canopées ×1,5 · ou +1 h de plafond hors ligne |
| Arcologie vivante | Arcologie fleurie : arcologies ×1,25 · ou bâtiments 5 % moins chers | Arcologie-jardin : arcologies +1 % par espèce · ou toute la production +3 % | Arcologie-monde : arcologies ×1,5 · ou +1 % de production par type de bâtiment |

Les liens entre bâtiments (« +0,25 % par pot ») s'ajoutent aux synergies du §5.3 et suivent leurs multiplicateurs.

- **Choisir.** Sous chaque bâtiment, trois pastilles montrent ses formes : vide avant le seuil, pleine une fois atteint, dorée pour la première voie, lilas pour la seconde. Un seuil atteint sans voie fait respirer sa pastille et ouvre seul le choix : deux boutons, chacun avec son effet. Le panneau replié porte alors son point doré (§10.7). Une voie se choisit aussi **à l'avance**, avant son seuil : elle jouera dès qu'il sera atteint.
- **Changer (décision D18).** Une voie pas encore atteinte se change librement. Une voie qui joue se change **une fois par bâtiment et par Saison**. Les voies restent d'une Saison, d'un Cycle et d'une ville à l'autre ; comme les bâtiments recommencent à chaque Saison, chaque forme se regagne.
- **Sur la carte.** Chaque forme atteinte avec sa voie couronne les premières places du bâtiment (les pots du coin de la cour, les panneaux des toits, les premières serres et fermes, la tour des miroirs, les premiers arbres, l'arcologie) : une couronne de feuilles aux baies de la couleur de la voie, puis une fleur, puis un halo qui respire (immobile avec les animations réduites). Dessinées en SVG par-dessus les deux rendus.
- **Simulateur.** Le joueur de référence prend la première voie partout, choisie à l'avance (`withReferencePaths`). La 1ʳᵉ Saison conseillée passe de 74 à 72 min (cible 80 min), la Centrale à miroirs de 23 à 22 min : un adoucissement par synergies, comme voulu (§5.3). Les voies restent modestes (×1,25 à ×1,5) parce qu'elles jouent dans toutes les Saisons suivantes : deux fois plus fortes, elles faisaient tenir le 2ᵉ Cycle en 2 Saisons au lieu de 3 (24 min pour une cible de 35). Avec ces valeurs, ses Sources atteignent 7,4 sur 8 au bout de 2 Saisons avec la première voie partout, 7,9 avec la seconde. Le simulateur compte aussi le premier exemplaire acheté par une Coopérative (§7.2).
- **Jalons (2).** « Première voie » (une voie qui joue), « La ville aux mille formes » (12 voies qui jouent). 142 jalons en tout.
- **Sauvegarde.** Version 27 : les voies et la Saison du dernier changement de chaque bâtiment, vides pour une sauvegarde plus ancienne.

### 5.6 Le pollen (M27)

Roadmap P26. Le clic redevient un geste tout au long de la partie. Code dans `src/game/pollen.ts`, jauge dans `src/ui/Flower.tsx`, vague sur la carte dans `src/ui/PollenWave.tsx`.

- **La jauge.** Elle rejoint la fleur avec la première amélioration de clic (§10.8). Chaque clic sur la fleur remplit d'1/200 un arc doré autour de sa couronne ; chaque amélioration de clic achetée dans la Saison le remplit 5 % plus vite, et la seconde voie de la Cascade de pots (§5.5) ×1,25. Sans clic, la jauge redescend de 0,4 % par seconde (une jauge pleine se vide en un peu plus de 4 min) ; elle ne retire jamais rien d'autre. Elle reste d'une Saison à l'autre.
- **L'envolée.** Pleine, la jauge repart de zéro et lance une **envolée** : un anneau doré et des grains de pollen partent de la cour et traversent la carte, et **toute la ville produit ×1,5 pendant 10 s**. Deux envolées de suite ajoutent leurs secondes, jusqu'à 60 s. L'effet s'affiche avec les autres effets en cours.
- **Synergies.** Une envolée fait avancer chaque culture du potager de la cour (§9.7) d'une minute de pousse. Un Papillon doré attrapé pendant une envolée (§9.2) donne une Floraison, une Pollinisation ou une Averse qui dure ×1,5.
- **Rythme.** À 2,5 clics par seconde, et avec la jauge qui redescend pendant qu'on clique, une envolée toutes les 2 min environ en début de partie, un peu plus d'une par minute avec les dix améliorations de clic. La roadmap visait 2 à 3 envolées par minute à ×2 pendant 20 s : mesuré, cela raccourcissait la 1ʳᵉ Saison conseillée de 72 à 54 min, sous la marge de ±30 %. Avec ces valeurs, elle passe de 72 à 66 min (cible 80 min) et toutes les cibles du §8 tiennent. Le joueur qui ne clique pas ne perd rien.
- **Simulateur.** Les clics groupés du joueur de référence remplissent la jauge comme des clics un à un (`pollinate`).
- **Animations réduites.** Sans anneau ni grains : la cour garde seulement une lueur dorée pendant l'envolée.
- **Accessibilité.** La jauge est un `meter` lu par les lecteurs d'écran (« Jauge de pollen : 40 % »).
- **Jalons (2).** « Première envolée » (une envolée), « Tempête de pollen » (100 envolées), famille Clics. 144 jalons en tout.
- **Sauvegarde.** Version 28 : la jauge et le nombre d'envolées, vides pour une sauvegarde plus ancienne.

### 5.7 Les moments qui s'enchaînent (M31)

Roadmap P30, décision D23 : le bouquet est un bonus de production. Le clic, le Papillon doré, l'envolée et les visites deviennent une seule famille de moments qui se renforcent. Code dans `src/game/effects.ts` (bouquet), `src/game/butterfly.ts` (chances selon le temps) et `src/game/pollen.ts`, pétales dans `src/ui/Flower.tsx`, reflets des voies dans `src/ui/GrowthArt.tsx`.

- **Le bouquet.** Chaque sorte d'effet en cours au-delà de la première (Floraison, Pollinisation, Averse d'été, Nuée, haricots, transhumance, fête des récoltes, lucioles, brocante, envolée) ajoute **+10 % à toute la production**, jusqu'à **+50 %** (six effets à la fois). Il ne retire jamais rien et s'arrête avec les effets. Autour de la jauge de pollen, la couronne de la fleur porte un **pétale doré** par effet au-delà du premier (sept au plus), et le compteur montre « Bouquet de 3 effets +20 % » parmi les effets en cours. Les coups de main gardés en réserve (§9.11) servent à le composer : une Floraison ou une envolée lancée quand le Papillon passe.
- **Une envolée qui se sent.** Pendant une envolée, les marques des bâtiments qui grandissent (§5.5) brillent d'un reflet doré qui respire (un reflet fixe avec les animations réduites).
- **Le pollen des moments.** Attraper le Papillon doré ou accueillir un visiteur (§9.6) remplit **un dixième** de la jauge de pollen ; s'il la remplit, l'envolée part aussitôt.
- **Le Papillon prend la couleur du temps.** Une fois le ciel ouvert (§9.10), les chances de ses trois effets suivent le temps, sans jamais en retirer un ; ni sa fréquence ni ses effets ne changent :

| Temps | Floraison | Récolte | Pollinisation |
|---|---|---|---|
| Grand soleil | 60 % | 30 % | 10 % |
| Vent | 40 % | 50 % | 10 % |
| Brume | 45 % | 35 % | 20 % |
| Averse, chaleur (et la 1ʳᵉ Saison) | 50 % | 40 % | 10 % |

- **Le premier clic de chaque Saison.** Pendant les **30 premières secondes** d'une Saison, chaque clic remplit la jauge **trois fois** plus vite : à 2,5 clics par seconde, une relance commence par une envolée.
- **Jalons (2).** « Bouquet » (3 effets en même temps) et « Grand bouquet » (5), famille Papillon doré. 153 jalons en tout.
- **Équilibrage.** Le joueur de référence vit le bouquet quand ses Floraisons croisent ses envolées, et le Papillon suit le temps. La 1ʳᵉ Saison conseillée ne bouge pas (66 min, cible 80 min). Le 1ᵉʳ Cycle conseillé passe de 2 h 29 à 2 h 41 (cible 2 h 45) : le Papillon donne d'autres effets selon le ciel, pas davantage. Les Cycles 2 à 4 durent 36, 36 et 43 min (cibles 35, 35 et 45). La 1ʳᵉ ville sœur reste à 4 h de jeu ; la 2ᵉ passe de 5 h à 6 h (cible 5 h, dans la marge de ±30 %) parce que le premier Cycle de la ville sœur du simulateur tient en une Saison au lieu de deux, ce qui décale d'une heure de jeu le second essaimage. Le Papillon et les visites ne viennent pas plus souvent : leurs Averses doublent l'Eau, et le 2ᵉ Cycle y est très sensible (§9.10).
- **Sauvegarde.** Rien de neuf à garder : le bouquet se lit dans les effets en cours, déjà sauvegardés.

## 6. Phases de progression

Chaque phase change la scène centrale (le décor reverdit) et débloque des éléments d'interface. Les durées sont des cibles pour un joueur qui joue activement la première fois *(à valider)*.

| Phase | Nom | Durée cible (1ʳᵉ partie) | Ce qui se débloque | La scène montre |
|---|---|---|---|---|
| 1 | **Le Balcon** | 0 – 5 min | Clic, générateurs 1 à 3, premières améliorations | Un balcon gris, une fleur, puis des pots et un panneau |
| 2 | **Le Quartier** | 5 min – 25 min | Générateurs 4 et 5, synergies, Jalons, Papillon doré | Les toits verdissent, une serre apparaît |
| 3 | **La Ville** | 25 min – 1 h 40 | Générateurs 6 à 8, bonus de biodiversité complet, prestige disponible | Des miroirs au loin, les rues deviennent des sous-bois |
| 4 | **Les Saisons** | après la 1ʳᵉ Saison | Écran des Saisons, statistiques de prestige | La scène suit la maturité des Graines : printemps, été, puis automne quand elles sont mûres (§7) |

Les phases se déclenchent sur la **Lumière totale gagnée pendant la Saison en cours** (seuils indicatifs : Phase 2 à 10 000, Phase 3 à 10 M).

**Le récit passe par le gameplay (2026-10-10).** Le Journal du quartier livré au jalon 4 a été retiré : il n'y a plus de messages narratifs. Ses temps forts sont repris ainsi :

- **Déjà portés par la scène.** Premier pot, premier panneau, premier potager, serre, ferme verticale, miroirs, canopée, arcologie : chaque bâtiment apparaît sur la carte avec son animation. « Le quartier se réveille » et « d'autres quartiers verdissent » : les vues de la carte qui s'ouvrent de phase en phase et le quartier qui reverdit avec la production. Premier Papillon doré : le papillon lui-même. Dix Jalons : l'annonce et l'écran des Jalons (§9.3). Les Saisons accomplies : la teinte de saison de la scène.
- **Pistes d'événements en jeu, plus tard.** Les voisins qui apportent des boutures et le vote du jardin partagé de la rue des Tilleuls peuvent devenir des Projets du quartier visibles sur la carte (roadmap, M6). « La terre se souvient » d'une Saison à l'autre prend corps avec les parcelles qui restent restaurées et l'Arbre des Saisons (roadmap, M6 et M7). Rien de tout cela n'est construit pour l'instant.

**Implémentation (jalon 4).** `src/game/phases.ts`.

- La scène suit la phase : le ciel passe de l'aube (phase 1) au plein midi (phase 2) puis à la fin d'après-midi (phase 3), et le nom de la phase s'affiche en légende.
- Phase 4 : à partir de la 2ᵉ Saison, la scène prend la teinte d'une saison. La 1ʳᵉ Saison n'a pas de teinte propre. Le feuillage et le ciel changent de couleur ; rien d'autre ne change. Depuis les Graines mûres (§7, 2026-10-11), la teinte suit la maturité de la Saison en cours : printemps au début, été à mi-maturité, automne une fois les Graines mûres. L'hiver, c'est la replantation elle-même : il ne reste pas à l'écran. (Avant, la teinte changeait d'une Saison à l'autre, dans l'ordre des saisons.)

**Scène vue du dessus (post-MVP, 2026-10-10).** Demande d'Antoine : une progression plus visuelle, la ville au centre de l'écran, vue du dessus, où les bâtiments apparaissent avec des animations élégantes au fil des achats. `src/ui/Neighbourhood.tsx` dessine la scène, `src/ui/neighbourhood.ts` porte le plan et les règles.

- **Le plan.** Un quartier en SVG vu du dessus : trois rangées de trois îlots séparés par deux avenues et deux rues. Au centre, l'immeuble du joueur entoure une cour où pousse l'héliotrope. Au départ tout est gris : toits en béton, friches, parkings.
- **Chaque générateur a ses places.** Pots autour de la cour, panneaux sur les toits voisins, potagers qui remplacent les toits gris (du plus proche au plus lointain), serres sur les friches, fermes verticales à la place de trois tours, champ de miroirs sur le parking du sud-est, arbres le long des rues (la canopée part de la cour et gagne la ville), arcologie en rosace de terrasses sur la grande friche du nord-ouest.
- **Chaque achat se voit.** Chacun des premiers exemplaires ajoute un élément ; ensuite les éléments arrivent à des paliers de plus en plus espacés (12, 14, 16, 18, 20, 23… jusqu'à 500), pour qu'un achat tardif change encore l'image. Les arbres arrivent par bosquets de quatre et les miroirs par deux. Un nouvel élément pousse en place en 1,2 s, accompagné d'un anneau doré qui s'élargit ; ce qui existait déjà au chargement s'affiche sans animation.
- **Les améliorations aussi.** Chaque amélioration ×2 (§5.1) fait scintiller une fois tous les éléments du générateur et les enrichit : plus de pétales dans les pots, cadre doré des panneaux, tomates puis fleurs dans les potagers, serres plus nervurées puis chauffées, terrasses supplémentaires sur les fermes, miroirs dorés puis rayons vers la tour, arbres en fleurs, arcologie fleurie. Les améliorations de clic font fleurir l'héliotrope de la cour, et chaque synergie (§5.3) trace un fil doré entre les deux générateurs qu'elle relie.
- **Trois vues, au choix du joueur (2026-10-10).** Demande d'Antoine : la carte ne se dézoome plus d'elle-même, le joueur passe d'une vue à l'autre avec un sélecteur en haut à gauche de la carte. « Le Balcon » cadre la cour et l'immeuble du joueur, « Le Quartier » les îlots autour, « La Ville » la ville entière. Chaque vue s'ouvre avec sa phase, ou plus tôt si le joueur achète un générateur dont la place est hors de la dernière vue ouverte. Quand une vue s'ouvre en jeu, la carte y glisse une fois (1,1 s) pour qu'on voie le nouveau bâtiment pousser ; le joueur peut ensuite revenir plus près. Le choix est gardé dans le navigateur, hors sauvegarde. Chaque vue garde son cadre entier et aussi grand que l'écran le permet, quelle que soit sa forme ; le reste de l'écran montre la périphérie grise, des îlots jamais restaurés sur la même grille de rues, voilés de lumière pour que la partie du joueur ressorte.
- **La lumière suit la phase.** Les ombres des bâtiments tournent et changent de longueur (aube : longues vers l'ouest ; midi : courtes ; fin d'après-midi : longues vers l'est), un voile de lumière teinte la scène, des ombres de nuages la traversent lentement. Le quartier reverdit avec la production, et les teintes de saison (phase 4) s'appliquent au feuillage et à la lumière.
- **Animations réduites.** Avec le réglage des Options ou `prefers-reduced-motion`, rien ne bouge : les éléments apparaissent directement, la caméra change de cadre sans transition, pas de scintillement.

### 6.1 Parcelles à restaurer (M6, post-MVP)

Le quartier garde des places grises qu'aucun bâtiment n'occupe : une avenue, deux rues, un parking, un entrepôt, les toits, les carrefours. Le joueur les **restaure une à une contre de la Lumière**. Une parcelle restaurée **le reste pour toujours**, d'une Saison à l'autre (décision D2 d'Antoine) : la terre se souvient, et le quartier de la Saison suivante démarre déjà plus vert. Les données sont dans `src/game/parcels.ts`, les règles dans `src/game/restoration.ts`.

| Parcelle | Place sur la carte | Phase | Coût | Effet |
|---|---|---|---|---|
| Rue jardin | L'avenue devant l'immeuble, dépavée, avec îlots fleuris et bancs | 1 | 1 500 | Clic ×2 |
| Jardins de pluie | L'avenue derrière l'immeuble : deux noues plantées de roseaux | 1 | 8 000 | Héliotropes en pot ×2, Panneaux de balcon ×1,5 ; l'Averse d'été dure ×2 (M11, §9.6) |
| Corridor des pollinisateurs | La rue ouest, sur toute sa longueur : une prairie fleurie | 2 | 100 000 | Le Papillon doré et les visites (§9.6) reviennent 20 % plus vite |
| Rivière retrouvée | La rue est : la rivière enterrée coule à nouveau, sous des passerelles | 2 | 2 M | +2 h de plafond hors ligne (§9.1) |
| Parc du parking | Le parking de l'est : pelouse, étang, bosquets | 3 | 30 M | Toute la production +10 % |
| Verger de l'entrepôt | L'entrepôt du sud-ouest ouvre son toit à deux rangées d'arbres fruitiers | 3 | 300 M | Potagers ×1,5, Serres ×1,5 |
| Toits vivants | Tous les toits gris se couvrent d'orpin et de fleurs | 3 | 3 Md | Bonus de biodiversité ×2 |
| Places plantées | Les quatre carrefours autour de l'immeuble deviennent des places rondes autour d'un arbre | 3 | 30 Md | Chaque Jalon donne +2 % au lieu de +1 % |

- **Quand une parcelle est proposée.** Quand sa place est dans une vue ouverte (sa phase) et que la Saison en cours a récolté la moitié de son prix, comme pour les générateurs (§4). Une première Saison en restaure environ six ; les deux dernières sont des objectifs lointains pour les Saisons suivantes.
- **Sur la carte.** Une parcelle proposée est cernée d'un pointillé doré qui respire, avec une épingle en forme de pousse là où elle commencera à reverdir ; l'épingle est dorée quand on peut se l'offrir, et un clic dessus la restaure. Passer sur la parcelle dans le panneau sous la carte éclaire sa place.
- **L'animation.** La parcelle restaurée se dévoile depuis son épingle : un cercle qui s'élargit découvre le nouveau sol pendant que des pétales jaillissent, avec un anneau doré. Une parcelle déjà restaurée au chargement s'affiche sans animation.
- **Le panneau « Le quartier ».** Sous la carte, une rangée de huit pastilles montre les parcelles restaurées pour toujours, puis les quatre offres les moins chères (parcelles et projets mêlés) avec leur effet et leur prix.

### 6.2 Projets du quartier (M6, post-MVP)

Des décisions uniques du quartier qui **changent une règle** plutôt que de multiplier un chiffre : des bâtiments moins chers, un Papillon qui revient plus vite, une biodiversité qui compte plus tôt… Ils se mènent **pour la Saison en cours** et se relancent à chaque Saison, comme les améliorations. Chaque projet laisse **une trace visible sur la carte** (un stand, des guirlandes, un tram, des lanternes…) : il n'y a ni récit ni texte d'ambiance, seulement le nom du projet et son effet (règle d'Antoine : l'histoire se raconte par le jeu, la scène et les animations). Données dans `src/game/projects.ts`.

| Projet | Condition | Coût | Effet | Trace sur la carte |
|---|---|---|---|---|
| Troc de graines | 5 Héliotropes en pot | 250 | Le clic rapporte +0,2 par Héliotrope en pot ; les voisins apportent une bouture de plus (M11, §9.6) | Une table de sachets dans la cour |
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

Le pilier « Élégant et lumineux » (§1) promettait des sons discrets. Ils sont synthétisés dans le navigateur (Web Audio, aucun fichier audio) et accordés sur une même gamme pentatonique, pour ne jamais sonner faux quand ils se superposent : une note pincée à chaque clic, qui change de hauteur d'un clic à l'autre ; deux notes boisées pour une récolte du potager ou une cueillette du verger (M25) ; un accord grave et lent pour une étape de grand chantier ou une ruche posée (M25) ; trois notes claires pour une alliance choisie (M25) ; un petit accord à chaque bâtiment ; un scintillement pour une amélioration ; un arpège pour une parcelle restaurée ; une cloche pour un projet ; un trille pour le Papillon doré ; deux notes pour un Jalon ; un accord lent pour une nouvelle Saison. À partir de la phase 2, des oiseaux chantent de temps en temps quand l'onglet est visible. Quand plusieurs choses arrivent ensemble, seul le son le plus rare joue. Les Options règlent le volume (50 % par défaut) et coupent le son. Code dans `src/ui/sound.ts` et `src/ui/useSounds.ts`.

**La musique du quartier (M17).** Une musique d'ambiance **générative**, synthétisée de la même façon sur la même gamme pentatonique, une octave plus bas, pour que les sons s'y posent toujours juste. Au Balcon, quelques notes lentes et graves (une chance sur cinq de se taire à chaque temps fort) ; la phase 2 ajoute une mélodie clairsemée, la phase 3 des cloches aiguës ; chaque quartier voisin restauré (§6.4) ajoute une voix discrète, tour à tour médium, grave et aiguë ; les zones humides de la Biorégion (§7.4) ajoutent des gouttes qui glissent vers le bas, la forêt ancienne un bourdon grave (do et sol) qui gonfle lentement. Le tempo suit la saison visuelle (un temps de 0,8 s en été, 0,9 s au printemps, 1,05 s en automne, 1,3 s en hiver) et ralentit le soir (×1,15) et la nuit (×1,35) ; un filtre adoucit la couleur en hiver et la nuit. Elle se tait quand l'onglet est caché. Les Options ont un réglage **Musique** séparé (35 % par défaut sur ordinateur, **coupée par défaut sur téléphone** tant que le joueur ne l'a pas réglée) ; « Couper le son » coupe aussi la musique. Code dans `src/ui/music.ts` et `src/ui/useMusic.ts`.


### 6.4 Les quartiers voisins (M12)

Autour de la ville, la périphérie grise (§6) s'ouvre quand le quartier est **entièrement restauré** (les huit parcelles du §6.1). Ses îlots deviennent des **quartiers voisins**, à restaurer **un à un, dans l'ordre**, contre de la Lumière, **pour toujours** : ils restent d'une Saison à l'autre et après un Cycle de l'eau, comme les parcelles (décision D2). Chacun apporte une **règle** liée à l'existant (Biorégion, visites, Papillon, synergies) plutôt qu'un multiplicateur global, pour donner aux Saisons tardives des objectifs lointains sans aggraver leur rythme (§7). Données dans `src/game/districts.ts`, places et dessins dans `src/ui/districtMap.ts` et `src/ui/DistrictArt.tsx`.

| Quartier voisin | Ancien usage, place | Coût | Effet |
|---|---|---|---|
| Jardins d'eau des Tanneries | Tanneries, à l'est | 100 Md | Eau ×1,5 ; l'Averse d'été dure ×1,5 |
| Forêt de la gare de triage | Gare de triage, au nord | 500 Md | Canopées urbaines ×2 ; la Nuée de migrateurs dure ×1,5 |
| Verger du centre commercial | Centre commercial, au sud | 2,5 Bn | Les voisins apportent une bouture de plus ; Potagers ×1,5 |
| Halles du parking relais | Parking relais, à l'ouest | 12,5 Bn | Récolte du Papillon doré ×1,5 |
| Parc de l'échangeur | Échangeur, au nord-est | 60 Bn | Les visites reviennent 20 % plus vite, le Papillon 10 % |
| Tiers-lieu des bureaux | Bureaux, au sud-ouest | 300 Bn | Synergies ×1,25 |
| Ateliers solaires | Zone industrielle, au sud-est | 1,5 Bd | Tous les bâtiments coûtent 10 % de moins |
| Tours vivantes | Quartier des cheminées, au nord-ouest | 7,5 Bd | Arcologies ×2 ; chaque jalon donne +0,5 % de plus |

- **Quand un quartier est proposé.** Le suivant dans l'ordre, dès que la Saison en cours a récolté la moitié de son prix, comme une parcelle. Il rejoint les offres du panneau « Le quartier » (et le prochain objectif du compteur, §10.5) ; la rangée de pastilles du panneau compte alors les quartiers voisins au lieu des parcelles.
- **Sur la carte.** Chaque quartier occupe un îlot de la périphérie, au-delà de la rocade. Celui qui est proposé est cerné d'un pointillé doré qui respire, avec une grande épingle en forme de pousse au centre ; un clic dessus le restaure quand on peut se l'offrir. Restauré, l'îlot gris laisse place à son dessin : bassins et roseaux des jardins d'eau, rangées d'arbres le long des anciennes voies, verger en quinconce, halles aux auvents rayés, boucles de l'échangeur devenues allées, place plantée entre des toits verts, ateliers couverts de panneaux, tours en terrasses plantées. Il apparaît avec l'entrée habituelle de la carte (anneau doré), sans animation au chargement.
- **La vue « La Ville » s'agrandit.** Son cadre englobe la ville et chaque quartier voisin restauré : à mesure que la périphérie reverdit, la vue s'élargit pour la montrer.
- **Jalons (3).** Par-delà la rocade (1 quartier voisin), La ville déborde (4), Ville jardin (8). 116 jalons en tout.
- **Sauvegarde.** Version 14 : la liste des quartiers restaurés, vide pour une sauvegarde plus ancienne.

### 6.5 Un quartier à son image (M16)

Le quartier restauré ressemble au joueur : chaque parcelle a **deux avenirs**, des pièces de **décor** se posent sur la carte, et un **mode photo** garde une image du quartier. Rien ici n'ajoute de vitesse : les deux avenirs d'une parcelle se valent, ils orientent le jeu autrement. Données dans `src/game/parcels.ts` (champ `second`), `src/game/restoration.ts` et `src/game/decor.ts` ; dessins dans `src/ui/RestorationArt.tsx`, `src/ui/DecorArt.tsx`, `src/ui/decorMap.ts`, barres d'outils dans `src/ui/MapTools.tsx`, image dans `src/ui/photo.ts`.

**Les deux avenirs.** Avant de restaurer une parcelle, le panneau « Le quartier » propose ses deux avenirs (pastilles) : le premier est celui du §6.1, le second a un autre dessin et un autre effet. Une parcelle restaurée peut **changer d'avenir une fois par Cycle de l'eau** (décision D7), gratuitement, dans la liste repliable « Les avenirs des parcelles » du même panneau. Le changement reste d'une Saison à l'autre.

| Parcelle (1ᵉʳ avenir) | Second avenir | Dessin | Effet du second avenir |
|---|---|---|---|
| Rue jardin | Rue des enfants | Marelle, bacs à sable, arbres d'alignement | Héliotropes en pot ×2, Panneaux de balcon ×2 (au lieu du clic ×2) |
| Jardins de pluie | Bassin d'orage | Un grand bassin en gradins, roseaux | Héliotropes en pot ×1,5, Panneaux de balcon ×2, Eau ×1,25 ; l'Averse dure ×2 |
| Corridor des pollinisateurs | Haie bocagère | Une haie continue d'arbustes | Les visites reviennent 30 % plus vite, le Papillon 10 % |
| Rivière retrouvée | Rivière baignade | Un ponton et des baigneurs | Eau ×1,75, +1 h de plafond hors ligne |
| Parc du parking | Marché couvert | Une halle aux toits rayés et ses étals | +1,25 % de production par parcelle restaurée (+10 % avec les huit) |
| Verger de l'entrepôt | Serres de l'entrepôt | Des serres vitrées | Fermes verticales ×1,5, Centrales à miroirs ×1,5 |
| Toits vivants | Toits potagers | Des rangs de cultures sur les toits | Biodiversité ×1,5, Potagers sur le toit ×2 |
| Places plantées | Places des fontaines | Une fontaine au centre de chaque place | +1,5 % par Saison achevée (au lieu de +1 % de plus par Jalon) |

**Le décor.** Des pièces purement décoratives se gagnent avec les Jalons et l'Herbier, pour toujours. Le bouton « Décorer » de la carte s'ouvre avec la première pièce : huit emplacements cerclés apparaissent dans la cour et les rues ; un clic sur un emplacement fait défiler les pièces gagnées puis le vide. La barre d'outils montre les pièces gagnées, celles à gagner et leur condition, et la couleur des fleurs de l'héliotrope.

| Pièce | Condition | Couleur de l'héliotrope | Condition |
|---|---|---|---|
| Banc | 10 Jalons | Lilas | dès le début |
| Jardinière | 3 espèces | Or | 20 Jalons |
| Guirlande de lampions | 30 Jalons | Rose | 6 espèces |
| Nichoir | 8 espèces | Bleu | 12 espèces |
| Fresque au sol | 50 Jalons | Blanc | 60 Jalons |
| Fontaine | 75 Jalons | | |
| Hôtel à insectes | 15 espèces | | |

**Le mode photo.** Le bouton « Photo » de la carte la met en plein écran sans menus, avec une barre pour choisir le moment du jour (jour, soir, nuit) et la saison visuelle (§6), puis « Enregistrer l'image » : la carte (les deux rendus, §10.4) et ses dessins sont composés en une image PNG deux fois plus fine que l'écran, téléchargée sur l'appareil. Rien n'est envoyé ailleurs.

- **Sur la carte (PixiJS).** Les seconds avenirs ont leur dessin dans les deux rendus ; les toits potagers sont dessinés par le rendu PixiJS sur ses propres bâtiments (`art.ts`), comme les toits vivants.
- **Sauvegarde.** Version 18 : les avenirs choisis (le premier par défaut), le Cycle du dernier changement, les huit emplacements de décor et la couleur des fleurs (lilas).

### 6.6 Les grands chantiers (M20)

Quatre ouvrages de toute la ville (roadmap P19), bâtis **étape par étape** et **gardés pour toujours** (après une Saison comme après un Cycle). Ils s'ouvrent avec la Biorégion (§7.4), dont ils demandent l'Eau. Le panneau « Les grands chantiers » montre chaque chantier, ses étapes bâties, la prochaine étape avec son effet, ce qui est déjà versé et le bouton « Verser ».

**Payer une étape.** Chaque étape se paie avec **plusieurs ressources à la fois** : Lumière, Eau, **paniers** du potager (§9.7) et, pour les deux dernières, **miel** des ruches (§9.8, M22), et demande un nombre d'espèces revenues dans l'Herbier (§9.5), qui ne sont pas dépensées. « Verser » donne tout ce que le joueur possède, jusqu'à ce que l'étape demande encore : ce qui est versé reste versé, on peut donc remplir une étape en plusieurs Saisons. L'étape se bâtit dès que tout est payé et que les espèces sont là (à la prochaine seconde si une espèce revient après).

| Étape | Lumière | Eau | Paniers | Miel (M22) | Espèces |
|---|---|---|---|---|---|
| 1 | 1 Bn | 200 000 | 5 | — | — |
| 2 | 1 Bd | 2 M | 15 | — | 8 |
| 3 | 1 Tn | 20 M | 30 | 3 | 14 |
| 4 | 1 Td | 200 M | 60 | 8 | 20 |

Une étape coûte à peu près une Saison tardive d'efforts (§8) ; un chantier complet, plusieurs Cycles. Les halles n'ont que trois étapes.

**Les paniers.** Chaque récolte du potager rapporte des paniers en plus de son effet : Radis 1, Tournesols 2, Haricots grimpants 3, Courges 5. Ils se gardent, sans plafond, et ne servent qu'aux chantiers.

| Chantier | Étapes | Chaque étape | Dernière étape |
|---|---|---|---|
| **Le tram solaire** | Rails, caténaires végétalisées, stations, premier tram | Production +1 % par quartier voisin restauré (§6.4) | +3 % par quartier voisin |
| **La rivière rouverte** | Dalle cassée, berges, passerelles, baignade | Eau récoltée ×1,1 | Eau ×1,25, et les visites reviennent 10 % plus vite (§9.6) |
| **Les halles nourricières** | Charpente, étals, cuisine commune | Le potager pousse ×1,15 plus vite | Les Haricots grimpants durent ×1,5 |
| **La tour des semences** | Fondations, étages de culture, grainothèque, belvédère | Toute la production +3 % | +5 %, et +2 h de plafond hors ligne (§9.1) |

Écart avec la roadmap : la rivière fait revenir les visites plutôt que les espèces (les espèces reviennent sur conditions de jeu, pas sur un délai) ; la tour donne de la production plutôt que des Graines, qui n'ont plus d'usage une fois la Canopée complète (§8, fin de partie).

- **Sur la carte.** Chaque chantier a sa place dans les blocs gris autour de la rocade, sauf le tram qui suit la rocade elle-même : avant la première étape, un pointillé doré marque le terrain ; puis chaque étape se dessine (rails et traverses, mâts couverts de vigne, quais à toit vert, le tram jaune qui fait le tour ; la dalle fendue, la rivière, ses roseaux, passerelles et baigneurs ; la charpente, les étals et la fumée de la cuisine ; les fondations, les étages verts, le toit doré). Ces dessins sont en SVG par-dessus les deux rendus (§10.4). Avec les animations réduites, le tram et la fumée restent immobiles.
- **Jalons (2).** « Première pierre » (un chantier complet), « Grands travaux » (les quatre). 134 jalons en tout.
- **Simulateur.** Il ne joue pas les chantiers : leurs bonus ne font que s'ajouter à la fin de partie mesurée en M19.
- **Sauvegarde.** Version 22 : les étapes bâties et les versements de chaque chantier, et les paniers du potager, à zéro pour une sauvegarde plus ancienne.

### 6.7 Les trames verte et bleue (M21)

Les avenirs des parcelles (§6.5) se répondent (roadmap P20) : des parcelles restaurées **voisines** sur la carte dont l'avenir choisi est de la **même famille** forment une **trame**. Rien n'est gardé à part : les trames suivent les parcelles et leurs avenirs, donc changer un avenir (une fois par Cycle de l'eau) les réarrange. Données dans `src/game/corridors.ts`, dessins dans `src/ui/CorridorArt.tsx` et `src/ui/corridorMap.ts`.

| Parcelle | 1ᵉʳ avenir | 2ᵈ avenir |
|---|---|---|
| Rue jardin | verte | aucune (rue des enfants) |
| Jardins de pluie | bleue | bleue |
| Corridor des pollinisateurs | verte | verte |
| Rivière retrouvée | bleue | bleue |
| Parc du parking | verte | aucune (marché couvert) |
| Verger de l'entrepôt | verte | aucune (serres) |
| Toits vivants | aucune (les toits ne touchent pas le sol) | aucune |
| Places plantées | verte | bleue (places des fontaines) |

**Voisinage.** Les deux avenues touchent les deux rues qui traversent la ville et les places de leurs carrefours ; les deux rues touchent aussi les places ; le verger longe la rue ouest, le parc fait face à la rue de la rivière. Le petit casse-tête tient aux places : vertes, elles complètent une trame verte de quatre parcelles (rue jardin, pollinisateurs, verger, places) ; bleues, une trame bleue de trois (jardins de pluie, rivière, places).

- **Effet.** Une trame compte à partir de **2 parcelles**. Verte : **+2 % de production par parcelle** (+8 % au plus). Bleue : **Eau ×(1 + 0,05 par parcelle)** (×1,15 au plus). Jamais de pénalité : les avenirs gardent leur effet propre.
- **Espèces.** Une trame de **3 parcelles** ou plus fait revenir son espèce, qui reste ensuite comme les autres : le **Pic vert** (trame verte) et le **Triton crêté** (trame bleue). Comme celles de la rivière et de la ville, elles ne comptent pas dans les 18 espèces du quartier de l'Herbier complet (§9.5).
- **Écran.** Dans « Les avenirs des parcelles » (panneau « Le quartier »), une pastille verte ou bleue marque la famille de chaque avenir, et la liste des trames donne leur longueur et leur effet.
- **Sur la carte.** Une haie continue court le long d'une trame verte, un ruisseau qui coule le long d'une trame bleue, avec un trait qui relie le verger à la rue ouest ou le parc à la rivière. En SVG par-dessus les deux rendus (§10.4).
- **Simulateur.** Il garde les premiers avenirs : sa trame verte (rue jardin, pollinisateurs, verger, qui fait revenir le Pic vert dès la 2ᵉ Saison) et sa trame bleue (jardins de pluie, rivière) restent dans les cibles du §8 (1ʳᵉ Saison conseillée 74 min, 1ᵉʳ Cycle 168 min).
- **Sauvegarde.** Pas de changement de version : les trames se déduisent des parcelles et des avenirs.

---

## 7. Prestige : les Saisons

### Principe

Quand la progression ralentit, le joueur peut lancer une **Nouvelle Saison**. Thématiquement : l'hiver passe, on replante tout, mais la terre garde la mémoire de ce qui a poussé.

**Remis à zéro :** Lumière, générateurs, améliorations, projets du quartier (§6.2), phase visuelle.
**Conservé :** Graines d'Héliotrope, Jalons, parcelles restaurées (§6.1), talents de l'Arbre des Saisons et réglages des Coopératives (§7.1, §7.2), statistiques globales, options.

### Formule

```
grainesTotalesMéritées = floor( sqrt( lumièreTotaleToutesSaisons / 2e7 ) )        jusqu'à 100 Graines (2e11)
                       = floor( 100 × cbrt( lumièreTotaleToutesSaisons / 2e11 ) )   au-delà (le sol s'approfondit)
grainesGagnées         = grainesTotalesMéritées − grainesDéjàObtenues, une fois mûres (15 min de Saison)
bonusProduction        = +5 % par Graine possédée (additif)
```

Points de repère *(à valider)* :

| Lumière totale cumulée | Graines | Bonus |
|---|---|---|
| 20 M (2e7) | 1 | +5 % |
| 2 Md (2e9) | 10 | +50 % |
| 200 Md (2e11) | 100 | +500 % |
| 1,6 Bn (1,6e12) | 200 | +1 000 % |
| 200 Bn (2e14) | 1 000 | +5 000 % |

> Première passe d'équilibrage (jalon 2, 2026-10-10) : le diviseur passe de 1e9 à 5e7. Avec 1e9, le simulateur n'atteignait 10 Graines qu'après plus de 8 h de jeu, ce qui contredisait la cible de ~4 h du §8 alors que le rythme des générateurs, lui, tombait juste. Le diviseur est le seul réglage qui corrige cet écart sans décaler l'arrivée des générateurs.

> Équilibrage adouci (après le MVP) : le diviseur passe de 5e7 à 2e7 pour que les 10 Graines conseillées arrivent vers 2 h 40, au même rythme raccourci d'un tiers que les générateurs (§8).

- Le bouton Nouvelle Saison est disponible dès qu'on gagnerait au moins **1** Graine mûre, mais l'interface conseille d'attendre d'en gagner au moins 10 pour la première (« La terre n'est pas encore prête »). On ne bloque pas, on conseille.
- L'écran de confirmation montre clairement : ce qui sera perdu, les Graines gagnées, le bonus avant/après.
- Cible : 1ʳᵉ Saison rentable vers **1 h 30 – 1 h 45** de jeu, puis des Saisons plus courtes pour atteindre le même point, mais **jamais moins de 15 minutes** : passé les premières, une Saison doit durer plus longtemps à mesure que les Graines s'accumulent (demande d'Antoine de corriger l'emballement des Saisons, 2026-10-11).

**Freiner l'emballement (2026-10-11).** Demande d'Antoine : corriger l'emballement des Saisons par des mécaniques. Avant, dès ~80 Graines, chaque Saison ne durait que 1 à 3 minutes : en une minute, le joueur rachetait presque tous les bâtiments de la Saison précédente, et la production (Graines, talents, sites, améliorations ×2 débloquées par plus de bâtiments) croissait plus vite que la Lumière qu'il fallait pour doubler ses Graines. Deux mécaniques s'ajoutent, sans toucher aux bâtiments ni au début de partie :

- **Les Graines mûrissent.** Les Graines d'une Saison poussent dès que la Lumière les mérite, mais ne se récoltent que **mûres, après 15 minutes de Saison** (temps réel écoulé, hors ligne compris ; 12 puis 10 minutes avec le bras des semences du delta, §7.5). Avant, le bouton Nouvelle Saison reste grisé. L'écran des Saisons montre les Graines qui poussent, une jauge de maturité et le temps restant (« Les Graines mûrissent : encore 7 min de Saison »). Sur la carte, la teinte de saison suit la maturité (§6) : printemps, été, puis automne quand la récolte est prête. Les trois premières Saisons durent naturellement plus de 15 minutes et ne changent pas. Une Saison qui mûrit plus longtemps récolte plus : la Lumière gagnée pendant l'attente compte, et l'Eau des collecteurs (§7.4), qui suit le temps, profite aussi des Saisons longues.
- **Le sol s'approfondit.** Au-delà de **100 Graines** dans le Cycle, les Graines suivent une racine cubique au lieu d'une racine carrée : doubler ses Graines demande ×8 Lumière au lieu de ×4. Sans cela, l'attente de la maturité ferait bondir les Graines de ×15 à ×40 par Saison ; avec, de ×4 à ×10, puis ×2 quand les Saisons s'allongent.

Ni l'une ni l'autre ne suffit seule : un sol plus exigeant seul laissait des Saisons de 5 minutes pendant longtemps, et une maturité progressive (Graines multipliées par la part de maturité) n'allongeait les Saisons que d'une à deux minutes. Ensemble, elles donnent des Saisons d'au moins 15 minutes qui s'allongent ensuite d'elles-mêmes (mesures au §8).

**Implémentation (jalon 3).** `src/game/seasons.ts`. Précisions retenues :

- Le bonus des Graines multiplie la production des générateurs (et donc la part du clic indexée sur la production, §5.2), pas la valeur de base du clic : `multiplicateurGlobal = (1 + 0,05 × graines) × (1 + bonusBiodiversité)`.
- Le conseil « La terre n'est pas encore prête » ne s'affiche que pour la première Saison, tant qu'on gagnerait moins de 10 Graines. Les Saisons suivantes ne sont jamais déconseillées.
- L'écran des Saisons apparaît dès qu'une Graine pousse, mûre ou non, puis reste accessible une fois une Saison accomplie. Le bouton du menu montre les Graines mûres à gagner.
- Maturité et sol profond (2026-10-11) : `SEED_RIPENING_SECONDS` (15 min, sur `seasonSeconds`) et `DEEP_SOIL_SEEDS` (100). `seedsGrowing` compte les Graines qui poussent, `seedsToGain` celles qu'une nouvelle Saison récolterait (aucune avant maturité). Le Cycle de l'eau (§7.4) ne dépend pas de la maturité.
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

#### La Canopée (M13)

Une fois les 17 talents appris, l'Arbre a encore une place pour les Graines des Saisons tardives, qui en rapportent des centaines : au-dessus de la ramure s'ouvre la **Canopée**, des talents **à niveaux** dont chaque niveau coûte plus cher que le précédent. Les Graines semées y sont gardées pour toujours, comme les talents, et enracinées par un Cycle de l'eau (§7.4). Données dans `src/game/talents.ts` (`CANOPY_LIST`).

| Talent | 1ᵉʳ niveau | Prix ×, par niveau | Niveaux | Effet au niveau *n* |
|---|---|---|---|---|
| Rameau des racines | 5 | ×1,5 | 10 | Synergies ×(1 + 0,05 *n*) |
| Rameau des pollinisateurs | 5 | ×1,5 | 10 | Le Papillon doré revient 3 *n* % plus vite |
| Rameau de la mémoire | 5 | ×1,5 | 10 | Les visites reviennent 3 *n* % plus vite |
| Pépinière | 10 | ×2 | 4 | Les Boutures gardent 10 + 10 *n* % de chaque bâtiment (jusqu'à 50 %) |
| Le semoir | 15 | — | 1 | Relance la Saison tout seul (ci-dessous) |
| Les fontainiers | 15 | — | 1 | Une coopérative qui bâtit les collecteurs d'eau (§7.2) |
| L'assemblée de quartier | 15 | — | 1 | Le conseil de quartier mène aussi les projets (§7.2, M36) |
| Les amis du potager | 15 | — | 1 | Une coopérative qui ressème le potager (§7.2, M36) |
| Les lauriers | 10 | ×2 | 3 | +3 *n* % de production par famille de Jalons complète (§9.16, M37) |

La Canopée complète coûte environ 2 000 Graines : un puits de long terme, qui se remplit Cycle après Cycle. Ses effets restent liés à l'existant (synergies, Papillon, visites, Boutures) et modestes, pour allonger et alléger les Saisons tardives sans relancer leur emballement (§7, §8) ; le simulateur ne la joue pas, et les cibles du §8 ne bougent pas.

- **Le semoir.** Une fois semé, un réglage de l'écran des Saisons choisit quand il relance : **éteint** (par défaut, décision D6 de la feuille de route), ou dès que les Graines mûres de la Saison multiplient celles déjà obtenues par **×1,5, ×2, ×3 ou ×5**. Il lance toujours une Saison libre et attend la fin d'une Saison à défi ; il travaille à chaque pas de simulation, donc hors ligne aussi. C'est l'automatisation de la couche du dessous, comme les Coopératives pour les bâtiments.
- **Écran.** Sous l'arbre, la section « La Canopée » liste ses neuf talents, leur niveau (des pastilles dorées), l'effet d'aujourd'hui et celui du niveau suivant, et le bouton Semer avec son prix. Avant les 17 talents, une ligne dit quand elle s'ouvre. Sur le dessin, une feuille dorée s'ajoute au-dessus du feuillage à chaque niveau semé et se balance doucement.
- **Jalons (4).** Jeune canopée (1 niveau), Canopée touffue (18 niveaux), Cime (la Canopée complète), Semis spontané (le semoir lance 10 Saisons). 120 jalons en tout.
- **Sauvegarde.** Version 15 : les niveaux de la Canopée et les réglages du semoir, rien de semé et le semoir éteint pour une sauvegarde plus ancienne.

### 7.2 Coopératives (M7)

Des voisins achètent à la place du joueur : ce sont les talents de la branche Mémoire qui les font venir. Chaque coopérative s'occupe de deux bâtiments, le conseil de quartier des améliorations. Depuis M13, **les fontainiers** (Canopée, §7.1) bâtissent les collecteurs d'eau de la Biorégion : le moins cher de ceux qui sont révélés, dès qu'il coûte au plus 10 % de la Lumière en réserve, pour que la Biorégion grandisse à côté sans retenir les bâtiments ; ils passent avant les autres, et leur vélo-cargo bleu parcourt la rue de l'est.

- **Ce qu'elles achètent.** Les coopératives de bâtiments choisissent ensemble, parmi leurs bâtiments déjà révélés, celui qui rembourse le plus vite son prix (`coût / gain de production d'un exemplaire`). Si c'est aussi une bonne affaire comparé à tous les bâtiments révélés (au plus 1,25 fois moins rentable que le meilleur), elles l'achètent dès qu'elles peuvent ; sinon le joueur économise sans doute pour mieux, et elles ne l'achètent qu'avec au plus 10 % de la réserve. Le conseil achète l'amélioration la moins chère, et les autres attendent qu'il l'ait achetée tant qu'elle ne coûte pas plus de 30 fois leur prochain bâtiment.
- **Réglages.** Chaque coopérative peut être mise à l'arrêt, et l'option « Garder une réserve » limite chaque achat à 10 % de la Lumière en réserve. Les réglages restent d'une Saison à l'autre.
- **Temps.** Elles achètent à chaque pas de simulation, en ligne comme hors ligne (par tranches de 60 s, §9.1) : seule la Lumière disponible compte, jamais un nombre de pas.
- **Elles ne sont pas le joueur.** Leurs achats ne remettent pas à zéro le temps sans achat du Jalon caché « Photosynthèse lente » (§9.3).
- **Panneau.** Un panneau « Coopératives » sous les bâtiments liste celles qui sont venues, ce qu'elles achètent, leur nombre d'achats et un interrupteur « En marche / À l'arrêt ». Sur mobile, il est dans l'onglet Améliorer.
- **Les petites boucles (M36).** Roadmap P35 : les voisins prennent le relais des gestes répétés, jamais de la cueillette (décision D27).
  - **Le conseil mène les projets.** Avec **l'assemblée de quartier** (Canopée, §7.1), le conseil relance aussi les projets du quartier (§6.2) à chaque Saison, du moins cher au plus cher, dans la même file que ses améliorations : la moins chère des deux d'abord, et les autres coopératives l'attendent tant qu'elle ne coûte pas plus de 30 fois leur prochain bâtiment.
  - **Les amis du potager.** Une coopérative de la Canopée **ressème** chaque carré récolté et laissé nu (§9.7) : la culture du temps qu'il fait quand elle change le carré, sinon la culture suivante parmi celles débloquées (radis, tournesols, haricots, courges, fraises), pour que chaque carré tourne et profite de la rotation (§9.12). Ils **ne récoltent jamais** : la cueillette reste le geste du joueur et sa raison de revenir. Un carré jamais semé reste nu. Leur compteur compte les semis.
  - **Les apiculteurs.** Ils viennent avec la **seconde ruche** du verger (§9.8), sans talent. Au-delà de **deux pots** gardés pour les envolées et les demandes, le miel part seul vers le grand chantier en cours (§6.6) : celui dont l'étape demande le moins de pots encore, sans dépasser ce qu'elle demande, et l'étape se bâtit si tout est payé. Leur compteur compte les pots portés.
  - **Sur la carte.** Le vélo rouge des amis du potager fait la rue au sud de la cour, le vélo miel des apiculteurs l'avenue du nord.
  - **Équilibrage.** Le joueur de référence (§8) joue la v5 : rotation avec les fraises, saluts, grand soleil avancé. 1ʳᵉ Saison 66 min, 1ᵉʳ Cycle 2 h 39 (cible 2 h 45) ; Cycles 2 à 4 en 36, 36 et 43 min (cibles 35, 35 et 45) ; essaimages à 4 h et 5 h de jeu, pile sur leurs cibles (6 h pour le second après M35) : la rotation remplit plus de paniers, qui avancent les grands chantiers.
  - **Sauvegarde.** Version 37 : les deux talents de la Canopée et les compteurs des deux coopératives, à zéro pour une sauvegarde plus ancienne.
- **Sur la carte.** Chaque coopérative est un vélo-cargo à sa couleur qui fait sa tournée dans les rues du quartier tant qu'elle travaille ; à chaque achat, un anneau doré part du vélo, et le bâtiment acheté apparaît sur la carte comme d'habitude. Une coopérative à l'arrêt gare son vélo. Avec les animations réduites (option ou réglage de l'appareil), les vélos restent garés.

### 7.3 Saisons à défi (M8)

À partir de la 2ᵉ Saison, l'écran des Saisons propose, au moment de replanter, de faire de la Saison suivante une **Saison à défi** : une contrainte pour toute la Saison, montrée par la lumière de la scène plutôt que par du texte. Atteindre l'objectif de Lumière dans la Saison **lève la contrainte** pour le reste de la Saison, ramène une espèce rare de l'Herbier (§9.5) et donne un bonus gardé pour toujours. Chaque défi ne se gagne qu'une fois ; une Saison libre reste toujours possible.

| Défi | Contrainte | Objectif dans la Saison | Espèce | Bonus pour toujours | Scène |
|---|---|---|---|---|---|
| La Saison des nuages | Ni Panneaux de balcon ni Centrales à miroirs | 2 Md | Martin-pêcheur | +2 % de production par parcelle restaurée | Ombres de nuages qui glissent sur les toits |
| La Saison sauvage | Aucune amélioration (ni le joueur ni le conseil de quartier) | 200 M | Orchis pyramidal | Synergies ×1,25 | Herbes hautes au bord de la carte |
| La Saison sobre | Au plus 25 exemplaires de chaque bâtiment | 3 Md | Lucane cerf-volant | Bâtiments 5 % moins chers | Lumière chaude et sèche |
| La Saison des mains | Production des bâtiments ÷10 | 50 M | Chouette hulotte | Valeur du clic ×3 | Crépuscule sur les machines |

- **Règles.** Un bâtiment interdit ou plein reste affiché avec l'étiquette « Pas cette Saison » ou « Au plus 25 » ; ni le joueur ni les Coopératives (§7.2) ne peuvent l'acheter. Les Boutures (§7.1) ne gardent que ce que le défi autorise. Les bonus des défis gagnés suivent la forme commune des parcelles, projets et talents (`Bonus`), donc se combinent avec eux comme des synergies.
- **Pendant le défi.** Une pastille sous le compteur montre l'espèce à gagner, le nom du défi et une jauge qui se remplit avec la Lumière de la Saison. À la victoire, la contrainte se lève, la scène retrouve sa lumière et l'espèce apparaît sur la carte.
- **Rythme.** Le joueur de référence (§8) les gagne en 3ᵉ Saison en 33 à 40 min, contre une demi-heure environ pour une Saison libre : un peu plus long, jamais une punition. Le test du simulateur garde chaque défi entre 20 min et 1 h.


### 7.4 La Biorégion et le Cycle de l'eau (M9)

Le quartier s'ouvre sur sa biorégion : une plaine de champs entre quatre collines, traversée par la rivière qui passe sous la ville. Une deuxième ressource, l'**Eau**, et un deuxième prestige, le **Cycle de l'eau**, au-dessus des Saisons (décision D4 de la feuille de route). `src/game/bioregion.ts` et `src/game/cycles.ts`.

**Ouverture.** Dès la 3ᵉ Saison (deux Saisons accomplies), puis pour toujours. La 1ʳᵉ et la 2ᵉ Saison gardent leurs décisions.

**Collecteurs d'eau.** Bâtis avec de la Lumière, ils recueillent de l'Eau chaque seconde, en ligne comme hors ligne. Chacun coûte **4 fois** le précédent (contre +15 % pour un bâtiment) : l'Eau suit le temps passé plus que la Lumière, qui s'emballe en fin de Saison. Chaque collecteur se lie à un bâtiment du quartier (**+1 % d'Eau par exemplaire** du bâtiment), comme une synergie.

| Collecteur | 1ᵉʳ prix (Lumière) | Eau / s | +1 % par |
|---|---|---|---|
| Citernes de toit | 1 M | 1 | Potager sur le toit |
| Noues | 50 M | 8 | Héliotrope en pot |
| Mares | 2 Md | 50 | Serre communautaire |
| Ruisseaux rouverts | 100 Md | 400 | Canopée urbaine |

L'Eau est multipliée par les Sources (+10 % chacune) et par le quartier déjà restauré : Jardins de pluie ×1,25, Rivière retrouvée ×1,5, projet Récupération de l'eau de pluie ×1,25 (nouveau bonus `water`, forme commune `Bonus`).

**Sites de la biorégion.** Étendus avec l'Eau, niveau après niveau (×2,5 le prix à chaque niveau). Chaque niveau ajoute **+25 %** (additif dans le site) à la production de deux bâtiments du quartier : la biorégion nourrit la ville, plutôt qu'un multiplicateur isolé.

| Site | 1ᵉʳ niveau (Eau) | Bâtiments relevés |
|---|---|---|
| Zones humides | 60 | Héliotrope en pot, Potager sur le toit |
| Prairies agrivoltaïques | 600 | Panneau de balcon, Centrale à miroirs |
| Forêts-jardins | 6 000 | Serre communautaire, Ferme verticale |
| Forêt ancienne | 60 000 | Canopée urbaine, Arcologie vivante |

Un collecteur apparaît quand la Saison a gagné la moitié de son premier prix, un site quand le Cycle a recueilli la moitié du sien ; le suivant reste une silhouette avec son prix. L'Eau, les collecteurs et les sites **restent d'une Saison à l'autre**.

**Le Cycle de l'eau (deuxième prestige).**

```
sourcesTotalesMéritées = floor( sqrt( eauTotaleTousCycles / 5e5 ) )
sourcesGagnées         = sourcesTotalesMéritées − sourcesDéjàObtenues
bonusSources           = +10 % de production par Source (multiplicateur à part)
                         +10 % d'Eau par Source
                         chaque Graine vaut +1 % de plus par Source (5 % → 6 % avec une Source)
```

- **Remis à zéro :** tout ce qu'une nouvelle Saison remet à zéro, les **Graines** (les Graines ne comptent plus que la Lumière du nouveau Cycle), l'Eau, les collecteurs et les sites, un défi en cours.
- **Conservé :** les Sources, **le delta et ses bras** (§7.5), les **talents et la Canopée de l'Arbre des Saisons** (leurs Graines sont « enracinées » : on ne les repaie pas, `rootedSeeds`), les parcelles, l'Herbier, les défis gagnés, les jalons, le nombre de Saisons, les coopératives, les statistiques et les options. Le Cycle ouvre aussi la Saison suivante.
- Disponible dès qu'une Source est à gagner ; l'écran conseille d'attendre **5 Sources** pour le premier (« La rivière n'est pas encore prête »), sans bloquer.
- **Rythme.** Le joueur de référence (§8, chaque Saison jouée jusqu'à doubler ses Graines, une fois mûres) ouvre la Biorégion vers 2 h et peut lancer son premier Cycle conseillé vers **2 h 45** ; le test du simulateur le garde dans les ±30 %. Mesuré à 2,5 clics/s : la 3ᵉ Saison dure ~24 min (la Biorégion s'ouvre et la Lumière part dans les collecteurs), puis chaque Saison dure les 15 minutes de maturité des Graines (§7). Avant les Graines mûres et le sol profond, le Cycle arrivait vers 2 h 50 au bout de Saisons de 1 à 3 minutes.

**Écrans.** Un panneau **« La Biorégion »** sous « Bâtir » (onglet Bâtir sur mobile) liste les collecteurs (Bâtir ☀) puis les sites (Étendre 💧), avec l'Eau en réserve et par seconde. Une pastille d'Eau rejoint le compteur, puis une pastille des Sources. L'écran **« Le Cycle de l'eau »** (menu, dès qu'une Source est à gagner) reprend celui des Saisons : Sources, à faire jaillir, bonus avant/après, ce qui repart de zéro et ce qui reste, confirmation ; son ornement est une goutte qui tombe sous l'arche et ses ronds dans l'eau.

**Sur la carte.** Une quatrième vue, **« La Biorégion »**, s'ouvre avec la 3ᵉ Saison (la carte y glisse une fois) : la ville et ses faubourgs au centre, puis la plaine. Sans texte, la carte raconte la biorégion qui revit :

- la rivière descend des collines, passe en canal sous les faubourgs et rejoint celle de la ville ; des reflets glissent au fil de l'eau ;
- chaque niveau de site transforme des champs : roselières et mares le long de la rivière (zones humides), prairies fleuries sous des rangées de panneaux avec quelques moutons (prairies agrivoltaïques), bosquets fruitiers à plusieurs étages (forêts-jardins), et la forêt ancienne qui gravit les collines anneau par anneau ;
- les collecteurs se voient aussi : citernes rondes sur les toits et noues plantées le long des trottoirs dans la ville, mares au bord des faubourgs, ruisseaux qui descendent des collines vers la rivière ;
- la plaine verdit à mesure que les sites grandissent, et une averse traverse lentement la région tant que l'Eau coule ;
- chaque nouvel élément pousse avec l'entrée habituelle de la carte (anneau doré). Avec les animations réduites, ni averse ni reflets.

**Jalons (12 de plus, famille « La Biorégion »).** Recueillir 1 000, 1 M, 1 Md Eau au total ; 10 et 50 collecteurs ; 1, 10 et 25 niveaux de sites ; « Bassin versant » (chacun des quatre sites étendu) ; 1 et 3 Cycles de l'eau ; caché : « Grandes eaux » (faire jaillir 25 Sources d'un coup).

### 7.5 Le delta des Sources (M15)

Les Sources deviennent elles aussi une monnaie à dépenser, sur le modèle des Graines dans l'Arbre (§7.1) : ouvrir un **bras du delta** coûte des Sources sans rien retirer à leur bonus (le bonus compte toutes les Sources obtenues, le delta se paie sur celles qui restent à dépenser). Le delta s'ouvre avec le premier Cycle de l'eau et se garde pour toujours. Chaque bras **change une règle** de la Biorégion ou des Saisons plutôt que d'ajouter de la vitesse (décision de la feuille de route, P13). `src/game/delta.ts` et `src/game/cycleChallenges.ts`.

| Bras | Coût (Sources) | Effet |
|---|---|---|
| Bras des coteaux | 2 | Ouvre un cinquième site de la biorégion, **les Coteaux** |
| Bras des crues | 2 | Ouvre les **Cycles à défi** |
| Bras des semences | 3, puis 6 | Les Graines mûrissent en 12 min, puis 10 min (au lieu de 15, §7) |
| Bras de la mémoire | 5 | Après un Cycle, la **moitié** de chaque collecteur et de chaque niveau de site reste (arrondie en dessous) |
| L'éclusier | 8 | Relance le Cycle tout seul, au palier choisi |

Tout le delta coûte 26 Sources, soit plusieurs Cycles : le joueur de référence en a ~5 au premier Cycle conseillé.

**Les Coteaux.** Vignes en terrasses et murets de pierre sèche sur le flanc sud des collines. Comme les autres sites, ils s'étendent avec l'Eau (1ᵉʳ niveau 3 000 Eau, ×2,5 par niveau) et repartent de zéro à chaque Cycle ; au lieu de relever deux bâtiments, chaque niveau donne **clic +25 %** (multiplicatif sur la valeur de base du clic) et rend les **visites** (§9.6) **10 % plus fréquentes** (l'intervalle est divisé par 1 + 0,1 × niveau). Ils n'entrent pas dans « Bassin versant », qui garde les quatre sites d'origine.

**L'éclusier.** Comme le semoir (§7.1), il est éteint par défaut et se règle à l'écran du Cycle : il lance un Cycle libre dès que les Sources à faire jaillir portent les Sources possédées à **×1,25, ×1,5, ×2 ou ×3**. Il n'interrompt jamais un Cycle à défi ni une Saison à défi en cours. Il tourne aussi hors ligne, comme le reste. Quand le semoir et l'éclusier sont prêts dans la même seconde, le Cycle passe d'abord.

**Cycles à défi.** Sur le modèle des Saisons à défi (§7.3) : au moment de lancer un Cycle, on peut choisir une contrainte pour tout le Cycle. Recueillir l'objectif d'Eau dans le Cycle lève la contrainte, ramène une espèce rare de la rivière (§9.5) et donne un bonus pour toujours. Chacun ne se gagne qu'une fois.

| Défi | Contrainte | Objectif (Eau dans le Cycle) | Espèce | Récompense |
|---|---|---|---|---|
| L'année sèche | Eau recueillie ÷4 | 2 M | Loutre d'Europe | Eau ×1,25 |
| La crue | Collecteurs ×10 plus chers | 5 M | Saumon atlantique | Production +10 % |
| L'eau dormante | Sites ×4 plus chers | 5 M | Cigogne noire | Synergies ×1,1 |

Pendant un Cycle à défi, une pastille dans la barre du haut montre le défi et l'avancée vers son objectif, comme pour une Saison à défi.

**Écran.** Sous le bilan du Cycle de l'eau, le **delta** est dessiné : la rivière descend sous l'arche et se divise en cinq bras ; un bras ouvert coule (bleu, avec une mare au bout), un bras fermé reste un lit sec en pointillés. Sous le dessin, chaque bras avec son effet et son bouton « Ouvrir ». Puis le réglage de l'éclusier (pastilles Éteint, ×1,25, ×1,5, ×2, ×3) et, quand un Cycle peut commencer, le choix d'un Cycle à défi. Aucun texte narratif.

**Sur la carte.** Chaque niveau des Coteaux dessine des terrasses de vigne sur les quatre collines, du bas vers le haut, avec l'entrée habituelle (anneau doré). Les trois espèces de la rivière vivent au fil de la Rivière retrouvée.

**Jalons (5 de plus, famille « La Biorégion »).** « Premier bras » et « Delta ouvert » (les 6 niveaux du delta) ; « L'éclusier veille » (5 Cycles lancés par l'éclusier) ; « Contre vents et marées » et « Gardien de la rivière » (1 puis 3 Cycles à défi réussis).

**Élargir les bras (M19).** Une fois le delta entièrement ouvert (26 Sources), quatre bras **s'élargissent** niveau par niveau, sur le modèle de la Canopée (§7.1) : 10 niveaux chacun, le 1ᵉʳ à 5 Sources, chaque suivant ×1,5 (environ 570 Sources par bras). Les Sources dépensées ne retirent toujours rien à leur bonus.

| Bras | Chaque élargissement |
|---|---|
| Bras des semences | Les Graines mûrissent 30 s plus tôt (10 min → 5 min au plus large) |
| Bras de la mémoire | 4 points de plus de chaque collecteur et niveau de site restent après un Cycle (50 % → 90 %) |
| Bras des coteaux | Les effets des Coteaux (clic, visites) +10 % |
| Bras des crues | Les récompenses des Cycles à défi gagnés +10 % (Eau ×1,25 devient ×1,275, etc.) |

Dans l'écran du Cycle, chaque bras élargissable montre sous son effet son élargissement (« élargi 3 fois sur 10 »), l'effet du suivant et le bouton « Élargir » avec son prix ; sur le dessin du delta, le bras coule plus large et sa mare grandit. **Sauvegarde.** Version 21 : les élargissements, à zéro pour une sauvegarde plus ancienne ; une sauvegarde qui en tient plus que ses Sources n'en paient les perd.

**Équilibrage.** Depuis M19, le simulateur (§8, « La fin de partie ») joue le delta et ses élargissements, mais pas les Cycles à défi. Le bras des semences raccourcit les Saisons tardives (15 → 10 min) sans revenir aux Saisons de quelques minutes d'avant la PR #35 ; le bras de la mémoire rend le début de Cycle moins long sans changer la formule des Sources.


### 7.6 Les villes sœurs (M23)

La **troisième couche** de prestige (roadmap P22, décision D11 confirmée par les mesures de M19). Code dans `src/game/cities.ts` et `src/game/cityData.ts`, écran `src/ui/Cities.tsx` (bouton « Villes sœurs » du menu), carte de la région `src/ui/RegionMap.tsx`, paysages sur la carte `src/ui/LandscapeArt.tsx`.

**Essaimer.** Le bouton apparaît quand **le delta est entièrement ouvert** (§7.5, vers le 6ᵉ Cycle). Essaimer demande **25 Sources gagnées dans la ville** où l'on vit, et ni Saison ni Cycle à défi en cours. Le joueur choisit parmi **cinq paysages** (décision D14 ; la forêt et le marais depuis M30, décision D21) et fonde une ville sœur :

- **Recommence :** tout ce qu'un Cycle remet à zéro (Lumière, bâtiments, améliorations, projets, Graines, Eau, collecteurs, sites), plus **l'Arbre des Saisons et la Canopée** (« relancer les Saisons ») et les **Sources non dépensées**.
- **Reste :** le **delta** (ses bras et élargissements, gardés pour toujours, et les Sources qui les ont payés), l'Herbier, les Jalons, les parcelles et les quartiers voisins, le décor, les grands chantiers, le potager, le verger et les villes déjà fondées.
- **Les Sources d'une ville sœur** viennent de l'Eau recueillie depuis sa fondation, au-dessus de celles qu'elle garde : le rythme des Cycles repart du début, avec tous les bonus gardés.

**Les Savoirs.** Essaimer rapporte **⌊√(Sources gagnées dans la ville) / 2⌋ + ⌊log₁₀(1 + Graines du Cycle)⌋** Savoirs : les Graines, qui n'avaient plus d'usage une fois la Canopée complète (§8, fin de partie), comptent enfin (décision D12 tenue : ni les chantiers ni le reste ne les dépensent). Chaque Savoir gagné donne **+3 % de production** pour toujours, qu'il soit dépensé ou non.

| Paysage | Dans la ville (sa règle) | Une fois quittée (le réseau) | Sur la carte |
|---|---|---|---|
| Le littoral | Eau ×2, Panneaux de balcon ×0,5 | Eau ×1,1 | Une baie et sa plage à l'est, entre les deux collines |
| La montagne | Papillon et visites 25 % plus fréquents, Eau ×0,75 | Papillon 5 % plus fréquent | Une crête de sommets enneigés au nord, entre les collines |
| La plaine | Bâtiments 15 % moins chers, clic ×0,5 | Bâtiments 3 % moins chers | Des champs de blé au sud, entre les collines |
| La forêt (M30) | +4 % de production par parcelle restaurée (les arbres des parcelles comptent double), verger ×1,5 plus vite, Centrale à miroirs ×0,5 | Verger ×1,1 plus vite | Un bois profond à l'ouest, feuillus et sapins, entre les collines |
| Le marais (M30) | Biodiversité ×1,5 (les espèces comptent plus), Eau ×1,5, Fermes verticales ×0,5 | Biodiversité ×1,05 | Des mares, des nénuphars et des roseaux au sud, le long de la rivière |

Le paysage fait partie du sol de la Biorégion (vue « La Biorégion ») : les deux rendus le dessinent, le rendu PixiJS le prenant au dessin SVG comme le reste de la terre (§10.4).

La ville natale, une fois quittée, envoie **+3 % de production**. Chaque ville quittée fait aussi apporter **2 boutures de plus** aux voisins qui visitent (§9.6, Troc de graines). Il n'y a pas de serveur : le réseau est dans la sauvegarde.

**L'atelier des Savoirs.** Des règles apprises pour toutes les villes à venir. Depuis M30 (roadmap P29, décision D21), certaines s'approfondissent **niveau par niveau**, le prix doublant à chaque niveau, comme la Canopée et les bras du delta : les Savoirs gardent un usage. Deux règles s'ajoutent, les puits partagés et les écoles.

| Règle | Savoirs par niveau | Effet par niveau |
|---|---|---|
| La mémoire des eaux | 5, 10, 20 | Une nouvelle ville garde un quart des Sources non dépensées (les trois quarts au niveau 3) |
| Les semis voyageurs | 6 | L'Arbre des Saisons et la Canopée restent en essaimant |
| Les bâtisseurs | 8 | Les sites de la Biorégion s'élèvent seuls, les moins chers d'abord, quand l'Eau suffit (3 niveaux par pas au plus) |
| Les échanges | 12, 24, 48 | Le réseau envoie une fois plus (×2, ×3, ×4) |
| Les puits partagés (M30) | 6, 12, 24 | Une nouvelle ville garde un tiers des collecteurs d'eau (tous au niveau 3) |
| Les écoles (M30) | 10, 20, 40, 80, 160 | Chaque Savoir gagné donne +1 % de production de plus (+3 % à +8 %) |

La roadmap proposait aussi que les quartiers voisins restent en essaimant (c'est déjà le cas) et une place d'alliance de plus (les villes sœurs en donnent déjà jusqu'au plafond) : les puits et les écoles les remplacent.

- **Écran.** Les Savoirs et leur bonus, la carte de la région (la ville natale au centre, les villes fondées autour, reliées par des fils dorés, la ville actuelle cerclée), la règle de la ville actuelle, le réseau, les cinq paysages avec leur règle, leur réseau et le bouton « Essaimer », puis l'atelier, avec le niveau de chaque règle et le prix du suivant (« Approfondir »).
- **Simulateur.** `npm run simulate` essaime vers la plaine à la fin de la partie mesurée (après le 6ᵉ Cycle, 59 Sources dont 34 hors du delta) : **8 Savoirs** (3 par les Sources, 5 par les 130 000 Graines), puis il joue la ville sœur. Son premier Cycle est conseillé après **19 min**, contre 2 h 48 pour la ville natale : tout ce qui reste (delta, Savoirs, Jalons, Herbier) fait repartir vite, et les 25 Sources de la ville suivante demandent ensuite quelques heures, comme les Cycles 2 à 4 de la ville natale.
- **Jalons (2).** « Essaimage » (une ville sœur), « Les villes sœurs » (trois). 138 jalons en tout (140 avec M24, §9.9).
- **Sauvegarde.** Version 24 : la ville actuelle, les villes quittées, les Savoirs, l'atelier, et les Sources et l'Eau de la fondation, à zéro pour une sauvegarde plus ancienne. Version 31 (M30) : le niveau de chaque règle de l'atelier ; une règle apprise avant compte comme son premier niveau.

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
- **Le prestige compense le mur final.** Avec `sqrt`, gagner 10× plus de Graines demande 100× plus de Lumière : les Saisons longues restent rentables, mais le retour diminue, ce qui pousse à relancer régulièrement. Au-delà de 100 Graines, le sol s'approfondit (racine cubique) et chaque Saison attend que ses Graines mûrissent (15 min) : la production ne peut plus rattraper en une minute la Lumière d'un doublement, et les Saisons tardives s'allongent au lieu de raccourcir (§7).

### Rythme cible (1ʳᵉ partie, joueur actif)

| Événement | Moment cible |
|---|---|
| 1ᵉʳ Héliotrope en pot | < 15 s |
| 1ᵉʳ Panneau de balcon | ~35 s |
| 1ᵉʳ Potager sur le toit | ~1 min 30 |
| 1ʳᵉ Serre communautaire | ~5 min 30 |
| 1ʳᵉ Ferme verticale | ~12 min |
| 1ʳᵉ Centrale à miroirs | ~21 min |
| 1ʳᵉ Canopée urbaine | ~37 min |
| 1ʳᵉ Arcologie vivante | ~57 min |
| 1ʳᵉ Saison conseillée (10 Graines) | ~1 h 07 |

Depuis l'équilibrage adouci (après le MVP), ces cibles sont environ un tiers plus courtes qu'au MVP (qui visait 4 h pour la 1ʳᵉ Saison), et l'écart entre deux paliers grandit doucement (×3 au début, ×2 au milieu, puis moins) au lieu de laisser un long creux avant les derniers bâtiments. Les synergies (§5.3) raccourcissent ensuite surtout la fin de la 1ʳᵉ Saison : la Saison conseillée passe de ~2 h 40 à ~2 h 15, sans toucher au début de partie. Les améliorations de clic précoces (§5.2) accélèrent ensuite surtout le début : le Potager arrive vers 1 min 30 au lieu de 2 min 40. Avec les parcelles et les projets du jalon 6 (§6.1, §6.2), qui accélèrent la seconde moitié, la Saison conseillée arrive vers 1 h 30 – 1 h 40. Les synergies, les Jalons et l'Herbier l'ont ensuite avancée vers 1 h 12 – 1 h 15, à −28 % de l'ancienne cible de 1 h 40, au bord de la marge : M19 rapproche les trois dernières cibles de ce rythme voulu (Canopée 50 → 45 min, Arcologie 1 h 20 → 1 h 10, Saison conseillée 1 h 40 → 1 h 20), sans changer le jeu. Les bâtiments qui grandissent (M26), le pollen (M27) et les moments qui s'enchaînent (M31) ont ensuite avancé toute la seconde moitié de la Saison : sur six graines de hasard, la Centrale arrivait entre −34 % et −12 % de sa cible, hors de la marge pour une graine. Les quatre dernières cibles suivent donc à nouveau ce rythme (Centrale 26 → 21 min, Canopée 45 → 37 min, Arcologie 1 h 10 → 57 min, Saison conseillée 1 h 20 → 1 h 07), toujours sans changer le jeu.

### Outil de simulation

L'équilibrage doit être vérifié par un **simulateur sans interface** qui rejoue une stratégie simple (acheter à chaque instant l'option au meilleur ratio coût / gain de production) et sort le moment de chaque événement du tableau ci-dessus. Il réutilise exactement les mêmes fonctions de calcul et les mêmes données que le jeu. Tout changement de chiffre dans ce document devrait être accompagné d'une sortie du simulateur.

**Implémentation (jalon 2).** `src/game/simulator.ts`, lancé par `npm run simulate`, et vérifié par un test qui échoue si un événement sort de ±30 % de sa cible (le 1ᵉʳ Héliotrope en pot n'a qu'un plafond de 15 s). Depuis le jalon 3, il joue aussi une **seconde Saison** : il lance la Nouvelle Saison dès les 10 Graines conseillées, rejoue la même stratégie avec le bonus de +50 %, et un test vérifie que chaque événement arrive plus tôt que dans la première Saison (critère de fin du jalon 3, §12). Le joueur de référence clique **2,5 fois par seconde**. À chaque décision, il choisit l'option qui minimise *attente pour se l'offrir + coût / gain de production* (gain mesuré clic compris), et il essaie chaque nouveau générateur dès qu'il peut se l'offrir. Depuis le jalon 4, les Jalons se débloquent pendant la simulation comme en jeu, et le joueur de référence **attrape chaque Papillon doré** dès qu'il apparaît (tirages aléatoires reproductibles, graine fixe). Le résultat dépend un peu de la graine, surtout en milieu de partie où un Papillon tombe plus ou moins tôt (chiffres sous le tableau ci-dessous).

Sortie actuelle (mesurée après le peaufinage des synergies du 2026-10-13, graine 0) :

| Événement | Cible | Simulé, 1ʳᵉ Saison | Écart | Simulé, 2ᵉ Saison (10 Graines) |
|---|---|---|---|---|
| 1ᵉʳ Héliotrope en pot | < 15 s | 10 s | ok | 1 s |
| 1ᵉʳ Panneau de balcon | ~35 s | 31,5 s | −10 % | 6 s |
| 1ᵉʳ Potager sur le toit | ~1 min 30 | 1,5 min | 0 % | 36 s |
| 1ʳᵉ Serre communautaire | ~5 min 30 | 5,3 min | −3 % | 1,6 min |
| 1ʳᵉ Ferme verticale | ~12 min | 10,2 min | −15 % | 3,5 min |
| 1ʳᵉ Centrale à miroirs | ~21 min | 18,9 min | −10 % | 4,2 min |
| 1ʳᵉ Canopée urbaine | ~37 min | 38,2 min | +3 % | 11,3 min |
| 1ʳᵉ Arcologie vivante | ~57 min | 56,2 min | −1 % | 18,9 min |
| Saison conseillée (2 Md de Lumière dans la Saison) | ~1 h 07 | 59 min | −13 % | 19 min |

Le joueur simulé atteint 20 Jalons, attrape 17 Papillons, achète 45 améliorations (dont 8 de clic, 12 synergies entre bâtiments, 3 avec le clic et 2 entre améliorations), restaure 5 parcelles et mène 5 projets pendant sa 1ʳᵉ Saison. Sur six graines de hasard, la 1ʳᵉ Saison suit ses cibles : Ferme verticale entre −15 % et 0 %, Centrale entre −18 % et +9 %, Canopée entre −10 % et +3 %, Arcologie entre −12 % et +4 %, Saison conseillée entre −9 % et +1 %, toutes dans les ±30 %. La 2ᵉ Saison, qui garde les parcelles, atteint les mêmes paliers environ 40 % plus vite. Les tout premiers achats, portés par le clic que les Graines n'augmentent pas, n'accélèrent que peu.

> Restaurer le quartier (M6) : le joueur de référence considère aussi les parcelles et les projets, avec la même règle (attente + coût / gain de revenu). Ceux dont l'effet ne touche pas le revenu (Papillon, plafond hors ligne, remises) ne lui rapportent rien de mesurable et ne sont achetés que lorsqu'un autre effet les rend rentables (les Pistes cyclables, par exemple, donnent du prix à chaque parcelle). Dans sa 1ʳᵉ Saison, il restaure cinq parcelles et mène cinq projets, et le rythme s'accélère encore : Ferme verticale à 15,0 min (0 %), Centrale à 31,6 min (−10 %), Canopée à 55,2 min (−15 %), Arcologie à 1 h 28 (−16 %), Saison conseillée à 1 h 46 (−21 %, la marge la plus faible). Les effets ont été réduits pour rester dans les ±30 % (Batteries partagées +5 % par type au lieu de +25 %, Verger ×1,5 au lieu de ×2, Eau de pluie ×1,25, Pistes cyclables +2 % par parcelle). Comme les parcelles restent acquises, la 2ᵉ Saison est bien plus rapide : Saison conseillée en 1 h au lieu de 1 h 22.

> La terre se souvient (M7) : la 1ʳᵉ Saison ne change pas (pas encore de Graine à semer). Au début de la 2ᵉ, le joueur de référence sème ses 10 Graines dans cet ordre, tant qu'elles suffisent : les jardiniers, Fleurs nectarifères, Mycorhizes, les maraîchers, Haies fleuries, Boutures, Sous-bois, Veilleurs de nuit (ordre complet dans `REFERENCE_TALENTS`). Les deux coopératives achètent pour lui pendant qu'il joue sa stratégie habituelle (environ 45 et 95 achats). Sa 2ᵉ Saison conseillée passe de 52 min à 43 min (Arcologie à 36 min au lieu de 41), sans toucher aux cibles de la 1ʳᵉ.
>
> Le vivant revient (M8) : les espèces de l'Herbier (§9.5) s'ajoutent à la biodiversité dès la 1ʳᵉ Saison (le joueur de référence en ramène 8 : Coquelicot, Fougère, Abeille, Coccinelle, Bourdon, Grenouille, Hérisson, Citron). Comme Antoine le souhaite, c'est une synergie de plus plutôt qu'un changement de valeurs. Avec les 92 jalons et les jalons de M8, la Saison conseillée passe de 1 h 23 à 1 h 14 (−26 % de la cible, encore dans les ±30 %), l'Arcologie à 1 h 01 et la 2ᵉ Saison à 36 min. Les Saisons à défi (§7.3) sont jouées comme 3ᵉ Saison : `npm run simulate` affiche aussi le moment où chacune est gagnée.

> Freiner l'emballement des Saisons (2026-10-11, §7) : le joueur de référence joue chaque Saison jusqu'à doubler ses Graines, une fois mûres, et sème ses talents à chaque Saison. Mesuré avec les visites (M11) et les quartiers voisins (M12), sur trois graines de hasard (0, 1 et 2), en prolongeant le parcours de `npm run simulate` ; la colonne « Avant » est la mesure d'avant M11 :
>
> | Saison | Avant | Après | Graines à la fin (après) |
> |---|---|---|---|
> | 1ʳᵉ | 1 h 14 | 1 h 15 – 1 h 16 | 10 |
> | 2ᵉ | 46 min | 40 – 44 min | 20 |
> | 3ᵉ (la Biorégion s'ouvre) | 23 min | 23 – 26 min | 40 |
> | 4ᵉ | 9 min | 15 min | 290 – 340 |
> | 5ᵉ | 2,7 min | 15 min | 1 300 – 1 650 |
> | Suivantes, jusqu'au Cycle | 1 à 3 min | 15 min | 3 000 – 3 900 |
> | 1ᵉʳ Cycle conseillé | 2 h 52 | 2 h 46 (graine 0) | |
> | Trois Saisons après le Cycle | quelques minutes | 15 min chacune | 100 – 180, 2 100 – 2 400, 7 500 – 8 300 |
> | Les trois suivantes | — | 17 – 20 min, 37 – 43 min, 1 h 28 – 1 h 32 | doublées à chaque fois |
>
> Les trois premières Saisons ne changent pas (elles durent déjà plus de 15 minutes, et le sol ne s'approfondit qu'à 100 Graines). Ensuite, chaque Saison dure au moins ses 15 minutes de maturité, puis s'allonge d'elle-même : au-delà de ~60 000 Graines, doubler demanderait 4 h de Saison, et le joueur replante plutôt avec ×1,3 à ×1,5 ou prépare le Cycle suivant. Le test du simulateur vérifie que chaque Saison entre la 3ᵉ et le Cycle dure au moins 15 minutes, que les cinq Saisons après le Cycle aussi, et que la 5ᵉ dure plus de 20 minutes.

### La fin de partie (M19)

Le simulateur joue aussi les **Cycles qui suivent le premier** (`simulateCycles`, et la fin de `npm run simulate`). Au début de chaque Cycle, le joueur de référence ouvre les bras du delta dans l'ordre semences, coteaux, mémoire, semences, éclusier, crues (`REFERENCE_DELTA`), puis élargit le bras le moins large (§7.5) ; à chaque Saison, il sème ses talents puis le niveau de Canopée le moins cher (§7.1). Il joue chaque Saison jusqu'à doubler ses Graines, une fois mûres, et lance le Cycle suivant quand ses Sources atteignent **×1,5** (le réglage par défaut de l'éclusier). Un test (`src/game/endgame.test.ts`) vérifie les Cycles 2 à 4 à ±30 % de leur cible.

| Cycle | Cible | Simulé | Saisons | Sources à la fin |
|---|---|---|---|---|
| 1ᵉʳ (conseillé) | ~2 h 45 | 2 h 46 | une dizaine | 5 |
| 2ᵉ | ~35 min | 36 min | 3 de 12 min | 9 |
| 3ᵉ | ~35 min | 36 min | 3 de 12 min | 15 |
| 4ᵉ | ~45 min | 45 min | 4, de 10 à 15 min | 25 |
| 5ᵉ | (~1 h) | 55 min | 5, de 10 à 15 min | 38 |
| 6ᵉ | (~1 h 10) | 1 h 08 | 5, la dernière de 28 min | 59 |

Ce qu'en tire la feuille de route (décision D11) :

- **Les Cycles s'allongent doucement** (35 min → 1 h 10) et les Sources croissent d'environ ×1,6 par Cycle : le delta (26 Sources) est ouvert au 6ᵉ Cycle, puis ses élargissements (§7.5) prennent le relais pendant de nombreux Cycles (environ 2 300 Sources pour tout élargir). La troisième couche (M23) se justifie : après une dizaine d'heures, chaque Cycle n'apporte plus qu'un bonus plat de plus.
- **La Canopée est complète dès le 2ᵉ Cycle** (~1 900 Graines quand une Saison en rapporte des milliers, 120 000 au 6ᵉ Cycle) : les Graines retrouvent un bonus plat. Depuis M23, les Graines du Cycle comptent dans les Savoirs d'un essaimage (§7.6), et les grands chantiers restent hors Graines (D12).
- **Les nombres restent loin de la limite** : 3 × 10²¹ de Lumière au total au 6ᵉ Cycle, très loin de 10³⁰⁸. Pas besoin de bibliothèque de grands nombres.

### Toute la partie (M30)

Roadmap P29 : le simulateur joue enfin tout (`src/game/wholeGame.ts`, `simulateWholeGame`, et la fin de `npm run simulate`). Le joueur de référence joue par **séances d'une heure**, puis s'absente **trois heures** pendant lesquelles le jeu continue hors ligne (§9.1) : quatre heures de temps réel par heure de jeu. À chaque départ et à chaque retour, il s'occupe des petites boucles : il récolte et ressème le potager (haricots, courges, tournesols et fraises, chaque carré prenant la culture qui suit la sienne, pour les variétés et la rotation depuis M36), cueille le verger, plante les arbres et pose les ruches dès que les paniers suffisent, paie une étape de grand chantier quand il peut la payer en entier (sa Lumière en moins de 10 min de production), choisit les alliances éveillées, sert les demandes remplies et lance aussitôt leurs coups de main. Depuis M36, il salue aussi chaque espèce revenue (§9.15) et avance le grand soleil dans la prévision une fois par Saison (§9.13). Les voies (§5.5), le pollen (§5.6) et le temps (§9.10) jouent comme avant. Il essaime dès que c'est permis, vers la plaine puis la forêt, et apprend à chaque fois les règles de l'atelier dans l'ordre mémoire, semis, bâtisseurs, écoles, puits, échanges. Un test (`src/game/wholeGame.test.ts`) vérifie les deux essaimages à ±30 % de leur cible.

| Étape | Cible (heures de jeu) | Simulé | Temps réel | Cycles dans la ville |
|---|---|---|---|---|
| 1ʳᵉ ville sœur | ~4 h | 4,0 h | 16 h | 4 après le premier |
| 2ᵉ ville sœur | ~5 h | 5,0 h | 20 h | 2 après le premier |

- **Plus court que sans les boucles.** Sans les absences ni les petites boucles, il fallait 6 Cycles après le premier pour essaimer (M23) ; avec trois heures hors ligne par heure de jeu, les grands chantiers et les alliances, il en faut 4. La ville sœur, qui garde le delta, les Savoirs et le reste, ne prend ensuite qu'une heure de jeu.
- **La grande floraison n'a pas de cible.** Elle demande l'Herbier complet, donc toutes les Saisons et tous les Cycles à défi, les visites de la ville et la trame bleue, que le joueur de référence ne joue pas. Au 2ᵉ essaimage, il a bâti deux étapes de chaque chantier et ramené 16 espèces sur 28. Écart avec la roadmap, qui proposait une trentaine d'heures pour la floraison : elle reste l'objectif de très long terme, sans test.
- **Plus rapide.** La production par seconde est gardée pour chaque état du jeu (`lightPerSecond`), qui ne change jamais : le simulateur va presque deux fois plus vite, sans rien changer au jeu.

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
- **Le retour en images (M17).** Sous le gain, une pastille par bâtiment qui a grandi pendant l'absence (achats des Coopératives, §7.2) avec son **nombre actuel**, les cultures prêtes du potager (§9.7), les Graines devenues mûres (leur nombre actuel) et les Saisons relancées par le semoir (§7.1). Sur la carte, la scène rejoue l'absence en accéléré, une fois au chargement : le soleil balaie la ville une fois par heure d'absence (au plus quatre), puis un anneau doré s'ouvre tour à tour sur chaque bâtiment qui a grandi, chaque carré mûri et l'héliotrope si ses Graines ont mûri. Rien quand les animations sont réduites. Code dans `src/game/offline.ts` (`offlineReport`), `src/ui/returnMap.ts` et `src/ui/ReturnReplay.tsx`.
- Les événements temporaires (Papillon doré) ne comptent pas hors ligne.

### 9.2 Papillon doré

Un papillon traverse l'écran à intervalle aléatoire (**toutes les 3 à 8 min**), reste cliquable **12 s**. Le cliquer donne un effet au hasard :

| Probabilité | Effet | Détail |
|---|---|---|
| 50 % | **Floraison** | Production ×7 pendant 60 s |
| 40 % | **Récolte** | Gain immédiat = min(15 % de la Lumière en réserve, 15 min de production) |
| 10 % | **Pollinisation** | Valeur de clic ×100 pendant 10 s |

C'est la principale raison de garder l'onglet ouvert et de jouer activement, sans être obligatoire.

Depuis M31 (§5.7), ces chances suivent le temps qu'il fait une fois le ciel ouvert, et chaque Papillon attrapé remplit un dixième de la jauge de pollen.

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

**Plus de jalons (post-M7, 2026-10-10).** Demande d'Antoine : renforcer le sentiment de progression avec des jalons créatifs ou liés à des actions et des événements du jeu. On passe à **92 jalons** (97 avec ceux de M8, ci-dessous, 109 avec ceux de M9, §7.4, 113 avec ceux de M11, §9.6, 116 avec ceux de M12, §6.4, 120 avec ceux de M13, §7.1, 125 avec ceux de M14, §9.7, 130 avec ceux de M15, §7.5, 134 avec ceux de M20, §6.6, 136 avec ceux de M22, §9.8, 138 avec ceux de M23, §7.6, 140 avec ceux de M24, §9.9, 142 avec ceux de M26, §5.5, 144 avec ceux de M27, §5.6, 149 avec ceux de M28, §9.10, 151 avec ceux de M29, §9.11, 153 avec ceux de M31, §5.7, 155 avec ceux de M32, §9.12, 156 avec celui de M33, §9.13, 157 avec celui de M34, §9.14, 159 avec ceux de M35, §9.15), toujours **+1 % chacun** (le simulateur reste dans les cibles du §8 : 1ʳᵉ Saison conseillée à 83 min au lieu de 88, ratio 0,83 ; 2ᵉ Saison 39 min au lieu de 43). L'écran les range par famille, avec le compte de chacune :

- **Lumière** : récolter 1 000, 1 M, 1 Md, 1 Bn, 1 Bd, 1 Tn, 1 Td, 1 Qn Lumière au total (8) ; produire 1 000, 1 M, 1 Md Lumière par seconde (3).
- **Bâtiments** : 1, 50, 100 et 200 exemplaires de chacun des 8 générateurs, dans la Saison en cours (32) ; « Mosaïque » (10 de chaque), « Courtepointe » (50 de chaque) ; cachés : « Jardin sauvage » (100 de chaque), « Tout dans le même pot » (50 Héliotropes en pot et aucun autre bâtiment).
- **Améliorations** (dans une même Saison) : 10, 25, 50, 75 améliorations ; « Fil doré » (une première synergie entre bâtiments), « Toile dorée » (les 18 synergies entre bâtiments), « Mains d'or » (les 10 améliorations du clic).
- **La fleur** : 10, 100, 1 000, 10 000, 100 000 clics ; un clic qui vaut 1 000 puis 1 M Lumière ; caché : « Graine qui dort » (récolter 1 000 Lumière dans une Saison sans aucun bâtiment).
- **Papillon doré** : 1, 10, 25, 50, 100 papillons ; « Pollen d'or » (cliquer la fleur pendant une Pollinisation) ; « Bouquet » et « Grand bouquet » (3 puis 5 effets en même temps, §5.7, M31) ; caché : « De justesse » (attraper le papillon dans ses 2 dernières secondes).
- **Le quartier** : 1, 4, 8 parcelles restaurées ; 1, 8, 15 projets dans une même Saison ; 1, 9, 17 talents de l'Arbre des Saisons ; 1 et 18 niveaux de la Canopée, « Cime » (la Canopée complète), « Semis spontané » (10 Saisons lancées par le semoir) (§7.1, M13) ; 1, 25, 250 récoltes du potager, « Croisement » et « Grainothèque » (§9.7, M14) ; 100 et 1 000 achats des coopératives ; 1, 10 et 18 espèces de l'Herbier revenues (§9.5, M8).
- **Saisons** : 1, 3, 5, 10, 25 Saisons ; 1 h et 24 h de jeu ; « Saison éclair » (la Lumière de 10 Graines en moins de 30 min de Saison) ; « Longue saison » (4 h dans la même Saison) ; « Moisson tardive » (gagner 50 Graines d'un coup) ; 1 puis 4 Saisons à défi réussies (§7.3, M8) ; cachés : « Photosynthèse lente » (10 min sans rien acheter, avec au moins un bâtiment), « Semis précoce » (lancer une Saison avant les 10 Graines conseillées).

Les jalons sont conservés d'une Saison à l'autre. Chaque jalon atteint **éclot** en haut de l'écran : un médaillon dont l'anneau doré se dessine, une couronne de laurier qui pousse feuille à feuille, des pétales lilas qui s'ouvrent, avec le nom du jalon, sa condition et « Production +1 % » ; il s'efface après environ 4 s. Plusieurs jalons atteints ensemble éclosent l'un après l'autre (au-delà de trois d'un coup, un seul médaillon les compte). Le compteur du bouton « Jalons » scintille à chaque nouveau jalon. Pas de texte d'ambiance : seulement le nom et la condition. Avec les animations réduites, le médaillon apparaît et disparaît sans mouvement. Les lecteurs d'écran entendent « Jalon atteint : nom ».

### 9.4 Sauvegarde

- Sauvegarde automatique toutes les 30 s et à la fermeture de l'onglet.
- Export / import d'une sauvegarde en texte (base64) depuis les Options.
- Remise à zéro complète avec double confirmation.
- Chaque sauvegarde porte un numéro de version, avec une migration quand le format change.

### 9.5 L'Herbier (M8)

Les espèces reviennent à mesure que le quartier reverdit. Chacune revient par une condition du jeu, puis vit sur la carte, près de ce qui l'a ramenée, dans un petit médaillon (les insectes butinent, les oiseaux sautillent, les martinets et la chauve-souris volent au-dessus des toits). Elles restent d'une Saison à l'autre.

| Espèce | Revient avec | Espèce | Revient avec |
|---|---|---|---|
| Coquelicot | Rue jardin | Grenouille rousse | Rivière retrouvée |
| Abeille | 25 Potagers sur le toit | Hérisson | Parc du parking |
| Fougère | Jardins de pluie | Rouge-gorge | Verger de l'entrepôt |
| Coccinelle | 25 Serres communautaires | Martinet | Toits vivants |
| Bourdon | Corridor des pollinisateurs | Ver luisant | Projet Fête des lumières |
| Moineau | 100 Héliotropes en pot | Pipistrelle | Talent Veilleurs de nuit |
| Mésange bleue | 10 Canopées urbaines | Martin-pêcheur | La Saison des nuages (§7.3) |
| Citron | 5 Papillons dorés attrapés | Orchis pyramidal, Lucane cerf-volant, Chouette hulotte | Les trois autres défis (§7.3) |

- **Effet, par la biodiversité.** Chaque espèce revenue compte comme un palier de biodiversité de plus (+2 %, §5.4) ; elle profite donc de tous les multiplicateurs de biodiversité des parcelles et de l'Arbre. L'Herbier complet (les 18 espèces du quartier) multiplie toute la biodiversité par 1,5. Trois espèces de la rivière, la loutre d'Europe, le saumon atlantique et la cigogne noire, reviennent avec les Cycles à défi (§7.5) : elles comptent chacune un palier de plus, mais ne sont pas exigées pour l'Herbier complet, que les joueurs qui l'avaient gardent. Quatre espèces de la ville, l'alouette des champs, l'hirondelle rustique, la libellule déprimée et le rougequeue noir, reviennent de même avec les visites de la ville (§9.6, M18), chacune après cinq accueils de son visiteur ; elles non plus ne sont pas exigées. 25 espèces en tout.
- **Écran.** « Herbier » s'ouvre du menu dès la première espèce (ou après la 1ʳᵉ Saison). Une planche par espèce : le dessin en couleur dans un médaillon doré une fois revenue, une silhouette pâle avant ; sous chaque nom, ce qui la ramène. Aucun texte narratif.
- **Retour.** Une notification « De retour dans le quartier : Hérisson » et l'apparition en douceur du médaillon sur la carte (sans animation au chargement, ni avec les animations réduites).

### 9.6 Les visites du quartier (M11)

Le quartier restauré raconte ses temps forts sans un mot (§1, §6) : de temps en temps, un **visiteur** s'arrête sur la carte, à côté de la fleur, dans la vue du Balcon pour que tout joueur le voie. Un cercle doré pointillé respire autour de lui ; un clic (ou Entrée) l'accueille. Code dans `src/game/visits.ts`, dessins dans `src/ui/VisitArt.tsx`.

| Visiteur | Vient dès | Sur la carte | Effet de l'accueil | Synergie |
|---|---|---|---|---|
| **Les voisins et leurs boutures** | 10 Héliotropes en pot | Un vélo-cargo à remorque de jeunes plants arrive sur l'avenue sous l'immeuble | +1 exemplaire gratuit du bâtiment le plus cher possédé (dans la limite d'une Saison à défi) | Troc de graines : +1 bouture |
| **L'Averse d'été** | 10 Potagers sur le toit | Un nuage qui pleut sur les toits potagers, à gauche de la cour | Potagers, Serres et Eau de la Biorégion ×2 pendant 60 s | Jardins de pluie : dure ×2 |
| **La Nuée de migrateurs** | 1 Canopée urbaine ou les Toits vivants | Une nuée d'oiseaux qui tourne au-dessus des toits, à droite de la cour | Bonus de biodiversité (§5.4) ×2 pendant 90 s | +10 s par espèce de l'Herbier |

- **Rythme.** Une visite toutes les 4 à 9 min (tirées au hasard, comme le Papillon, avec la graine de la sauvegarde), parmi les visiteurs que le quartier attire déjà ; elle reste 20 s. Le Corridor des pollinisateurs les fait revenir 20 % plus vite. Le compte à rebours ne court pas tant qu'aucun visiteur n'est attiré.
- **Effets.** L'Averse et la Nuée sont des effets en cours, comme la Floraison (§9.2) : une pastille dans le compteur, une notification à l'accueil ; accueillir le même visiteur pendant son effet le relance sans cumul. Hors ligne, les visites et leurs effets sont en pause, comme le Papillon. Accueillir une visite joue le trille du Papillon.
- **Jalons (4).** Portes ouvertes (accueillir chaque visiteur au moins une fois), Bon voisinage (10 fois les voisins), Après la pluie (10 averses), Escale (10 nuées). 113 jalons en tout avec ceux de M11.
- **Équilibrage.** Le simulateur ne joue pas les visites, comme il ne compte qu'une part des Papillons : leurs gains restent un bonus pour le joueur attentif et ne déplacent pas les cibles du §8.
- **Les visites de la ville (M18).** Quatre visiteurs de plus, liés à ce que le joueur a bâti dans la Biorégion (§7.4) et les quartiers voisins (§6.4), rejoignent le même tirage ; ils s'arrêtent aux mêmes abords de l'immeuble, pour que chacun les voie dans la vue du Balcon.

| Visiteur | Vient dès | Sur la carte | Effet de l'accueil | Espèce (5 accueils) |
|---|---|---|---|---|
| **La transhumance** | 1 niveau de Prairies agrivoltaïques | Un petit troupeau de moutons et son chien sur l'avenue sous l'immeuble | Les moutons tondent sous les panneaux : Panneaux de balcon ×3 pendant 60 s | Alouette des champs |
| **La fête des récoltes** | Halles du parking relais | Un étal de légumes sous des fanions, à droite de la cour | Récolte du Papillon doré (§9.2) ×2 pendant 120 s | Hirondelle rustique |
| **Les lucioles** | Jardins d'eau des Tanneries | Des points de lumière qui clignent au-dessus des roseaux, sur l'avenue au nord | Chaque clic vaut ×3 pendant 60 s | Libellule déprimée |
| **La brocante solaire** | Ateliers solaires | Une table de panneaux d'occasion sous un parasol rayé | Le bâtiment le plus cher possédé coûte moitié prix pendant 60 s | Rougequeue noir |

  Comme les autres, ce sont des effets en cours (pastille dans le compteur, notification à l'accueil, relancés sans cumul, en pause hors ligne). La fête des récoltes est une visite tirée au hasard, jamais une date (roadmap §5). **Jalons (2).** La ville en fête (accueillir chaque visiteur de la ville au moins une fois), Toute la ville danse (25 visites de la ville). « Portes ouvertes » ne compte que les trois visiteurs du quartier. 132 jalons en tout. **Sauvegarde.** Version 20 : les accueils des quatre visiteurs, à zéro pour une sauvegarde plus ancienne.
- **Le soir et la nuit.** Décor seulement, d'après l'horloge de l'appareil : de 18 h à 21 h un voile chaud, de 21 h à 6 h un voile bleu nuit qui assombrit la carte (en multiplication, les couleurs restent lisibles), et les lanternes s'allument au pied d'un arbre de rue sur quatre, au-dessus du voile avec leur halo doré ; l'héliotrope reste lumineux. La production ne change jamais (roadmap §5 : on ne punit pas le joueur qui joue la nuit).

### 9.7 Le potager de la cour (M14)

Une boucle de soin **à temps réel**, à côté de la Lumière : dans la cour, au pied de l'héliotrope, entre les deux rangées de pots, des **carrés de potager** où le joueur sème une culture, la regarde pousser sur la carte, puis la récolte d'un clic. Semer ne coûte rien : seul le temps fait mûrir. Code dans `src/game/garden.ts` et `src/game/seedBank.ts`, dessins dans `src/ui/GardenArt.tsx`.

| Culture | Dès | Pousse en | Récolte |
|---|---|---|---|
| Radis | le 1ᵉʳ Héliotrope en pot | 3 min | Une bouffée de Lumière : 2 min de production (au moins 50) |
| Tournesols | 10 Héliotropes en pot ou la 2ᵉ Saison | 20 min | Le Papillon doré vient dans les 10 s (s'il n'est pas déjà là) |
| Haricots grimpants | la 2ᵉ Saison | 1 h | Potagers et Serres ×2 pendant 20 min (effet en cours, comme l'Averse) |
| Courges | la Biorégion (3ᵉ Saison) | 4 h | 30 min de production de Lumière et d'Eau |

- **Les carrés.** Trois au début, à gauche de la fleur ; un de plus après la 1ʳᵉ Saison, avec 4 parcelles restaurées, puis avec la Biorégion, à droite : **6 au plus** (la feuille de route en prévoyait jusqu'à 9, mais la cour n'a pas plus de place sans couvrir les pots). Les carrés et leurs cultures restent d'une Saison à l'autre et après un Cycle de l'eau.
- **Le temps.** Une culture pousse à chaque pas de simulation, en ligne comme hors ligne, et **ne fane jamais** : mûre, elle attend le joueur (§1). L'Averse d'été (§9.6) la fait pousser deux fois plus vite tant qu'elle dure (en ligne seulement, comme tous les effets), les Jardins de pluie (§6.1) ×1,25 toujours.
- **La grainothèque.** Récolter une culture dont un carré voisin (du même côté de la fleur) porte une culture différente a **une chance sur quatre** de donner la **variété** de ces deux cultures, si elle n'est pas encore trouvée. Six variétés, une par paire, chacune un bonus gardé pour toujours, lié à l'existant :

| Variété | Cultures | Bonus |
|---|---|---|
| Radis flamboyant | Radis et Tournesols | Clic ×1,5 |
| Radis noir | Radis et Haricots | Héliotropes en pot ×1,5 |
| Navet boule d'or | Radis et Courges | Potagers sur le toit ×1,5 |
| Haricot violet | Tournesols et Haricots | Serres ×1,5 |
| Tournesol rouge | Tournesols et Courges | Le Papillon doré revient 5 % plus vite |
| Les trois sœurs | Haricots et Courges | Biodiversité ×1,25 |

- **Sur la carte.** Chaque carré est un bac de terre bordé de bois, avec trois plants qui passent par quatre stades (graine, pousse, plant, culture mûre : bulbes roses des radis, capitules jaunes, gousses violettes, courges orange). Un carré mûr est entouré d'un anneau doré qui respire ; un clic (ou Entrée) le récolte.
- **Panneau.** « Le potager de la cour », après les Coopératives (onglet Récolter sur mobile) : chaque carré avec sa culture, une jauge et le temps avant maturité, le bouton Récolter, ou les cultures à semer dans un carré libre ; puis la grainothèque, avec les variétés trouvées et, pour les autres, les deux cultures qui les donnent. Une notification annonce chaque récolte et chaque variété.
- **Équilibrage.** Le simulateur ne joue pas le potager : ses récoltes restent un bonus pour le joueur qui revient, et les cibles du §8 ne bougent pas.
- **Jalons (5).** Premier radis (1 récolte), Main verte (25), Jardin nourricier (250), Croisement (1 variété), Grainothèque (les 6). 125 jalons en tout.
- **Sauvegarde.** Version 16 : les carrés, le nombre de récoltes et les variétés, tout nu pour une sauvegarde plus ancienne.

### 9.8 Le verger et les ruches (M22)

La boucle **la plus lente** du jeu (roadmap P21), à côté du potager : des arbres fruitiers plantés une fois et des ruches. Tout pousse en ligne comme hors ligne et rien ne fane. Le verger s'ouvre avec la Biorégion (3ᵉ Saison) et reste d'une Saison et d'un Cycle à l'autre. Code dans `src/game/orchard.ts` et `src/game/fruits.ts`, dessins dans `src/ui/OrchardArt.tsx`, panneau `src/ui/Orchard.tsx` (après le potager).

- **Les arbres.** Quatre fruitiers : le Pommier (offert), le Poirier (10 paniers), le Cerisier (20), le Prunier (40). Planté, un arbre grandit **deux jours** de temps réel : jeune plant tuteuré, **en fleurs** à mi-chemin, puis il porte des fruits qui mûrissent en **8 h**. Mûrs, ils attendent le joueur.
- **La cueillette.** Un clic sur l'arbre (sur la carte, entouré d'un anneau doré, ou dans le panneau) donne **1 h de production de Lumière et d'Eau** et **8 paniers**, et relance les 8 h. Tant qu'elle n'est pas trouvée, chaque cueillette a **une chance sur trois** de donner la **variété ancienne** de l'arbre, un bonus gardé pour toujours :

| Arbre | Variété ancienne | Bonus |
|---|---|---|
| Pommier | Pomme reinette | Toute la production +5 % |
| Poirier | Poire curé | Eau récoltée ×1,1 |
| Cerisier | Cerise burlat | Le Papillon doré revient 5 % plus vite |
| Prunier | Reine-claude | Le potager pousse ×1,1 plus vite |

Les variétés anciennes se lisent dans le panneau du verger, sous les ruches, plutôt que sur une planche de l'Herbier (qui reste aux espèces).

- **Les ruches.** Deux au plus, posées sous les arbres pour 15 puis 40 paniers. Chaque ruche **pollinise** : le potager et le verger poussent **×1,2** plus vite, une variété du potager (§9.7) est plus probable (**+10 points** sur la chance d'une sur quatre), et elle remplit **un pot de miel toutes les 6 h**. Le miel ne sert qu'aux deux dernières étapes des grands chantiers (§6.6).
- **Sur la carte.** Le verger prend le bloc gris au sud-ouest de la rocade : une prairie fauchée, quatre fosses avec leur tuteur, puis les arbres à leur stade (couronne en fleurs blanches et roses, fruits rouges, jaunes, cerise ou prune) et les ruches jaunes à toit rouge avec leurs abeilles. Avec les animations réduites, l'anneau et les abeilles restent immobiles.
- **Équilibrage.** Les paniers servent maintenant à trois choses (arbres, ruches, chantiers) : un choix, jamais une perte. Le simulateur ne joue pas le verger, comme le potager.
- **Jalons (2).** « Premier fruit » (une cueillette), « Vieux vergers » (les 4 variétés anciennes). 136 jalons en tout.
- **Sauvegarde.** Version 23 : les arbres (âge et fruits), les variétés, les ruches, le miel et les cueillettes, et le miel versé aux chantiers, à zéro pour une sauvegarde plus ancienne.

### 9.9 Les alliances et la grande floraison (M24)

Des **synergies entre systèmes** à composer (roadmap P23, décision D16), à la place de l'album. Une alliance relie deux choses que le joueur a fait grandir, souvent de deux couches différentes ; elle **s'éveille** quand les deux atteignent leur seuil et ne joue que si elle occupe une **place**. Code dans `src/game/alliances.ts`, panneau `src/ui/Alliances.tsx` (après les grands chantiers), fils et floraison dans `src/ui/AllianceArt.tsx` et `src/ui/allianceMap.ts`.

| Alliance | Ce qu'elle relie (seuils) | Effet |
|---|---|---|
| Les abeilles du verger | 1 ruche (§9.8) · 3 pollinisateurs dans l'Herbier (abeille, bourdon, citron, coccinelle) | Le Papillon doré revient 15 % plus vite |
| Le marché du tram | 1 étape du tram solaire (§6.6) · 2 quartiers voisins (§6.4) | Clic ×2 |
| La rivière nourricière | Trame bleue de 2 parcelles (§6.7) · bras des coteaux du delta (§7.5) | Le potager pousse ×1,3 plus vite |
| Les graines voyageuses | 1 ville sœur (§7.6) · 3 variétés du potager (§9.7) | Toute la production +10 % |
| La fête au village | 10 visites de la ville (§9.6) · 1 étape des halles (§6.6) | Les haricots durent ×1,5 |
| Les racines profondes | 10 niveaux de Canopée (§7.1) · 1 élargissement du delta (M19) | Bâtiments 10 % moins chers |

- **Les places** (revues par M34, §9.14). **Trois** au début, une de plus avec **deux grands chantiers achevés**, avec **chaque ville sœur** et avec la **grande floraison**, six au plus (autant que d'alliances). Le panneau s'ouvre dès qu'une alliance est éveillée. On choisit librement tant qu'une place est libre ; **retirer** une alliance n'est permis **qu'une fois par Cycle de l'eau**, pour que la composition soit un choix. Une alliance choisie dont un côté retombe sous son seuil (la Canopée qui recommence avec une ville sœur fondée sans l'atelier des semis, par exemple) garde sa place mais s'endort.
- **Sur la carte.** Chaque alliance qui joue tend un **fil doré** entre ses deux lieux (du verger à la cour, du tram aux quartiers voisins, de la rivière aux coteaux, de la cour vers les villes sœurs…), une courbe lumineuse qui pulse doucement ; immobile avec les animations réduites.
- **La grande floraison.** Quand toute la région est restaurée (les **quatre grands chantiers achevés**, l'**Herbier complet** et **chaque site de la Biorégion au niveau 5**), la carte entière fleurit : quelque 220 fleurs s'ouvrent l'une après l'autre sur les rues et les sites, puis restent. Aucun texte, **rien ne recommence** (décision D13) ; elle ouvre la dernière place. Elle n'arrive qu'une fois.
- **Équilibrage.** Les effets sont des bonus modestes de fin de partie, du même ordre que les variétés et les trames. Le simulateur ne joue pas les alliances : elles s'éveillent après les mesures du §8.
- **Jalons (2).** « Première alliance » (une alliance qui joue), « La grande floraison ». 140 jalons en tout.
- **Sauvegarde.** Version 25 : les alliances choisies, le Cycle du dernier retrait et la floraison, vides pour une sauvegarde plus ancienne.

---

### 9.10 Le temps qu'il fait (M28)

Roadmap P27, décision D19 : au hasard, avec trois temps de prévision. Code dans `src/game/weather.ts`, carte et prévision dans `src/ui/WeatherArt.tsx`.

- **Le ciel.** Le temps s'ouvre avec la 2ᵉ Saison (ou le premier Cycle) : la première Saison reste sous un grand soleil immobile, sans effet ni prévision. Ensuite, il change toutes les 15 à 30 min de jeu (tirées au hasard), en ligne comme hors ligne. Le hasard vient d'une graine propre au temps, tirée de celle de la sauvegarde, pour que le temps ne change jamais ce que donne le Papillon doré. Il reste d'une Saison et d'un Cycle à l'autre.
- **Ce que chaque temps favorise** (jamais de pénalité) :

| Temps | Sur la carte | Favorise |
|---|---|---|
| Grand soleil | Reflets qui scintillent | Panneaux de balcon et Centrale à miroirs ×1,25 |
| Averse | Pluie qui tombe, ciel bleuté | Potagers sur le toit ×1,25, le potager de la cour pousse ×1,25 plus vite |
| Vent | Feuilles qui traversent la ville | La Récolte du Papillon doré ×1,5 |
| Brume | Voile blanc qui dérive | Biodiversité ×1,15 |
| Chaleur | Lumière orangée | Canopée urbaine ×1,25, +1 % de production par parcelle restaurée |

- **Prévision sans texte.** Dans la légende de la carte, à côté du sélecteur de vue : l'icône du temps présent, puis les trois suivants plus petits. Leurs noms sont lus par les lecteurs d'écran et en info-bulle.
- **Espèce.** L'escargot de Bourgogne sort la première fois qu'il pleut (§9.5), dans la cour. Il n'est pas exigé pour l'Herbier complet. L'Herbier compte désormais 28 espèces.
- **Jalons (5).** Un par temps vécu (« Plein soleil », « Chanter sous la pluie », « Le vent se lève », « Ville de brume », « Été indien »). 149 jalons en tout.
- **Animations réduites.** Ni pluie ni feuilles : seuls restent le voile de couleur, des reflets fixes et la brume immobile.
- **Équilibrage.** Le joueur de référence vit le temps comme les autres ; la 1ʳᵉ Saison conseillée ne change pas (66 min, cible 80 min). La roadmap faisait aussi revenir plus tôt le Papillon (vent) et les visites (brume) : comme leurs Averses doublent l'Eau, le 2ᵉ Cycle passait de 3 Saisons à 2. Ces deux temps favorisent donc la Récolte du Papillon et la biodiversité. Pour la même raison, l'averse favorise les potagers plutôt que l'Eau. Le pollen (§5.6) avait déjà réduit la marge du 2ᵉ Cycle à presque rien (7,9 Sources sur les 8 visées au bout de 2 Saisons). Pour la retrouver, le diviseur des Sources passe de 4e5 à 5e5 (§7.4) : le 1ᵉʳ Cycle conseillé ne bouge pas (2 h 27, cible 2 h 45), les Cycles 2 à 4 durent 36, 36 et 51 min (cibles 35, 35 et 45). Un joueur en cours garde ses Sources ; la suivante lui demande un peu plus d'Eau.
- **Pas encore fait.** La roadmap liait aussi certaines voies (§5.5) et alliances à un temps, et le retour en images (M17) au temps passé hors ligne : laissés pour plus tard, pour garder ce jalon petit. Les voies et le retour en images suivent le temps depuis M33 (§9.13).
- **Sauvegarde.** Version 29 : le temps présent, le temps restant, la prévision, la graine et les temps vécus ; une sauvegarde plus ancienne reçoit un ciel neuf.

### 9.11 Les demandes des voisins (M29)

Roadmap P28, décision D20 : les récompenses sont des coups de main gardés en réserve. Code dans `src/game/requests.ts` et `src/game/bonds.ts`, panneau dans `src/ui/Requests.tsx`, bulles et icônes dans `src/ui/RequestArt.tsx`.

- **Les demandes.** Elles s'ouvrent avec la 2ᵉ Saison (ou le premier Cycle), comme le temps. Une demande arrive toutes les 4 min de jeu (la première au bout de 2 min), en ligne comme hors ligne, tant que moins de trois attendent. Une demande attend sans limite de temps ; le joueur peut la refuser, une autre la remplace aussitôt. Le hasard vient d'une graine propre aux demandes, pour ne jamais changer ce que donne le Papillon doré.
- **Ce qu'on demande** (seulement ce que le joueur peut déjà faire) : 3 récoltes du potager, 2 envolées de pollen, 2 cueillettes du verger (s'il est ouvert), 2 Papillons dorés (s'il vole), ou posséder un nombre rond d'unités du dernier bâtiment découvert (au moins 10 de plus). Seul compte ce qui est fait après l'arrivée de la demande, sauf les bâtiments possédés.
- **Les coups de main** (un par demande, tiré au hasard) : un quart d'heure de production d'un coup, une Floraison (§9.2), la culture du potager la plus proche de mûrir qui mûrit d'un coup, une envolée de pollen (§5.6). Ils vont dans une réserve de trois au plus : réserve pleine, on ne peut plus rendre service avant d'en lancer un.
- **Les quartiers voisins.** Une fois restaurés (§6.4), ils envoient la moitié des demandes. Chaque demande servie pour un quartier renforce le lien : +1 % de production, gardé pour toujours, jusqu'à +10 % par quartier.
- **Sans texte sur la carte.** Chaque demande en attente flotte en bulle à icône au-dessus des rues ; la bulle se cercle d'or quand la demande est remplie. Le panneau « Les demandes des voisins » (couche Vivant) donne le détail.
- **Jalons (2).** « Premier service » (une demande servie), « Bon voisin » (25). 151 jalons en tout.
- **Équilibrage.** Les demandes sont facultatives et le joueur de référence ne les joue pas : le rythme mesuré ne change pas.
- **Écarts avec la roadmap.** Une heure de production devient un quart d'heure, pour que lancer trois coups de main d'affilée ne saute pas une Saison ; l'étape de chantier moins chère et les demandes d'espèce de l'Herbier sont laissées pour plus tard ; l'envolée de pollen devient aussi un coup de main.
- **Sauvegarde.** Version 30 : les demandes en attente, le délai avant la suivante, la graine, la réserve, le nombre de services et les liens ; une sauvegarde plus ancienne commence sans demande.


### 9.12 Le potager et le verger allégés (M32)

Roadmap P31, décision D24 : « Tout récolter » ressème la même culture. Les petites boucles gardent leur geste sans devenir une corvée, et le miel trouve un usage. Code dans `src/game/garden.ts` (rotation, temps, fraises, `harvestAll`), `src/game/seedBank.ts` (variétés) et `src/game/orchard.ts` (âge des arbres, miel).

- **Tout récolter, ressemer pareil.** Dès que quelque chose est mûr au potager ou au verger, les panneaux du potager et du verger montrent un bouton « Tout récolter et ressemer » : il récolte chaque carré mûr et y ressème aussitôt la même culture, puis cueille chaque arbre mûr. Une seule notification résume la récolte, et une autre annonce chaque variété trouvée. Le carré par carré reste là pour choisir.
- **La rotation.** Chaque carré se souvient de sa dernière culture. Une culture semée après une culture **différente** pousse **×1,2** plus vite, et le panneau l'affiche (« En rotation »). Ressemer la même culture ne retire rien, mais ne gagne pas ce bonus : c'est le choix entre le geste rapide et le jardinier attentif.
- **Chaque culture a son temps** (une fois le ciel ouvert, §9.10). Le grand soleil fait pousser les tournesols ×1,5, le vent les radis, la brume les haricots, la chaleur les courges ; l'averse arrose toujours tout le potager (×1,25). Le panneau dit quelle culture le temps présent favorise.
- **Les fraises.** Une cinquième culture, ouverte avec la **première ruche** (§9.8) : elles poussent en **10 min**, donnent un panier, et leur parfum remplit **un quart de la jauge de pollen** (§5.6). Sur la carte, une rosette de feuilles dentées, des fleurs blanches puis trois fraises rouges.
- **Quatre variétés de plus** (une par paire avec les fraises), dix en tout :

| Variété | Cultures | Bonus |
|---|---|---|
| Fraise des bois | Radis et Fraises | La jauge de pollen se remplit ×1,2 plus vite |
| Gariguette | Tournesols et Fraises | Récolte du Papillon doré ×1,25 |
| Mara des bois | Haricots et Fraises | Les haricots durent ×1,25 |
| Fraise ananas | Courges et Fraises | Le verger pousse ×1,1 plus vite |

- **Le miel sert.** Sous les ruches, « Lancer une envolée » dépense un pot de miel pour une envolée de pollen (§5.6). Les grands chantiers gardent leur usage du miel ; c'est un choix, jamais une perte.
- **Les arbres qui vieillissent.** Un fruitier cueilli souvent prend de l'âge : arbre de deux ans à 5 cueillettes, de cinq ans à 15, vieil arbre à 30. Chaque âge donne **un panier de plus** par cueillette (8, puis 9, 10 et 11). Le panneau du verger montre l'âge et les paniers par cueillette. Un arbre oublié ne perd rien.
- **Jalons (2).** « La terre se repose » (25 récoltes semées après une culture différente) et « Vieil arbre » (un fruitier à son dernier âge), famille du quartier. « Grainothèque » demande désormais les dix variétés. 155 jalons en tout.
- **Équilibrage.** Le potager et le verger restent des bonus pour le joueur qui revient. Le joueur de référence de la partie complète (§8), qui alterne déjà ses cultures, profite de la rotation et du temps, mais aucune cible ne bouge : 1ʳᵉ Saison 66 min, 1ᵉʳ Cycle 2 h 41, Cycles 2 à 4 en 36, 36 et 43 min, essaimages à 4 h et 6 h de jeu, comme après M31.
- **Écarts avec la roadmap.** « Tout récolter » est un bouton des panneaux plutôt qu'un clic sur la fleur, qui garde son geste (la Lumière et le pollen). Les demandes de miel des voisins viennent avec M35. Les ruches rendaient déjà les variétés plus probables (§9.8) : rien de plus pour la ruche pleine.
- **Sauvegarde.** Version 33 : la dernière culture et la rotation de chaque carré, le nombre de récoltes en rotation et les cueillettes de chaque arbre ; rien pour une sauvegarde plus ancienne.

### 9.13 Les voies et le ciel (M33)

Roadmap P32, décision D25 : échanger le prochain temps une fois par Saison. La prévision devient une décision, et chaque temps a plusieurs gagnants. Code dans `src/game/weather.ts` (bâtiments de chaque temps, échange, temps vécus hors ligne) et `src/game/growth.ts` (`strengthen`).

- **Les voies sous leur ciel.** Chaque bâtiment a un temps. Sous ce temps, les voies qu'il a prises (§5.5) jouent **×1,5** : la part de leur effet au-delà de rien grandit de moitié (×1,5 devient ×1,75, +1 % devient +1,5 %, un intervalle ×0,9 devient ×0,85). Seules les heures hors ligne gardées par une voie ne changent pas.

| Temps | Bâtiments dont les voies jouent ×1,5 |
|---|---|
| Grand soleil | Panneaux de balcon, Centrale à miroirs |
| Averse | Potagers sur le toit, Héliotropes en pot |
| Vent | Fermes verticales, Arcologies |
| Brume | Serres communautaires |
| Chaleur | Canopée urbaine |

  Sous les pastilles des formes de chaque bâtiment, l'icône de son temps s'allume quand il règne ; les deux voies affichent alors leur effet renforcé.
- **Échanger le prochain temps.** Une fois par Saison, le 2ᵉ ou le 3ᵉ temps de la prévision peut passer en tête, d'un clic sur son icône dans la légende de la carte (les deux icônes cliquables sont cerclées d'or tant que l'échange reste à faire). Le temps présent ne change pas, ni la durée tirée.
- **Quatre espèces du temps.** Après l'escargot sous l'averse : le **lézard des murailles** au grand soleil (sur le mur de la cour), le **faucon crécerelle** par vent (au-dessus des toits), la **salamandre tachetée** dans la brume (dans le coin humide de la cour), la **cigale grise** par la chaleur (dans un arbre de la rue). Comme l'escargot, elles comptent dans la biodiversité mais ne sont pas exigées pour l'Herbier complet, qui compte désormais 32 espèces.
- **Le ciel dans le retour en images** (§9.1). Chaque passage du soleil prend la couleur d'un temps vécu hors ligne (doré, bleu de pluie, vert pâle du vent, gris de brume, orangé de chaleur), avec un passage par temps quand le ciel a changé plus souvent que d'heures passées (quatre au plus). Le retour joue même quand rien d'autre n'a poussé. L'avis de retour dit le temps présent et les trois qui viennent.
- **Jalon (1).** « Les bêtes du ciel » : les cinq espèces du temps revenues, famille du quartier. 156 jalons en tout.
- **Équilibrage.** Le joueur de référence (§8) ne change pas ses choix de voies ni la prévision. 1ʳᵉ Saison 66 min (cible 80) ; 1ᵉʳ Cycle 2 h 38 au lieu de 2 h 41 (cible 2 h 45) ; Cycles 2 à 4 en 36, 42 et 56 min au lieu de 36, 36 et 43 (cibles 35, 35 et 45) : les voies renforcées donnent un peu plus de Sources par Cycle, et le simulateur, qui garde ses seuils, joue alors une Saison de plus pour les Cycles 3 et 4. Les essaimages reviennent à 4 h et 5 h de jeu (cibles 4 h et 5 h). Tout reste dans les ±30 %.
- **Écart avec la roadmap.** La règle de l'atelier qui ajouterait un échange par Saison n'est pas faite : une seule règle de plus aurait demandé un niveau d'atelier en plus, et l'échange unique garde la surprise.
- **Sauvegarde.** Version 34 : la Saison du dernier échange ; jamais d'échange pour une sauvegarde plus ancienne.

### 9.14 Les alliances du milieu (M34)

Roadmap P33, décision D26 : des places plus tôt plutôt que plus de places. Six alliances relient enfin les systèmes de la v4, et la composition devient une décision dès la 2ᵉ Saison. Code dans `src/game/alliances.ts` ; les effets nouveaux passent par `src/game/bonuses.ts` (`harvestBaskets`, `perPath`, `handSlots`) et `src/game/cooperatives.ts` (les vélos).

| Alliance | Ce qu'elle relie (seuils) | Effet |
|---|---|---|
| Le pollen des ruches | 1 ruche (§9.8) · 50 envolées de pollen (§5.6) | La jauge de pollen se remplit ×1,25 plus vite |
| Les jardins sous la pluie | 10 averses des voisins (§9.6) · 3 variétés du potager (§9.7) | Chaque récolte du potager donne un panier de plus |
| Les formes du quartier | 6 voies qui jouent (§5.5) · 4 parcelles restaurées (§6.1) | +1 % de production par voie qui joue |
| L'entraide | 10 demandes servies · 1 quartier voisin lié (§9.11) | Une place de plus dans la réserve des coups de main (4 au lieu de 3) |
| Les vélos dans le vent | 3 Coopératives (§7.2) · 5 temps vécus (§9.10) | Par vent, les Coopératives des bâtiments achètent aussi les synergies (sans le Conseil) |
| Les nuées de la canopée | 10 Nuées de migrateurs accueillies (§9.6) · 10 Canopées urbaines | La Nuée dure ×1,5 |

- **Les places.** **Deux** dès la 2ᵉ Saison, **trois** avec la Biorégion, puis une de plus avec deux grands chantiers achevés, chaque ville sœur et la grande floraison ; **huit au plus** pour douze alliances. Le panneau s'ouvre toujours dès qu'une alliance est éveillée ; il range les alliances choisies d'abord, puis les éveillées, puis les endormies.
- **Retirer.** Avant le premier Cycle de l'eau, une alliance se retire **une fois par Saison** ; ensuite une fois par Cycle, comme avant.
- **Les vélos dans le vent.** Ils achètent comme le Conseil, mais seulement les synergies (§5.3), et seulement par vent : la synergie la moins chère, si elle ne coûte pas plus de trente fois le prochain bâtiment. Avec le Conseil au travail, rien ne change.
- **Sur la carte.** Six nouveaux fils dorés : des ruches à la cour, de la cour aux jardins de pluie de la rivière, de la cour à l'arcologie, de la cour aux Tanneries, de la cour vers la rue des vélos, d'un arbre de la rue vers le ciel.
- **Jalon (1).** « La toile du vivant » : cinq alliances qui jouent en même temps. 157 jalons en tout.
- **Équilibrage.** Les effets restent modestes, du même ordre que les alliances de M24. Le joueur de référence (§8) ne compose pas d'alliances avant la fin de partie : les mesures ne bougent pas (1ʳᵉ Saison 66 min, 1ᵉʳ Cycle 2 h 38, Cycles 2 à 4 en 36, 42 et 56 min).
- **Écart avec la roadmap.** « 10 averses vécues » compte les averses des voisins (§9.6), déjà comptées, plutôt que le temps « Averse ».
- **Sauvegarde.** Version 35 : la Saison du dernier retrait ; aucun retrait pour une sauvegarde plus ancienne.

### 9.15 L'Herbier et les voisins (M35)

Roadmap P34. Le vivant revenu devient un acteur de la carte, et les demandes des voisins s'élargissent. Code dans `src/game/greetings.ts` (saluer), `src/game/families.ts` (familles), `src/game/requests.ts` et `src/game/greatWorks.ts` (`lightenStage`).

- **Saluer une espèce.** Une espèce revenue se clique sur la carte (ou Entrée) : un **pas de 4 % de la jauge de pollen** (§5.6) et deux notes légères, puis plus rien pour elle pendant **10 min de jeu** (« une fois par passage »). Le halo d'une espèce qu'on peut saluer se dore et respire ; il redevient simple une fois saluée. Les saluts sont comptés par espèce.
- **Les familles de l'Herbier.** L'écran de l'Herbier montre cinq familles avec leur progression ; une famille complète dore ses planches et donne un bonus lié à son monde :

| Famille | Espèces | Bonus une fois complète |
|---|---|---|
| Pollinisateurs | abeille, bourdon, citron, coccinelle | La jauge de pollen se remplit ×1,15 plus vite |
| Oiseaux | moineau, mésange bleue, rouge-gorge, martinet, alouette, hirondelle, rougequeue | La Nuée de migrateurs dure ×1,25 |
| Gens de la rivière | grenouille, martin-pêcheur, triton, libellule, loutre, saumon, cigogne noire | Eau ×1,1 |
| Habitants de la nuit | hérisson, ver luisant, pipistrelle, chouette | Les lucioles durent ×1,25 |
| Espèces du temps | escargot, lézard, faucon, salamandre, cigale | Sous leur ciel, les voies jouent ×1,75 au lieu de ×1,5 (§9.13) |

  Le coquelicot, la fougère, l'orchis, le lucane et le pic vert n'appartiennent à aucune famille.
- **Les demandes oubliées.** Trois besoins de plus : **saluer une espèce** sur la carte (celle qui a été le moins saluée), **un pot de miel** (avec une ruche ; il est donné en rendant service) et **une nouvelle forme de bâtiment** (une voie de plus qui joue, §5.5, dès qu'un bâtiment approche de son premier palier). Deux coups de main de plus : **un quart d'étape de grand chantier** (le quart de la Lumière, de l'Eau, des paniers et du miel de la prochaine étape du chantier le plus avancé, §6.6) et **un échange de prévision de plus** cette Saison (§9.13, seulement une fois l'échange de la Saison fait). Ils ne sont offerts qu'une fois les grands chantiers ou le temps ouverts.
- **Les liens pleins.** Un quartier voisin dont le lien est plein (10 demandes servies, §9.11) offre **deux** coups de main au lieu d'un, dans la limite de la réserve.
- **Jalons (2).** « Bonjour voisin » (saluer une espèce) et « Toute la famille » (deux familles complètes ; une seule, celle des pollinisateurs souvent complète dès la 1ʳᵉ Saison, rendait les Saisons à défi trop courtes), famille du quartier. 159 jalons en tout.
- **Équilibrage.** Saluer reste un petit geste : au plus quelques envolées de plus par heure pour un joueur qui cherche chaque espèce. Le joueur de référence (§8) ne salue pas ; sa famille des pollinisateurs est complète dès la 1ʳᵉ Saison, les autres après les mesures. 1ʳᵉ Saison 66 min ; 2ᵉ Saison 25 min ; 1ᵉʳ Cycle 2 h 39 (cible 2 h 45) ; Cycles 2 à 4 en 36, 36 et 45 min (cibles 35, 35 et 45), plus près des cibles qu'après M33 ; Saisons à défi gagnées en 23 à 26 min ; essaimages à 4 h et 6 h de jeu (cibles 4 h et 5 h, dans les ±30 %).
- **Écarts avec la roadmap.** Le vélo-cargo des quartiers au lien plein n'est pas dessiné : leur second coup de main suffit pour ce jalon. « Un temps choisi » devient un échange de prévision de plus, pour garder la règle de D25.
- **Sauvegarde.** Version 36 : les saluts de chaque espèce et l'heure de jeu du dernier ; aucun pour une sauvegarde plus ancienne.

### 9.16 Des Jalons qui comptent (M37)

Roadmap P36, ajout d'Antoine (« ajoute aussi des interactions avec les jalons et d'autres mécaniques du jeu pour rendre leur complétion satisfaisante »). Un Jalon ne faisait qu'ajouter +1 % ; désormais il laisse un cadeau, les familles complètes comptent, et d'autres mécaniques les lisent. Code dans `src/game/milestoneFamilies.ts`, la progression dans `src/game/achievements.ts` (`achievementProgress`).

- **Un cadeau sur la carte.** Chaque Jalon atteint pose un petit médaillon de laurier au pied de l'héliotrope (son compte s'affiche quand il y en a plusieurs, huit au plus). Un clic les ramasse tous ; chacun donne le geste de sa famille, et le médaillon d'éclosion (§9.3) l'annonce sous « Production +1 % » :

| Famille | Cadeau |
|---|---|
| Lumière, Bâtiments, Améliorations | Une bouffée de Lumière : la valeur de 10 clics |
| La fleur, Papillon doré | Un pas de 5 % de la jauge de pollen (§5.6) |
| Le quartier, Saisons | Le potager pousse de 10 min (§9.7) |
| La Biorégion | Une goutte d'Eau : 30 s d'Eau (§7.4) |

- **Les familles complètes.** Une famille dont tous les Jalons sont atteints (les cachés sont un bonus et ne comptent pas) dore son titre dans l'écran des Jalons (« Famille complète ») et donne, pour toujours, un bonus relié à son monde et une **couleur de l'héliotrope** (§6.5). Avant, l'écran dit ce qu'elle donnera.

| Famille | Bonus | Couleur |
|---|---|---|
| Lumière | Toute la production +10 % | Soleil |
| Bâtiments | Les bâtiments coûtent 5 % de moins | Mousse |
| Améliorations | Synergies ×1,1 | Safran |
| La fleur | La jauge de pollen se remplit ×1,15 plus vite | Corail |
| Papillon doré | Le Papillon revient 10 % plus vite | Indigo |
| Le quartier | Chaque Jalon donne 0,2 % de plus | Prairie (les têtes lilas, or et rose mêlées) |
| Saisons | 2 h de plus hors ligne | Automne |
| La Biorégion | Eau ×1,1 | Eau vive |

- **Voir le prochain.** Sous le titre de chaque famille, le prochain Jalon : celui qui est le plus près de son but, avec une barre et un pourcentage. Les quantités qui s'étendent sur des puissances de dix (Lumière, Lumière par seconde, valeur du clic, Eau) se comptent en ordres de grandeur ; les Jalons qui ne se mesurent pas (une action, une Saison éclair) s'affichent sans barre.
- **D'autres mécaniques les lisent.**
  - **Les voisins** (§9.11) demandent parfois d'atteindre un Jalon déjà aux trois quarts de son but (hors ceux comptés en ordres de grandeur, qui peuvent encore être loin).
  - **Deux alliances** (§9.9) : « Les guirlandes » (1 famille de Jalons complète et 2 familles de l'Herbier, §9.15 : chaque Jalon donne 0,2 % de plus) et « L'almanach des voisins » (3 familles de Jalons complètes et 20 demandes servies : un panier de plus par récolte).
  - **Les lauriers**, un talent de la Canopée (§7.1) à 3 niveaux (10, 20 puis 40 Graines) : +3 % de production par niveau et par famille de Jalons complète.
- **Écarts avec la roadmap.** Le cadeau attend un clic au lieu d'être donné d'un coup : donné seul, il raccourcissait la 1ʳᵉ Saison de plus de 30 % (le joueur de référence ne le ramasse que dans la partie complète, §8), et le ramasser est un geste de plus sur la carte. Le prochain objectif (M10) ne désigne pas de Jalon : il compare des prix, qu'un Jalon n'a pas. Pas de nouveau Jalon : 159 en tout.
- **Équilibrage.** Les familles se complètent tard (la Lumière demande 1 Qn au total, le quartier la grande floraison) : leurs bonus et les lauriers servent la fin de partie. Le joueur de référence ramasse les cadeaux à chaque visite des petites boucles. 1ʳᵉ Saison 66 min (inchangée) ; 1ᵉʳ Cycle 2 h 39 ; Cycles 2 à 4 en 36, 36 et 44 min ; essaimages à 4 h et 5 h, sur leurs cibles.
- **Sauvegarde.** Version 38 : les cadeaux en attente et le niveau des lauriers ; aucun pour une sauvegarde plus ancienne.

## 10. Écrans et interface

### 10.1 Écran principal (bureau)

Refonte du 2026-10-10 (demande d'Antoine) : la carte prend tout l'écran, la fleur pousse au centre de la ville, le menu latéral s'élargit et se replie.

```
┌───────────────────────────────────────────────────────────────────────┐
│ HELIOTROPE        ☀ 1,23 M Lumière  +4 560 /s       [Jalons] [Options]│
├────────────────────────────────────────────────────┬─┬────────────────┤
│ [Balcon|Quartier|Ville]                            │›│ Améliorer ⌄    │
│                       ╭──╮                         │ │ [▣][▣][▣][▢]   │
│                       │✿ │ fleur dans la cour      │ │ Bâtir ⌄ ×1 ×10 │
│                       ╰──╯                         │ │ Héliotrope  42 │
│              Scène du quartier                     │ │ Panneau     18 │
│        (toute la hauteur de la fenêtre)            │ │ Le quartier ⌄  │
│                                                    │ │ Coopératives ⌄ │
└────────────────────────────────────────────────────┴─┴────────────────┘
```

- **Haut :** une barre fine : titre, compteur de Lumière et production/s, menu. Aucun texte sous le titre.
- **Carte :** la scène du quartier vue du dessus (§6) occupe toute la hauteur restante et toute la largeur que laisse le menu. Le sélecteur de vue est en haut à gauche, avec la teinte de saison. Le Papillon doré la traverse.
- **Fleur :** l'héliotrope cliquable pousse au centre de la ville, dans la cour de l'immeuble du joueur : son pot repose sur un massif entouré d'une lueur dorée, dont la couronne de fleurs s'étoffe avec les améliorations de clic, et une tonnelle de jardin l'abrite : un arceau vert sage à fil doré, sans fond, où grimpe une vigne aux couleurs de la saison et où les améliorations de clic accrochent leurs brins dorés. Son ombre se pose sur les pavés et son halo l'entoure sans cadre, pour qu'elle fasse partie de la cour plutôt que d'un panneau posé dessus. Elle suit la caméra d'une vue à l'autre et grandit avec le zoom (136 à 290 px de large, au plus un quart de la largeur de la carte quand elle est étroite), pour garder la place de ses brins dorés, de son halo et de ses animations ; les pots du quartier se rangent de part et d'autre du massif. Seule la plante capte le clic, le reste de la carte sous l'arche reste cliquable. Aucun texte sous la fleur : chaque clic fait flotter sa valeur.
- **Menu latéral :** Améliorer, Bâtir, Le quartier (parcelles et projets, §6.1, §6.2) et les Coopératives (§7.2), dans cet ordre ; il défile seul et la page ne défile pas. Large d'environ un tiers de l'écran, il passe à deux colonnes sur les très grands écrans (dès 1760 px) pour tout montrer d'un coup. Le titre de chaque panneau le replie ou le déplie, et la poignée entre la carte et le menu replie tout le menu pour donner toute la largeur à la carte. Ces choix sont gardés dans le navigateur. **Par couches (M25)** : voir §10.7.
- **Tablette :** la carte en haut (environ 60 % de la hauteur), les panneaux en deux colonnes dessous.

### 10.2 Autres écrans (onglets ou panneaux)

| Écran | Contenu | Dès |
|---|---|---|
| **Jalons** | Grille des succès, débloqués en couleur, cachés en « ? » | Phase 2 |
| **Saisons** | Graines actuelles, Graines à gagner, bonus avant/après, choix d'une Saison à défi (§7.3, dès la 2ᵉ Saison), bouton Nouvelle Saison avec confirmation | Prestige disponible |
| **Arbre des Saisons** | L'arbre de talents dessiné, Graines à semer, détail et bouton Semer du talent choisi, puis la Canopée à niveaux (§7.1) | 1ʳᵉ Graine |
| **Cycle de l'eau** | Sources actuelles et à gagner, bonus avant/après, ce qui repart et ce qui reste, bouton Nouveau Cycle avec confirmation (§7.4) | 1ʳᵉ Source à gagner |
| **Herbier** | Une planche par espèce, dessinée une fois revenue, silhouette avant, avec ce qui la ramène (§9.5) | 1ʳᵉ espèce ou 2ᵉ Saison |
| **Statistiques** | Lumière totale (saison / toutes), clics, temps de jeu, papillons, saisons, courbe de la production des dernières Saisons (§10.5) | Toujours |
| **Options** | Langue (français ou anglais), notation des nombres, animations réduites, volume et son coupé, sauvegarde manuelle, export / import, remise à zéro | Toujours |
| **Retour hors ligne** | Fenêtre modale du gain d'absence | Au chargement |

Les Options proposent aussi de réduire les animations, en plus du réglage `prefers-reduced-motion` de l'appareil (§10.4), et, depuis M6, de régler le volume des sons ou de les couper (§6.3).

### 10.3 Mobile

Même contenu, une colonne : compteur en haut, carte avec la fleur dedans, barre d'onglets en bas (Bâtir / Améliorer / Le vivant / La région / Plus, depuis M25, §10.7). La carte reste visible sur chaque onglet : grande sur Le vivant (le potager et le verger s'y cueillent), plus basse ailleurs pour voir chaque achat pousser ; « Plus » la remplace par le menu. Les cibles tactiles font au moins 44 px. *Livré au jalon 4 : « Plus » rassemble les Jalons, les Saisons, les Statistiques et les Options.*

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
- Arches et cadres courbes inspirés de l'Art nouveau pour les éléments importants (tonnelle de la fleur cliquable, écran des Saisons).
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

**Rendu enrichi (2026-10-10).** La carte est dessinée en WebGL avec PixiJS (`src/ui/pixi/`), à partir du même plan et des mêmes données que la scène SVG. C'est le rendu par défaut quand l'appareil a une vraie carte graphique (WebGL refusé s'il n'était qu'émulé par le processeur) ; sinon, ou si l'option « Rendu enrichi » est décochée (choix mémorisé par navigateur, hors sauvegarde), la scène SVG reste, et elle revient d'elle-même si WebGL échoue. Les éléments des générateurs sont des dessins SVG plus détaillés (façades à fenêtres par étage, équipements de toit, bacs de potager en bois, verrières à arceaux, houppiers en trois profondeurs de feuilles) convertis en textures. Les parcelles restaurées, la Biorégion (plaine, collines, champs, sites régionaux, mares) et les collecteurs de la ville sont pris tels quels à la scène SVG, avec leur style, puis convertis en textures : les deux rendus montrent toujours les mêmes dessins. Chaque nouvel élément garde son entrée (croissance et anneau doré ; dévoilement circulaire depuis l'épingle pour une parcelle). La carte graphique ajoute : des ombres douces projetées qui suivent un soleil qui oscille lentement autour de sa position de phase, des ombres de nuages qui passent, l'eau vivante (rivière retrouvée, bassin de l'arcologie, rivière, canaux et ruisseaux de la Biorégion : reflets du ciel, ondulations, scintillements), l'averse qui traverse la campagne quand l'Eau coule, des reflets qui balaient les verrières, un halo chaud, du pollen et des lointains flous. Le calque SVG garde par-dessus ce qui se touche ou bouge de lui-même (parcelles proposées, projets, espèces, vélos-cargos). Avec les animations réduites, l'image est fixe.

**Assets de la carte enrichie (2026-10-11).** Demande d'Antoine : exploiter pleinement le rendu WebGL pour détailler tous les éléments de la carte. Chaque générateur a un dessin plus fouillé, toujours éclairé du côté du soleil : arbres à houppier en touffes de feuilles (ombre et lumière sur chaque touffe, moucheture de feuilles, fleurs de lilas, d'or ou de cerisier) que la brise balance par vagues ; pots d'héliotrope à dôme de fleurettes (violet au cœur, lilas au bord, cœurs dorés au troisième palier) ; panneaux à cellules et fils d'argent où glisse le ciel ; potagers sur plancher de bois, bacs à salades, tomates tuteurées, lavande puis tournesols, avec un récupérateur d'eau ; serres à vitres, ciel reflété, allée centrale, porte, lucarnes ouvertes avec les paliers ; fermes verticales en terrasses de bois qui s'ombrent l'une l'autre, débordant d'arbustes, arbres d'angle, garde-corps vitrés, verrière et lames solaires ; héliostats à quatre facettes et reflet de soleil, sur une prairie à allées de gravier autour de la tour, dont le récepteur rayonne et luit ; arcologie à pétales en gradins plantés ou vitrés à meneaux. Les bâtiments gagnent fenêtres encadrées, jardinières en fleurs et lierre à mesure que la ville reverdit, gravier et jardinières sur les toits, et des toits de sedum en nappes de verts et de roux traversées d'une allée. Au printemps, les feuilles restent vertes et seules les fleurs rosissent. Le rendu SVG de secours garde ses dessins plus simples.

**Parcelles, Biorégion et voisins détaillés (2026-10-11).** Les dessins SVG partagés, que la carte enrichie reprend en textures, gagnent la même finesse : sols texturés (brins de prairie, gazon tondu en bandes, pavés jointoyés), touffes d'herbe, arbres à lobes ombrés et éclairés (fruits au verger, fleurs au printemps), bancs à dossier ; noues avec lit, reflets, pas japonais, roseaux et iris ; hôtels à insectes sur les bandes fleuries ; parc avec allée bordée, berge, nénuphars et massif fleuri ; places pavées en dalles ; toits de sedum en nappes de trois tons. Les seconds avenirs reprennent ces sols. Dans la Biorégion, les collines ont ombre et lumière, les champs une bordure et un vieil arbre d'angle, la forêt nourricière des houppiers à lobes et des fruits, l'étang nénuphars et roseaux. Les vélos-cargos portent un cycliste aux bras sur le guidon et des feuilles et fleurs dans la caisse ; les arbres des quartiers voisins ont des houppiers à lobes. Au printemps, dans les deux rendus, les feuilles restent vertes et seules les fleurs rosissent.

**Accessibilité.** Contraste AA sur tout le texte (l'or et le lilas servent d'accents, pas de couleur de texte sur fond clair), animations réduites si `prefers-reduced-motion`, aucune information portée par la couleur seule.

### 10.5 Confort et lisibilité (M10)

Le confort en attente depuis M5 (roadmap, « Confort à glisser au fil de l'eau ») : chaque palier se lit d'un coup d'œil, sans texte de plus. Aucun de ces ajouts ne change l'équilibrage. Code dans `src/game/goals.ts`, `src/game/history.ts`, `src/ui/Goals.tsx` et `src/ui/ProductionCurve.tsx`.

- **Temps avant achat.** Sous le prix d'un bâtiment (pour la quantité choisie), de l'amélioration choisie, d'une parcelle ou d'un projet hors de portée : « dans 2 min », la Lumière qui manque divisée par la production actuelle, arrondie à la seconde supérieure. Rien tant que rien n'est produit, ni quand le bâtiment a atteint la limite d'une Saison à défi.
- **Prochain objectif.** Dans le compteur, à côté de la production : « Prochain : Serre, dans 3 min », l'achat proposé le moins cher que la réserve ne couvre pas encore, parmi les bâtiments (le prochain à découvrir compris, à son prix de base, nommé « Encore à découvrir »), les améliorations, les parcelles et les projets. C'est la règle d'or du §2 rendue visible ; il disparaît quand tout ce qui est proposé est abordable.
- **Raccourcis clavier.** Les touches 1 à 8 achètent le bâtiment de ce rang (s'il est découvert) dans la quantité choisie ; M passe à Max, puis revient à ×1. Aucune touche ne clique la fleur, pour ne pas encourager l'autoclic. Les raccourcis se taisent dans un champ de texte et quand une fenêtre est ouverte.
- **Courbe de la production.** Dans les Statistiques, la Lumière par seconde au fil de chaque Saison, pour les six dernières (celle en cours comprise), sur une échelle logarithmique pour que la première et la dernière tiennent ensemble. La Saison en cours est le trait vert foncé, les précédentes en vert sauge, de plus en plus pâles avec l'âge, avec leur nom en légende. Pointer la courbe lit la production de chaque Saison à ce moment. Un point toutes les 30 s de Saison ; à 120 points, l'intervalle double, pour garder toute la Saison en peu de place. Une longue absence dessine un plateau à la production du retour, sans inventer de forme. Les courbes sont dans la sauvegarde (version 12) ; une sauvegarde plus ancienne commence la sienne à la Saison en cours.
- **Installation en application.** Le jeu s'installe comme une application (manifeste et icônes) et se recharge sans connexion une fois chargé : un service worker sert la page depuis le réseau s'il y en a un, sinon depuis son cache, et garde les fichiers du jeu (au plus 80, les plus anciens partant en premier). La sauvegarde reste dans le navigateur, comme avant.

### 10.6 L'accueil et les rappels (M17)

- **Première minute guidée, sans texte.** Pendant la toute première Saison, un halo doré respire sur le geste suivant : la fleur tant qu'on ne l'a pas cliquée, puis le bouton d'achat de l'Héliotrope en pot dès qu'on peut se l'offrir, puis la première amélioration abordable. Il disparaît dès que le geste est fait et ne revient plus après la première amélioration achetée, ni après la première Saison. Aucune bulle d'explication. Code dans `src/game/guide.ts`.
- **Rappels facultatifs (décision D8).** Dans les Options, « Rappels », **désactivés par défaut** : une fois le navigateur autorisé, une notification quand les Graines deviennent mûres ou qu'une culture du potager est prête, seulement quand le jeu est ouvert dans un onglet caché ou une fenêtre d'application en arrière-plan. Le jeu ne pousse jamais à revenir à heure fixe (§1). Code dans `src/ui/useReminders.ts`.
- **Sauvegarde.** Version 19 : le volume de la musique (vide tant que le joueur ne l'a pas réglé) et les rappels (désactivés).

---

### 10.7 Une interface rangée (M25)

Roadmap P24 : avec la v2 et la v3, le menu latéral avait neuf panneaux. Code dans `src/game/panels.ts` (pur) et `src/ui/App.tsx`.

- **Trois couches.** Les panneaux se rangent sous trois onglets à icône, en haut du menu : **La ville** (Améliorer, Bâtir, Le quartier, Coopératives), **Le vivant** (Potager, Verger, Alliances) et **La région** (Biorégion, Grands chantiers). Une couche n'apparaît qu'avec son premier panneau ; la barre n'apparaît qu'avec la deuxième couche (le potager, dès le premier pot ; la région arrive avec la Biorégion). Un seul onglet à la fois, gardé dans le navigateur. Sur les très grands écrans (dès 1760 px), les deux colonnes montrent toujours tout et la barre disparaît.
- **Téléphone.** La barre d'onglets du bas devient Bâtir (bâtiments, Coopératives), Améliorer (améliorations, Le quartier), Le vivant, La région et Plus ; un onglet n'apparaît qu'avec sa couche.
- **Ce qui vient de s'ouvrir.** Un panneau que le joueur n'a pas encore touché s'entoure d'un **anneau doré qui respire**, jusqu'au premier toucher (clic ou focus clavier). L'onglet qui le contient porte un **point doré** tant qu'il n'est pas choisi (et « nouveau » pour les lecteurs d'écran). Aucun texte. Une sauvegarde plus ancienne compte comme vus tous les panneaux qu'elle montre déjà.
- **Ce qui attend.** Un panneau **replié** qui a quelque chose à faire maintenant (un achat possible, une récolte mûre, un arbre à planter, une place d'alliance libre, une étape de chantier prête) montre un point doré après son titre.
- **Les écrans** gardent leur barre d'icônes avec leurs pastilles (Graines mûres, Graines à semer, Sources) ; ils se chargent maintenant à leur première ouverture, ce qui allège le chargement de la carte (le fichier principal passe de 639 à 437 ko, 195 à 133 ko compressé, une partie se retrouvant dans des morceaux partagés).
- **Les doigts.** Sur écran tactile, les carrés mûrs du potager, les arbres mûrs du verger et les visites se touchent dans un cercle plus large que leur dessin. Le Papillon fait déjà 56 px.
- **Les sons** des systèmes récents (§6.3) : récolte et cueillette, étape de chantier et ruche, alliance.
- **Sauvegarde.** Version 26 : les panneaux déjà touchés.

### 10.8 Une nouveauté à la fois

Mesuré sur une partie neuve avant ce changement (joueur de référence du §8) : le potager, les améliorations et le bouton des Jalons arrivaient ensemble à 8 s, l'Herbier, le Papillon, les visites et le décor entre 3 et 5 min, et la 2ᵉ Saison ouvrait d'un coup l'Arbre, les Coopératives, les demandes des voisins et la météo. Code dans `src/game/introductions.ts` (ce qui est introduit) et `src/game/onboarding.ts` (l'ordre et le rythme).

- **Le principe.** Chaque mécanique garde sa condition d'ouverture ; une fois cette condition remplie, elle attend son tour. Une seule entre dans le jeu à la fois, **au moins 45 s de jeu après la précédente** (hors ligne compris : c'est du temps écoulé). La toute première attend 45 s après le début de la partie : la première minute reste à la fleur et au premier pot (§10.6). Tant qu'elle n'est pas introduite, une mécanique n'existe pas : ni panneau, ni effet, ni production (un Papillon ne vient pas, la météo ne joue pas).
- **L'ordre**, quand plusieurs attendent ensemble : le pollen, le potager, Le quartier (parcelles et projets), les Jalons, l'Herbier, le Papillon doré, les visites, le décor, les Saisons, l'Arbre des Saisons, la Biorégion, les Coopératives, les demandes des voisins, la météo, le verger, les grands chantiers, les alliances. Les améliorations et les bâtiments ne passent pas par là.
- **La jauge de pollen** (§5.6) n'est plus là dès le début : elle rejoint la fleur avec la première amélioration de clic (Mains tièdes, 15 clics), et reste dès la 2ᵉ Saison. Avant, les clics ne la remplissent pas.
- **Le signal, sans texte.** À l'arrivée de chaque mécanique, une lueur dorée s'allume sur la couronne de la fleur et trois anneaux dorés en partent, une fois. Puis la nouveauté se montre elle-même : un panneau s'entoure de son anneau doré et son onglet de son point (§10.7) ; un bouton (Jalons, Herbier, Saisons, Arbre), l'outil Décor ou la prévision du temps luisent quatre fois ; la jauge de pollen se dessine en or autour de la couronne ; le premier Papillon et la première visite arrivent 5 s après (au lieu d'attendre leur tirage). Avec les animations réduites (§10.4), rien ne bouge ni ne luit : il reste le point doré des onglets.
- **Rythme mesuré** (joueur de référence, `src/game/onboarding.test.ts`) : 1ʳᵉ Saison, pollen 0:45, potager 1:30, Le quartier 2:15, Jalons 3:00, Herbier 3:45, Papillon 4:35, visites 5:20, décor 6:05, Saisons vers 19 min ; 2ᵉ Saison, l'Arbre tout de suite, puis Coopératives, demandes et météo de 45 s en 45 s ; 3ᵉ Saison, la Biorégion tout de suite, puis le verger et les grands chantiers. Les cibles du §8 tiennent (les retards se comptent en dizaines de secondes).
- **Sauvegarde.** Version 32 : les mécaniques introduites et le temps depuis la dernière. Une sauvegarde plus ancienne reçoit toutes celles qu'elle montre déjà : rien ne disparaît.

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

Idées à reprendre quand le MVP est stable, par ordre de priorité proposé  (la suite, de M13 à M30, est planifiée dans `docs/roadmap.md`) :

1. ~~**Carte du quartier.**~~ *Livré en M6 (§6.1).* Une grille de parcelles grises (friches, parkings, toits nus) à restaurer contre de la Lumière. Chaque parcelle restaurée apporte un bonus ciblé (un parc : +clic ; une rivière dépolluée : +1 h de plafond hors ligne ; un verger : +% à un générateur). Rend la restauration du monde concrète et visuelle.
2. ~~**Arbre des Saisons** (§7) : talents permanents achetés avec les Graines.~~ *Livré en M7 (§7.1), avec les Coopératives (§7.2).*
3. **Cycle jour / nuit et batteries.** La production solaire varie au fil d'une journée de jeu ; des batteries stockent le surplus. À tester avec prudence : ne doit jamais punir le joueur absent.
4. ~~**Deuxième couche : la Biorégion.** Nouvelle ressource (Eau ou Biodiversité), nouveaux générateurs, deuxième niveau de prestige.~~ *Livré en M9 (§7.4).*
5. ~~**Défis de Saison.** Saisons à contraintes (« sans Panneaux », « clic seulement ») qui donnent des récompenses uniques.~~ *Livré en M8 (§7.3), avec l'Herbier (§9.5).*
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
