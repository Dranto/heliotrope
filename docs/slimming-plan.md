# Heliotrope — Plan d'allègement

> Statut : proposé le 2026-10-26 à la demande d'Antoine : « étoffer le jeu et supprimer les mécaniques de
> gameplay avec peu d'impact et peu compréhensibles pour alléger le jeu et se concentrer sur renforcer les
> mécaniques intéressantes (bâtir / améliorer / quartier / étendre l'arbre des saisons / avoir de vrais choix
> impactants pour la partie) ». Rien n'est retiré tant qu'Antoine n'a pas validé ce plan. Chaque lot est une PR,
> dans l'ordre, avec le design doc mis à jour dans la même PR.

## 1. D'où l'on part

Le recensement du 2026-10-26 (46 mécaniques, 15 parties complètes simulées, page « Mécaniques d'Heliotrope »
et `recensement-mecaniques/` dans les fichiers du projet) donne trois familles :

- **Le cœur, qui fait toute la partie** : bâtiments, améliorations ×2 et de clic, synergies, biodiversité,
  parcelles, projets, Saisons et Graines, Arbre des Saisons et Canopée, Biorégion, Sources et delta, villes
  sœurs. Les améliorations pèsent jusqu'à ×22 600, les Graines ×1,2 million, les Sources ×86.
- **Deux boucles actives fortes** : le potager (récolté toutes les 3 min : 1ᵉʳ Cycle −35 %) et les visites
  (1ʳᵉ Saison −15 %).
- **Une couronne de petites boucles** qui ne changent aucune minute de la partie mesurée et demandent chacune
  un panneau, des règles et souvent un geste : alliances, grande floraison, demandes des voisins et leurs liens,
  saluts, échange de prévision, grands chantiers, verger et ruches, cadeaux des Jalons, bouquet. Elles se
  nourrissent surtout entre elles (les chantiers attendent le miel, les liens attendent les quartiers voisins,
  les alliances renforcent le Papillon et le potager), et plusieurs chaînes sont coupées (aucun fruit du verger
  en 5 h de jeu, aucun lien de demande).

Les choix, eux, ne pèsent pas : les deux voies des bâtiments et les deux avenirs des parcelles « se valent »
par design, et le joueur de référence ne perd rien à prendre toujours la première option.

## 2. Ce qui part

| Mécanique | Pourquoi | Ce qu'on garde de son effet |
| --- | --- | --- |
| **Alliances** (14) et leurs places | ×1,00 pour le joueur de référence, ×1,09 au plus ; 9 sur 14 renforcent une autre petite boucle | Rien : leurs effets utiles (prix, clic ×2) reviennent dans l'Arbre (§4.4) |
| **Grande floraison** | Jamais atteinte : demande tout l'Herbier, donc tous les défis | La carte qui fleurit devient la récompense de l'Herbier complet |
| **Demandes des voisins**, coups de main, liens | Aucun effet sur le rythme ; les liens restent vides même avec les 8 quartiers | Rien |
| **Saluer les espèces** | Un clic toutes les 10 min pour 4 % de jauge de pollen | Les espèces restent sur la carte, sans geste |
| **Échange de prévision** | Aucun effet mesuré, règle difficile à lire | La prévision reste affichée |
| **Grands chantiers** et paniers | ×1,01, aucun chantier au-delà de l'étape 2 en 5 h | La tour (+3 % par étape) et le tram passent aux quartiers voisins (§4.3) |
| **Verger, ruches, miel**, apiculteurs | Aucun fruit dans la partie mesurée (2 jours réels par arbre) | Les fraises s'ouvrent avec la Biorégion au lieu de la 1ʳᵉ ruche |
| **Cadeaux des Jalons** | Un geste de plus sans effet mesuré | Le +1 % par Jalon et les familles complètes restent |
| **Bouquet** | Invisible (quelques secondes par heure), mal compris | Rien |

Soit 9 panneaux ou gestes de moins, environ 4 000 lignes de jeu et d'interface, et quatre entrées de moins dans
la file « une nouveauté à la fois » (§10.8), qui ouvre ainsi plus tôt ce qui reste.

**Ce qui reste mais se simplifie.**

- **La météo** : un temps favorise ses bâtiments (×1,25), sans plus. On retire son effet sur les chances du
  Papillon, sur les voies (« sous leur ciel ») et sur chaque culture du potager. Les cinq espèces du temps restent.
- **L'Herbier** : aucune espèce ne revient par une mécanique retirée, rien ne change pour elles. La famille « Espèces du temps » donne un bonus simple (biodiversité ×1,1).
- **Les Jalons** : la quinzaine de Jalons liés aux mécaniques retirées (Première alliance, La toile du vivant,
  La grande floraison, Premier service, Bon voisin, Bonjour voisin, Première pierre, Grands travaux, Premier
  fruit, Vieux vergers, Vieil arbre, Bouquet, Grand bouquet…) sont remplacés un pour un par des Jalons des
  mécaniques renforcées (§4), pour que le compte et le bonus d'un joueur ne baissent jamais.

## 3. Ce qui ne bouge pas

