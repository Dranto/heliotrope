# Heliotrope — Plan d'optimisation des performances

> Statut : proposé le 2026-10-14 à la demande d'Antoine (« établis un plan pour optimiser les performances de
> l'application »). Le 2026-10-14, Antoine a demandé de l'appliquer : chaque lot ci-dessous est une PR, dans
> l'ordre. Fait : lots 0, 1 et 2.

## 1. Ce qui a été mesuré

Mesures faites sur `main` au 2026-10-14 (après #106), build de production servi par `vite preview`, Chromium
sans GPU (rendu WebGL logiciel SwiftShader). Quatre sauvegardes tirées du simulateur : milieu de la Saison 1
(`s1mid`), fin de la Saison 2 (`s2`), Cycle de l'eau atteignable avec la Biorégion ouverte (`cycle`), et une
partie neuve. « Téléphone » = 390 × 844 px, DPR 3, CPU ralenti ×4.

### Moteur de jeu (`src/game/`) : sain

| Mesure | s1mid | s2 | cycle | après 4 Saisons de Cycle |
| --- | --- | --- | --- | --- |
| `tick(state, 0.1)` | 0,13 ms | 0,22 ms | 0,23 ms | 0,27 ms |
| Sauvegarde (taille, `serialize`) | 5,5 Ko, 0,03 ms | 8,3 Ko | 11,7 Ko | 9 Ko, 0,04 ms |
| Progrès hors ligne 8 h au chargement | 94 ms | 197 ms | 213 ms | 286 ms |

À 10 ticks par seconde, la simulation coûte moins de 0,3 % d'un cœur. Le seul point à surveiller est le retour
après 8 h d'absence : ~0,3 s sur ordinateur, sans doute plus d'une seconde sur un téléphone modeste.

### Interface React : un coût modéré

Chaque tick (10 par seconde) crée un nouvel état ; `useGameState()` est lu par 26 composants dont `App` et
`Scene`. Les dessins de la carte sont déjà mémorisés (`memo`, `useMemo`) et ne se redessinent pas ; ce sont les
panneaux et leurs icônes qui se redessinent à chaque tick.

| Scène (`npm run perf`) | Composants rendus par tick | JS du fil principal | Fil principal en tout |
| --- | --- | --- | --- |
| Partie neuve, SVG, ordinateur | 22 | 23 ms/s | 38 ms/s |
| s1mid, SVG, ordinateur | 83 | 35 ms/s | 51 ms/s |
| s2, SVG, ordinateur | 106 | 55 ms/s | 67 ms/s |
| cycle, SVG, ordinateur (13 900 nœuds DOM) | 133 | 65 ms/s | 85 ms/s |
| cycle, SVG, téléphone CPU ×4 | 132 | **297 ms/s** | 371 ms/s |

Correction du 2026-10-14 : la première version de ce plan annonçait ~1 450 composants par tick. Le compteur
comptait aussi les sous-arbres que React n'avait pas touchés ; corrigé avec le lot 0, il en trouve ~130. Le
temps de JS mesuré, lui, était juste : il vient surtout des panneaux (icônes des améliorations, temps
d'attente `Eta`, onglets) et des calculs dérivés refaits à chaque rendu (`bonusesOf`, `generatorMultiplier`,
formatage des nombres), plus le travail du DOM qu'ils entraînent.

### Carte et animations : le coût GPU, à confirmer sur un vrai appareil

Sans GPU, le processus graphique est saturé dans toutes les scènes, en SVG comme en PixiJS, et la page tombe à
~1 image par seconde. Les valeurs absolues ne disent donc rien d'un vrai appareil, mais les comparaisons, si :

- **Mouvement réduit** : le travail du processus graphique tombe de ~990 à ~136 ms/s (÷7). Couper seulement les
  animations CSS (pseudo-éléments compris) donne le même résultat : ce sont les animations continues (rayons,
  poussières, nuages, plante, pollen, papillon…) qui forcent un nouveau dessin de la scène à chaque image. Dans une
  scène SVG, un élément animé fait redessiner tout le SVG qui le contient.
- **Flou d'arrière-plan** (`backdrop-filter`, 14 règles) : le retirer ne gagne que ~7 %.
- **Carte PixiJS** : ~30 appels de dessin et ~25 changements de cible de rendu par image. Le lot de dessin est bien
  regroupé ; ce sont les passes de filtres qui coûtent : étalonnage des couleurs sur tout le monde (`grade`, plein
  écran), relief des bâtiments et des arbres, deux déplacements d'eau, et l'ombre recuite (trois flous) dès que
  le soleil a bougé de 0,01, soit environ chaque seconde. Le ticker n'a pas de limite d'images : il suit le taux
  de rafraîchissement de l'écran, 120 Hz sur beaucoup de téléphones récents.
- **Démarrage de la carte PixiJS** : 12 à 18 s ici, dont 12 s de création de contextes WebGL de test
  (`getTestContext`, `canUseNewCanvasBlendModes` de Pixi, plus le test `drawsWebGLWell` du jeu). C'est
  surtout un artefact du rendu logiciel, mais le jeu crée bien 2 à 3 contextes WebGL au démarrage.

### Chargement

- JavaScript initial : **222 Ko gzip** (770 Ko bruts) en 4 fichiers ; CSS 29 Ko gzip. Les écrans secondaires
  (Jalons, Herbier, Saisons, Arbre, Cycles, Villes, Statistiques) et la carte PixiJS (105 Ko gzip) sont déjà
  chargés à la demande.
- Les deux langues sont dans le paquet initial (`fr.ts` 83 Ko, `en.ts` 75 Ko de source).
- Polices : Fraunces est chargée avec tous ses axes (`full.css`, 121 Ko pour le latin) car l'axe `SOFT` est
  utilisé ; la version graisse seule pèse 37 Ko.
- Le service worker met déjà les fichiers en cache : le coût de chargement ne vaut que pour la première visite et
  les mises à jour.

## 2. Le plan, par ordre de priorité

Chaque lot est une PR, sans changement de gameplay ni d'équilibrage, et se mesure avant/après avec le même outil
(lot 0). Les gains annoncés sont des estimations tirées des mesures ci-dessus.

### Lot 0 : de quoi mesurer (préalable, petit)

- Un script `npm run perf` (Playwright et le Chromium de l'environnement) qui rejoue les quatre sauvegardes et
  affiche le tableau du §1 : composants rendus par tick, JS du fil principal, appels WebGL par image.
- Un compteur discret activé par `?perf` dans l'URL : images par seconde, durée d'image, composants rendus par
  tick. **C'est le seul moyen de mesurer le GPU sur le vrai appareil d'Antoine** ; le conteneur n'en a pas.
- Un test Vitest qui rend l'application sur une sauvegarde de fin de partie, avance d'un tick et vérifie que le
  nombre de composants rendus reste sous un plafond, pour que le gain du lot 1 ne se perde pas.

### Lot 1 : ne redessiner que ce qui change (fait)

- Les panneaux que la feuille de style cache (onglets du téléphone, couches du menu sur écran moyen) dorment :
  ils ne sont plus rendus (`panelVisibility.ts`). Les améliorations et les bâtiments restent toujours montés,
  pour leurs raccourcis clavier.
- Les icônes qui ne dépendent pas du tick sont mémorisées (`UpgradeIcon`, `GeneratorIcon`, onglets, météo…).
- Les multiplicateurs de production sont calculés une fois par état (`generatorMultiplier`,
  `globalMultiplier`), comme #38 l'a fait pour la production totale.
- Mesuré avec `npm run perf` : JS du fil principal sur la sauvegarde `cycle` de 65 à 40 ms/s sur ordinateur et
  de 297 à 164 ms/s sur le téléphone simulé ; 163 → 66 composants par tick dans le test de plafond.

### Lot 2 : la carte PixiJS économe (fait, à valider par Antoine)

- Images par seconde (`frameCap`) : ~30 pour la vie d'ambiance, toutes celles de l'écran pendant un glissement
  de caméra, une apparition, un anneau de clic ou l'éclat d'une amélioration. Sur un écran 120 Hz, la carte
  dessinait jusqu'ici 120 images par seconde en continu : quatre fois moins de travail graphique au repos.
- Ombres : recuites quand le soleil a bougé de 0,03 au lieu de 0,01 (`SHADOW_STEP`). Le soleil se déplace
  d'environ 0,025 par seconde : trois flous recuits toutes les ~1,2 s au lieu de ~2,5 fois par seconde.
- Qualité adaptative (`nextTier`) : quand la médiane des écarts entre images calmes dépasse 1,6 fois l'écart
  visé pendant 4 s, la carte descend d'un cran : résolution 1,5, puis 1, puis sans le relief des bâtiments et des
  arbres. Elle ne remonte pas pendant la partie. Le cran atteint s'affiche dans le compteur `?perf` (`q0` à
  `q3`).
- Pas fait : l'étalonnage reste appliqué au monde (le passer sur l'image finale teinterait aussi le voile de
  lumière, le pollen et le vignettage) ; les filtres de relief étaient déjà à la résolution de l'écran et l'eau
  doit le rester (sinon les ruisseaux fins crénellent) ; les contextes WebGL de test au démarrage ne coûtent
  cher qu'en rendu logiciel, le gain sur un vrai appareil ne justifie pas de contourner Pixi.

