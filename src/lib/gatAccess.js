import {
  readStoredInt,
  INITIAL_GAT_BALANCE,
  OBRA_VOICE_MIN_GAT,
} from '@/components/transmedia/transmediaConstants';

/**
 * Returns true if the visitor (authenticated or not) has enough GAT to proceed.
 * Portal pages use this to allow unauthenticated users with sufficient balance
 * to access experiential actions without being blocked by a login overlay.
 */
export const hasEnoughGAT = () => {
  const balance = readStoredInt('gatoencerrado:gatokens-available', INITIAL_GAT_BALANCE);
  return balance >= OBRA_VOICE_MIN_GAT;
};