Le clic et le pollen, le Papillon doré, les visites, le potager (sans paniers), les parcelles, les projets, les
quartiers voisins, les Saisons et leurs défis, la Biorégion, les Cycles et leurs défis, le delta, les villes
sœurs et l'atelier, les Coopératives, le hors ligne, le décor et le mode photo.

## 4. Ce qui se renforce

Principe : chaque renfort donne **un vrai choix**, dont les options mènent à des parties différentes, et
**touche ce qui fixe le rythme** au milieu de partie (la maturité des Graines, l'Eau, les prix) plutôt qu'un
multiplicateur de Lumière qui ne se voit pas.

### 4.1 Bâtir : des voies qui engagent (lot 4)

Les 24 voies (§5.5) deviennent des spécialisations : à chaque forme, **l'une renforce fort le bâtiment
(×2 au lieu de ×1,25-1,5), l'autre le relie à un système** (Graines qui mûrissent plus vite, Eau, prix,
clic), avec des effets nettement plus marqués. Une voie se change **une fois par Cycle** au lieu d'une fois par
Saison. Le panneau Bâtir montre ce que chaque voie change à la partie (« la Saison mûrit 20 s plus vite »).

### 4.2 Améliorer : des paliers qui changent une règle (lot 5)

Après les seuils ×2, une amélioration par bâtiment à 150 puis 300 exemplaires **change une règle** au lieu de
doubler (les pots comptent double dans la biodiversité, les serres font pousser le potager, les centrales
baissent le prix des collecteurs…). Les synergies gagnent un second rang (« Synergies renforcées ») qui double
leur bonus, au milieu des Saisons tardives où le panneau se vide.

### 4.3 Le quartier : des avenirs qui comptent et des quartiers qui pressent la Saison (lot 6)

- **Les avenirs** (§6.5) deviennent un choix entre deux styles : le premier avenir sert la Lumière, le second
  l'Eau ou les Graines (par exemple Rivière baignade : les Graines mûrissent 30 s plus vite). Les trames
  restent, et le changement d'avenir reste à une fois par Cycle.
- **Les quartiers voisins** gardent leur règle et ajoutent chacun un effet sur le rythme : 30 s de maturité en
  moins, collecteurs ou sites moins chers. Ils prennent aussi le +3 % de la tour des semences et le bonus du
  tram, pour que restaurer la périphérie se sente.
- **Le simulateur** les restaure (il ne le faisait pas), pour que les cibles du §8 les comptent.

### 4.4 L'Arbre des Saisons s'étend (lot 7)

- **Une quatrième branche, « Le Quartier »** (5 talents) : les remises des projets, la parcelle la plus chère à
  moitié prix chaque Saison, le clic ×2 de l'ancien Marché du tram, les bâtiments 10 % moins chers des Racines
  profondes, un projet de plus mené d'office.
- **Des fourches** : à trois endroits de l'arbre, deux talents s'excluent (par exemple *Boutures* garder 10 %
  des bâtiments, ou *Terre profonde* les Graines mûrissent 2 min plus vite). Le choix se refait au Cycle de
  l'eau, pas avant : c'est l'orientation de toute une série de Saisons.
- **La Canopée** reste, avec ses niveaux, au-dessus des quatre branches.

### 4.5 Rééquilibrage et mesure (lot 8)

Les retraits ôtent peu au rythme mesuré (aucune des mécaniques retirées ne le change), les renforts l'accélèrent.
Le lot 8 remesure toutes les cibles du §8, ajoute au test du simulateur un **joueur attentif** (potager
toutes les 3 min, visites accueillies, quartiers restaurés) avec ses propres cibles, et corrige la règle de
relance à ×1,5 Sources qui rend l'essaimage instable (3 h ou 4 h selon les bonus).

## 5. Les sauvegardes

Chaque lot qui retire une mécanique monte `STATE_VERSION` et ajoute une migration dans `save.ts` qui efface ses
champs. Ce qu'un joueur y avait mis ne lui donnait presque rien : il ne perd ni production ni Jalons (§2).
Les paniers, le miel et les arbres disparaissent sans compensation ; les cultures en cours restent.

## 6. Les lots

| Lot | Contenu | Version |
| --- | --- | --- |
| 1 | Retirer alliances, grande floraison, bouquet, cadeaux des Jalons | +1 |
| 2 | Retirer demandes, coups de main, liens, saluts, échange de prévision ; météo simplifiée | +1 |
| 3 | Retirer grands chantiers, paniers, verger, ruches, miel ; fraises avec la Biorégion | +1 |
| 4 | Bâtir : voies qui engagent | +1 |
| 5 | Améliorer : paliers qui changent une règle, synergies renforcées | +1 |
| 6 | Quartier : avenirs à deux styles, quartiers voisins sur le rythme, simulateur qui les restaure | — |
| 7 | Arbre : branche du Quartier, fourches | +1 |
| 8 | Rééquilibrage, joueur attentif, règle de relance | — |

Les Jalons de remplacement (§2) arrivent avec les lots 4 à 7. Chaque lot garde les cibles du §8 dans les ±30 %
ou les remesure dans la même PR.
