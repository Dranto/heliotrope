// French texts (docs/game-design.md §14 Q1: French first, texts kept out of the code so an
// English translation can be added later).
import type { GeneratorId } from '../game/generators';
import type { ClickUpgradeId, SynergyId } from '../game/upgrades';

export interface GeneratorText {
  name: string;
  flavour: string;
}

export interface UpgradeText {
  name: string;
  flavour: string;
}

type SevenTexts = [
  UpgradeText,
  UpgradeText,
  UpgradeText,
  UpgradeText,
  UpgradeText,
  UpgradeText,
  UpgradeText,
];

/** French quotation marks with no-break spaces. */
const q = (text: string) => `«\u00a0${text}\u00a0»`;

const u = (name: string, flavour: string): UpgradeText => ({ name, flavour: q(flavour) });

export const fr = {
  title: 'Heliotrope',
  tagline: 'Faire reverdir la ville, un rayon à la fois',
  light: 'Lumière',
  perSecond: '/ s',
  perClick: 'par clic',
  clickFlower: 'Récolter la lumière de l’héliotrope',
  clickHint: 'Touchez la fleur pour récolter sa lumière',
  generatorsTitle: 'Bâtir',
  owned: 'possédés',
  produces: 'produit',
  unknownGenerator: 'Encore à découvrir',
  buy: 'Acheter',
  buyLabel: (name: string, cost: string, count = 1) =>
    count === 1
      ? `Acheter ${name} pour ${cost} Lumière`
      : `Acheter ${count} ${name} pour ${cost} Lumière`,
  buyAmount: 'Quantité à acheter',
  buyMax: 'Max',
  biodiversity: (percent: string) => `Biodiversité +${percent}\u00a0%`,
  biodiversityHint:
    'Chaque type de bâtiment possédé à 10, 50 puis 100 exemplaires ajoute 2\u00a0% à toute la production.',
  upgradesTitle: 'Améliorer',
  noUpgrades: 'De nouvelles améliorations apparaîtront à mesure que le quartier grandit.',
  upgradeEffect: {
    generatorMultiplier: (generator: string) => `${generator}\u00a0: production ×2`,
    clickMultiplier: 'Valeur du clic ×2',
    clickFromProduction: (percent: string) =>
      `Chaque clic rapporte aussi ${percent}\u00a0% de la production par seconde`,
    synergy: (generator: string, percent: string, source: string) =>
      `${generator}\u00a0: +${percent}\u00a0% par ${source} possédé`,
  },
  buyUpgradeLabel: (name: string, cost: string) => `Acheter ${name} pour ${cost} Lumière`,
  sceneLabel: 'Le quartier, qui reverdit à mesure que vous construisez',
  welcomeBack: (light: string, duration: string) =>
    `Pendant votre absence (${duration}), le quartier a récolté ${light} Lumière.`,
  dismiss: 'Fermer',
  minutes: (n: number) => `${n} min`,
  hours: (h: number, m: number) => (m === 0 ? `${h} h` : `${h} h ${m}`),
  options: {
    open: 'Options',
    title: 'Options',
    close: 'Fermer les options',
    saveTitle: 'Sauvegarde',
    saveHint: 'La partie est sauvegardée automatiquement toutes les 30 secondes.',
    saveNow: 'Sauvegarder maintenant',
    saved: 'Partie sauvegardée.',
    exportTitle: 'Exporter',
    exportHint: 'Copiez ce texte pour garder votre partie ou la reprendre sur un autre appareil.',
    exportLabel: 'Texte de la sauvegarde',
    copy: 'Copier',
    copied: 'Copié dans le presse-papiers.',
    importTitle: 'Importer',
    importHint: 'Collez une sauvegarde exportée. Elle remplacera la partie en cours.',
    importLabel: 'Sauvegarde à importer',
    importAction: 'Charger cette sauvegarde',
    importError: 'Ce texte n’est pas une sauvegarde valide.',
    imported: 'Sauvegarde chargée.',
    resetTitle: 'Recommencer',
    resetHint: 'Efface toute la progression, sans retour possible.',
    reset: 'Tout effacer',
    resetConfirm: 'Effacer vraiment toute la partie\u00a0?',
    resetYes: 'Oui, continuer',
    resetConfirmAgain: 'Dernière confirmation\u00a0: tout effacer',
    cancel: 'Annuler',
    resetDone: 'La partie a été remise à zéro.',
  },
  generators: {
    pot: { name: 'Héliotrope en pot', flavour: q('Elle suit le soleil. Nous aussi.') },
    balconyPanel: { name: 'Panneau de balcon', flavour: q('Un panneau, une prise, un début.') },
    rooftopGarden: { name: 'Potager sur le toit', flavour: q('Les tomates aiment la vue.') },
    greenhouse: { name: 'Serre communautaire', flavour: q('Chacun apporte ses semis.') },
    verticalFarm: {
      name: 'Ferme verticale',
      flavour: q('Douze étages de laitues et de lumière.'),
    },
    mirrorPlant: { name: 'Centrale à miroirs', flavour: q('Mille miroirs, un seul soleil.') },
    urbanCanopy: { name: 'Canopée urbaine', flavour: q('Les rues deviennent des sous-bois.') },
    arcology: { name: 'Arcologie vivante', flavour: q('Une ville qui respire.') },
  } satisfies Record<GeneratorId, GeneratorText>,
  /** §5.1: the seven ×2 upgrades of each generator, by owned threshold. */
  generatorUpgrades: {
    pot: [
      u('Terreau maison', 'Un peu de marc de café, beaucoup d’attention.'),
      u('Pots en terre cuite', 'Ils respirent, les racines aussi.'),
      u('Boutures entre voisins', 'Une tige offerte en vaut dix.'),
      u('Goutte-à-goutte', 'Pas une goutte de perdue.'),
      u('Héliotropes géants', 'Elles dépassent maintenant la rambarde.'),
      u('Graines choisies', 'Nous gardons les plus lumineuses.'),
      u('Floraison perpétuelle', 'Elle ne fane plus, elle se repose.'),
    ],
    balconyPanel: [
      u('Câblage soigné', 'Moins de pertes, plus de lumière.'),
      u('Panneaux orientables', 'Ils suivent le soleil, comme la fleur.'),
      u('Lierre rafraîchissant', 'Les feuilles gardent les cellules au frais.'),
      u('Cellules bifaciales', 'La lumière est captée des deux côtés.'),
      u('Microréseau d’immeuble', 'Les voisins partagent leurs surplus.'),
      u('Vitres solaires', 'Même les fenêtres s’y mettent.'),
      u('Cellules recyclées', 'Rien ne se perd, tout se transforme.'),
    ],
    rooftopGarden: [
      u('Terreau de compost', 'Les épluchures d’hier, les tomates de demain.'),
      u('Paillage', 'Le sol reste humide et vivant.'),
      u('Cuves de pluie', 'Chaque averse remplit les réserves.'),
      u('Ruches sur le toit', 'Les abeilles font la tournée des balcons.'),
      u('Permaculture', 'Chaque plante aide sa voisine.'),
      u('Châssis d’hiver', 'Des récoltes même sous la neige.'),
      u('Forêt-jardin suspendue', 'Un verger à vingt mètres du sol.'),
    ],
    greenhouse: [
      u('Grainothèque', 'Chacun dépose, chacun emprunte.'),
      u('Double vitrage', 'La chaleur reste, le froid attend dehors.'),
      u('Ateliers du samedi', 'On apprend à greffer en riant.'),
      u('Lumière diffuse', 'Pas une feuille dans l’ombre.'),
      u('Aquaponie', 'Les poissons nourrissent les salades.'),
      u('Calendrier partagé', 'Tout le quartier a sa demi-journée.'),
      u('Serre-cathédrale', 'Une nef de verre ouverte à tous.'),
    ],
    verticalFarm: [
      u('LED horticoles', 'Une lumière taillée pour les feuilles.'),
      u('Plateaux tournants', 'Chaque étage passe à la fenêtre.'),
      u('Brumisation fine', 'Les racines boivent l’air.'),
      u('Capteurs de croissance', 'Chaque laitue a son petit carnet.'),
      u('Substrat de chanvre', 'Léger, local, compostable.'),
      u('Façades nourricières', 'Les murs eux-mêmes produisent.'),
      u('Tours jumelles', 'Deux tours, une seule récolte.'),
    ],
    mirrorPlant: [
      u('Miroirs auto-orientables', 'Ils suivent le soleil sans qu’on y pense.'),
      u('Lavés par la rosée', 'La nuit nettoie ce que le jour a voilé.'),
      u('Sels fondus', 'Le soleil de midi, servi le soir.'),
      u('Verre recyclé', 'Les bouteilles d’hier renvoient la lumière.'),
      u('Vergers entre les rangs', 'Les pommiers aiment cette ombre légère.'),
      u('Tour de concentration', 'Mille rayons, un seul point.'),
      u('Soleil apprivoisé', 'Une étoile, tout en douceur.'),
    ],
    urbanCanopy: [
      u('Arbres d’alignement', 'Chaque rue choisit son essence.'),
      u('Ponts de branches', 'Les écureuils traversent la ville sans toucher le sol.'),
      u('Feuilles solaires', 'On ne sait plus ce qui est arbre ou panneau.'),
      u('Corridors verts', 'Les oiseaux sont revenus en ville.'),
      u('Réseau mycorhizien', 'Sous nos pieds, les racines se parlent.'),
      u('Canopée étagée', 'Trois strates de verdure, du sol au ciel.'),
      u('Forêt habitée', 'On y vit, on y travaille, on y respire.'),
    ],
    arcology: [
      u('Murs respirants', 'Le bâtiment inspire, la ville expire.'),
      u('Jardins à chaque palier', 'Personne ne vit à plus de dix pas d’un arbre.'),
      u('Eau en boucle', 'Pas une goutte ne quitte la ville.'),
      u('Assemblées sous les feuilles', 'Les décisions se prennent à l’ombre des tilleuls.'),
      u('Bois vivant', 'Les murs poussent encore un peu chaque année.'),
      u('Terrasses pollinisatrices', 'Nos fleurs nourrissent toute la région.'),
      u('Symbiose', 'La ville et la forêt ne font plus qu’une.'),
    ],
  } satisfies Record<GeneratorId, SevenTexts>,
  clickUpgrades: {
    gloves: u('Gants de jardinage', 'Des mains protégées récoltent plus.'),
    copperCan: u('Arrosoir en cuivre', 'Le cuivre chante sous la pluie.'),
    greenHands: u('Mains vertes', 'Tout ce que nous touchons pousse.'),
    sharedGesture: u('Geste partagé', 'Quand l’un récolte, tout le quartier récolte.'),
    solarHarvest: u('Cueillette solaire', 'Cueillir un rayon comme une fraise.'),
  } satisfies Record<ClickUpgradeId, UpgradeText>,
  synergies: {
    sharedCompost: u('Compost partagé', 'Les serres nourrissent les toits.'),
    usefulShade: u('Ombre utile', 'Sous chaque arbre, un panneau au frais.'),
    recoveredHeat: u('Chaleur récupérée', 'Les miroirs chauffent nos semis.'),
  } satisfies Record<SynergyId, UpgradeText>,
};

export const t = fr;