### Lot 3 : animations d'ambiance (gain fort quand il n'y a pas de GPU)

- Le rendu SVG est choisi justement sur les appareils sans bon GPU, et c'est lui que les animations continues
  pénalisent le plus. Quand le SVG a été choisi automatiquement, limiter l'ambiance aux animations qui ne font
  que des `transform`/`opacity` sur des éléments HTML (composées par le navigateur sans redessin), et mettre les
  rayons, poussières et nuages en pause.
- Isoler les éléments animés de la carte SVG dans leurs propres calques (`<svg>` superposés ou HTML) pour qu'une
  poussière animée ne fasse plus redessiner les 13 000 nœuds de la ville.
- Option « Économie d'énergie » dans les Options (affichage) : animations d'ambiance en pause, 30 images/s,
  pas de flou d'arrière-plan. Le jeu reste identique.

### Lot 4 : chargement (gain modéré, première visite)

- Charger la langue non choisie à la demande (≈−20 Ko gzip).
- Réduire Fraunces aux axes réellement utilisés (graisse et `SOFT`) par un sous-ensemble généré
  (≈−60 Ko de police).
- Vérifier ce que contient le paquet initial (dessins des écrans et des espèces, données des Jalons) et passer
  en chargement différé ce qui ne sert pas à la première minute ; objectif < 180 Ko gzip.

### Lot 5 : retour après une longue absence (gain modéré, téléphone)

- Le calcul hors ligne de 8 h prend ~0,3 s sur ordinateur. Afficher d'abord l'écran de retour, calculer
  ensuite par morceaux sans bloquer le fil principal, ou agrandir les pas de simulation quand rien ne s'achète.

## 3. Ce que seul l'appareil d'Antoine peut confirmer

- La fluidité réelle de la carte PixiJS (images par seconde, chauffe, batterie) avant et après le lot 2, avec le
  compteur `?perf` du lot 0, de préférence sur son téléphone et sur son ordinateur.
- Le temps réel de démarrage de la carte PixiJS (ici faussé par le rendu logiciel).
- Le gain réel des lots 3 et 4 sur une connexion mobile.

## 4. Ce qui n'est pas à faire

- Optimiser le moteur de jeu : il pèse moins de 0,3 ms par tick.
- Passer à une bibliothèque de grands nombres ou changer la fréquence du tick : pas de gain mesurable.
- Retirer des détails graphiques : les lots 2 et 3 gardent la même scène et ne changent que la façon de la dessiner.
