import type { Player } from '../../types/common';

export const IPL_MEGA_AUCTION_INTERVAL = 4;
export const IPL_MAX_RETENTIONS = 6;
export const IPL_MAX_CAPPED_RETENTIONS = 5;
export const IPL_MAX_UNCAPPED_RETENTIONS = 2;

export interface TradeValidation {
  ok: boolean;
  reason?: string;
}

export function validateIplRetention(players: Player[], playerIds: string[]): TradeValidation {
  if (playerIds.length > IPL_MAX_RETENTIONS) return { ok: false, reason: 'A franchise may retain at most six players.' };
  const selected = playerIds.map((id) => players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player));
  if (selected.length !== playerIds.length) return { ok: false, reason: 'One or more selected players could not be found.' };
  const capped = selected.filter((player) => player.isCapped !== false).length;
  const uncapped = selected.length - capped;
  if (capped > IPL_MAX_CAPPED_RETENTIONS) return { ok: false, reason: 'A maximum of five capped players can be retained.' };
  if (uncapped > IPL_MAX_UNCAPPED_RETENTIONS) return { ok: false, reason: 'A maximum of two uncapped players can be retained.' };
  return { ok: true };
}

export function validateOneForOneTrade(
  teamAPlayers: string[],
  playerAId: string,
  teamBPlayers: string[],
  playerBId: string,
): TradeValidation {
  if (playerAId === playerBId) return { ok: false, reason: 'Choose two different players.' };
  if (!teamAPlayers.includes(playerAId)) return { ok: false, reason: 'The outgoing player is not in your squad.' };
  if (!teamBPlayers.includes(playerBId)) return { ok: false, reason: 'The incoming player is not in the selected team squad.' };
  return { ok: true };
}

export function isMegaAuctionDue(currentSeasonNumber: number): boolean {
  return currentSeasonNumber > 0 && currentSeasonNumber % IPL_MEGA_AUCTION_INTERVAL === 0;
}

export function calculateOverseasCount(squadIds: string[], players: Player[]): number {
  const playerById = new Map(players.map((player) => [player.id, player]));
  return squadIds.filter((id) => playerById.get(id)?.nationality === 'Overseas').length;
}
