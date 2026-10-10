// French texts (docs/game-design.md §14 Q1: French first, texts kept out of the code so an
// English translation can be added later).
import type { AchievementId } from '../game/achievements';
import type { GeneratorId } from '../game/generators';
import type { JournalId } from '../game/journal';
import type { VisualSeason } from '../game/phases';
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
  phases: { 1: 'Le Balcon', 2: 'Le Quartier', 3: 'La Ville' } as Record<1 | 2 | 3, string>,
  visualSeasons: {
    spring: 'Printemps',
    summer: 'Été',
    autumn: 'Automne',
    winter: 'Hiver',
  } satisfies Record<VisualSeason, string>,
  tabs: {
    label: 'Sections du jeu',
    harvest: 'Récolte',
    build: 'Bâtir',
    improve: 'Améliorer',
    more: 'Plus',
  },
  butterfly: {
    catch: 'Attraper le Papillon doré',
    arrives: 'Un Papillon doré traverse le quartier.',
    bloom: 'Floraison\u00a0! Production ×3 pendant 60 secondes.',
    harvest: (light: string) => `Récolte\u00a0! +${light} Lumière.`,
    pollination: 'Pollinisation\u00a0! Chaque clic vaut ×100 pendant 10 secondes.',
    effects: 'Effets en cours',
    effect: {
      bloom: (seconds: string) => `Floraison ×3 · ${seconds}`,
      pollination: (seconds: string) => `Pollinisation ×100 · ${seconds}`,
    },
  },
  achievements: {
    open: 'Jalons',
    title: 'Jalons',
    close: 'Fermer les jalons',
    summary: (count: string, total: string, percent: string) =>
      `${count} sur ${total} jalons, production +${percent}\u00a0%`,
    hint: 'Chaque jalon atteint ajoute 1\u00a0% à toute la production, pour toujours.',
    unlocked: (name: string) => `Jalon atteint\u00a0: ${name}`,
    unlockedMany: (count: string) => `${count} jalons atteints\u00a0!`,
    locked: 'À atteindre',
    hiddenName: 'Jalon caché',
    names: {
      'light.3': 'Première lueur',
      'light.6': 'Rayon de miel',
      'light.9': 'Plein midi',
      'light.12': 'Soleil partagé',
      'light.15': 'Constellation',
      'light.18': 'Étoile apprivoisée',
      'pot.1': 'Une fleur au balcon',
      'pot.50': 'Balcon fleuri',
      'pot.100': 'Mer de lilas',
      'balconyPanel.1': 'Première prise',
      'balconyPanel.50': 'Façade solaire',
      'balconyPanel.100': 'Immeuble autonome',
      'rooftopGarden.1': 'Premières tomates',
      'rooftopGarden.50': 'Toits gourmands',
      'rooftopGarden.100': 'Ville potagère',
      'greenhouse.1': 'Premiers semis',
      'greenhouse.50': 'Serres en réseau',
      'greenhouse.100': 'Pépinière du quartier',
      'verticalFarm.1': 'Premier étage vert',
      'verticalFarm.50': 'Tours nourricières',
      'verticalFarm.100': 'Horizon de laitues',
      'mirrorPlant.1': 'Premier reflet',
      'mirrorPlant.50': 'Champ de miroirs',
      'mirrorPlant.100': 'Mille soleils',
      'urbanCanopy.1': 'Premier arbre',
      'urbanCanopy.50': 'Rues ombragées',
      'urbanCanopy.100': 'Forêt urbaine',
      'arcology.1': 'Première arcologie',
      'arcology.50': 'Ville vivante',
      'arcology.100': 'Biorégion',
      'clicks.100': 'Main tendue',
      'clicks.1000': 'Geste quotidien',
      'clicks.10000': 'Mains de jardinier',
      'butterflies.1': 'Battement d’ailes',
      'butterflies.10': 'Ami des papillons',
      'butterflies.50': 'Nuée dorée',
      'seasons.1': 'Premier hiver',
      'seasons.5': 'Cinq printemps',
      'seasons.10': 'Dix récoltes',
      mosaic: 'Mosaïque',
      slowPhotosynthesis: 'Photosynthèse lente',
      earlySowing: 'Semis précoce',
      wildGarden: 'Jardin sauvage',
    } satisfies Record<AchievementId, string>,
    describe: {
      allTimeLight: (amount: string) => `Récolter ${amount} Lumière au total`,
      owned: (generator: string, count: number) => `Posséder ${count} × ${generator}`,
      clicks: (count: string) => `Cueillir ${count} fois la lumière de l’héliotrope`,
      butterflies: (count: number) =>
        count === 1 ? 'Attraper un Papillon doré' : `Attraper ${count} Papillons dorés`,
      seasons: (count: number) =>
        count === 1 ? 'Accomplir une Saison' : `Accomplir ${count} Saisons`,
      everyGenerator: (count: number) => `Posséder ${count} exemplaires de chaque bâtiment`,
      idle: 'Ne rien acheter pendant 10 minutes',
      earlySowing: 'Commencer une Saison avant que la terre soit prête',
    },
  },
  journal: {
    title: 'Journal du quartier',
    open: 'Lire le journal',
    close: 'Fermer le journal',
    empty: 'Le carnet est encore vierge. Touchez la fleur.',
    entries: {
      firstLight: 'Sur le balcon, l’héliotrope s’est tournée vers nous.',
      firstPot: 'Un deuxième pot a rejoint le premier. La rambarde sent la vanille.',
      firstPanel: 'Le panneau est branché. La lampe de la cuisine s’allume au soleil.',
      neighbourAsks: 'Mme Okafor a ramené des boutures de sa sœur.',
      firstGarden: 'Sur le toit, les premières tomates rougissent. Karim a monté du terreau.',
      quarterWakes:
        'Les voisins du troisième ont repeint leur balcon en vert. Le quartier se réveille.',
      firstGreenhouse:
        'La serre communautaire ouvre le samedi matin. Il y a du café pour tout le monde.',
      firstButterfly:
        'Un papillon doré s’est posé sur la rambarde. Les enfants l’ont suivi jusqu’au parc.',
      firstFarm: 'La vieille tour de bureaux cultive maintenant des laitues sur douze étages.',
      streetVote: 'La rue des Tilleuls a voté pour un jardin partagé.',
      cityWakes: 'Depuis le toit, on voit d’autres quartiers verdir. Nous ne sommes plus seuls.',
      firstMirrors: 'Au bord de la ville, mille miroirs suivent le soleil entre les pommiers.',
      firstCanopy: 'Les platanes se rejoignent au-dessus de l’avenue. On y marche à l’ombre.',
      tenMilestones: 'Le journal tient maintenant sur un carnet entier. Lucie veut l’imprimer.',
      firstArcology: 'L’arcologie respire. Ses terrasses fleurissent jusqu’au ciel.',
      firstSeason: 'L’hiver est passé. Nous avons replanté, et la terre se souvient.',
      secondSeason: 'Nouveau printemps. Les boutures de Mme Okafor ont fait le tour de la ville.',
      fourSeasons: 'Quatre saisons ont passé. Le béton gris n’est plus qu’un souvenir.',
    } satisfies Record<JournalId, string>,
  },
  welcomeTitle: 'Pendant votre absence…',
  welcomeBack: (light: string, duration: string) =>
    `Pendant votre absence (${duration}), le quartier a récolté ${light} Lumière.`,
  dismiss: 'Fermer',
  /** A duration in seconds, at most two units: "42 s", "12 min", "2 h 05", "3 j 4 h". */
  duration: (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    if (s < 60) return `${s}\u00a0s`;
    const minutes = Math.floor(s / 60);
    if (minutes < 60) return `${minutes}\u00a0min`;
    const hours = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (hours < 24)
      return m === 0 ? `${hours}\u00a0h` : `${hours}\u00a0h\u00a0${String(m).padStart(2, '0')}`;
    const days = Math.floor(hours / 24);
    const h = hours % 24;
    return h === 0 ? `${days}\u00a0j` : `${days}\u00a0j\u00a0${h}\u00a0h`;
  },
  menu: 'Menu',
  seeds: {
    open: 'Saisons',
    openWithGain: (seeds: string) => `Saisons, ${seeds} Graines à gagner`,
    title: 'Les Saisons',
    close: 'Fermer les Saisons',
    intro:
      'L’hiver passe, nous replantons tout. Mais la terre garde la mémoire de ce qui a poussé.',
    chip: (seeds: string, percent: string) => `${seeds} Graines, production +${percent}\u00a0%`,
    owned: 'Graines d’Héliotrope',
    ownedHint: (percent: string) => `+${percent}\u00a0% de production`,
    toGain: 'À récolter',
    toGainHint: 'en lançant une nouvelle Saison',
    bonus: 'Bonus de production',
    bonusAfter: 'après la nouvelle Saison',
    nextSeed: (light: string) => `Prochaine Graine dans ${light} Lumière.`,
    formula:
      'Chaque Graine ajoute 5\u00a0% à toute la production. Les Graines viennent de la Lumière récoltée au fil de toutes les Saisons.',
    notReadyTitle: 'La terre n’est pas encore prête',
    notReady: (advised: string) =>
      `Rien ne vous en empêche, mais pour une première Saison, mieux vaut attendre d’avoir au moins ${advised} Graines à récolter.`,
    noSeedYet: 'Il faut au moins une Graine à récolter pour commencer une nouvelle Saison.',
    lostTitle: 'Repart de zéro',
    lost: [
      'La Lumière en réserve',
      'Les bâtiments',
      'Les améliorations',
      'Le décor du quartier, qui reverdira plus vite',
    ],
    keptTitle: 'Reste acquis',
    kept: ['Les Graines d’Héliotrope', 'Les statistiques', 'Les options'],
    start: 'Commencer une nouvelle Saison',
    confirm: (seeds: string) => `Replanter maintenant et récolter ${seeds} Graines\u00a0?`,
    confirmYes: 'Oui, replanter',
    cancel: 'Pas encore',
    started: (season: string) => `La ${season} commence. La terre se souvient.`,
    seasonName: (n: number) => (n === 1 ? '1ʳᵉ Saison' : `${n}ᵉ Saison`),
  },
  stats: {
    open: 'Statistiques',
    title: 'Statistiques',
    close: 'Fermer les statistiques',
    seasonTitle: (season: string) => `Cette Saison (${season})`,
    allTitle: 'Depuis le début',
    seasonLight: 'Lumière récoltée',
    seasonTime: 'Durée',
    production: 'Production',
    perSecond: (light: string) => `${light} / s`,
    clickValue: 'Valeur du clic',
    biodiversity: 'Biodiversité',
    allLight: 'Lumière récoltée',
    playTime: 'Temps de jeu',
    clicks: 'Clics sur l’héliotrope',
    seasons: 'Saisons accomplies',
    seeds: 'Graines d’Héliotrope',
    seedBonus: 'Bonus des Graines',
    butterflies: 'Papillons dorés attrapés',
    achievements: 'Jalons atteints',
    achievementBonus: 'Bonus des jalons',
    percent: (percent: string) => `+${percent}\u00a0%`,
  },
  options: {
    open: 'Options',
    title: 'Options',
    close: 'Fermer les options',
    displayTitle: 'Affichage',
    notation: 'Notation des grands nombres',
    notationShort: 'Suffixes courts (1,23\u00a0M)',
    notationScientific: 'Scientifique (1,23e6)',
    reducedMotion: 'Réduire les animations',
    reducedMotionHint:
      'Arrête le pollen, la respiration du soleil et le vol du papillon. Suit aussi le réglage de votre appareil.',
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
