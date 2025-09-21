import { Utils } from './utils.js';

export function generateMission() {
  const templates = [
    { name: 'Escort Shipment', req: { damage: 2, shields: 1 }, reward: { credits: 3 } },
    { name: 'Asteroid Survey', req: { thrusters: 2 }, reward: { credits: 2 } },
    { name: 'Rescue Ops', req: { shields: 2, reactors: 1 }, reward: { credits: 4 } },
    { name: 'Smuggler Sting', req: { damage: 3 }, reward: { credits: 5 } },
    { name: 'Fuel Relay', req: { reactors: 2, thrusters: 1 }, reward: { credits: 4 } },
  ];
  return structuredClone(Utils.pick(templates));
}
