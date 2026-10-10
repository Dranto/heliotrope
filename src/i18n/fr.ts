// French texts (docs/game-design.md §14 Q1: French first, texts kept out of the code so an
// English translation can be added later).
import type { GeneratorId } from '../game/generators';

export interface GeneratorText {
  name: string;
  flavour: string;
}

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
  buyLabel: (name: string, cost: string) => `Acheter ${name} pour ${cost} Lumière`,
  sceneLabel: 'Le balcon, qui reverdit à mesure que vous construisez',
  welcomeBack: (light: string, duration: string) =>
    `Pendant votre absence (${duration}), le quartier a récolté ${light} Lumière.`,
  dismiss: 'Fermer',
  minutes: (n: number) => `${n} min`,
  hours: (h: number, m: number) => (m === 0 ? `${h} h` : `${h} h ${m}`),
  generators: {
    pot: { name: 'Héliotrope en pot', flavour: '«\u00a0Elle suit le soleil. Nous aussi.\u00a0»' },
    balconyPanel: {
      name: 'Panneau de balcon',
      flavour: '«\u00a0Un panneau, une prise, un début.\u00a0»',
    },
    rooftopGarden: {
      name: 'Potager sur le toit',
      flavour: '«\u00a0Les tomates aiment la vue.\u00a0»',
    },
    greenhouse: { name: 'Serre communautaire', flavour: '«\u00a0Chacun apporte ses semis.\u00a0»' },
  } satisfies Record<GeneratorId, GeneratorText>,
};

export const t = fr;
