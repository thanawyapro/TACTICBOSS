import { describe, expect, it } from 'vitest';
import { claimRewardedAdCoins, consumeExtraGenerationCredit, defaultRewardWallet, redeemCoinsForGeneration, REWARD_ECONOMY } from '../utils/growthEngine';

describe('rewarded ads and Boss Coins economy', () => {
  it('grants 25 coins per rewarded ad and caps free users at four claims per day', () => {
    let wallet = defaultRewardWallet();
    for (let i = 0; i < REWARD_ECONOMY.freeDailyRewardedAds; i++) {
      const result = claimRewardedAdCoins(wallet, 'free');
      expect(result.ok).toBe(true);
      wallet = result.wallet;
    }
    expect(wallet.bossCoins).toBe(100);
    expect(claimRewardedAdCoins(wallet, 'free').ok).toBe(false);
  });

  it('redeems 100 coins for one extra generation and consumes it once', () => {
    let wallet = { ...defaultRewardWallet(), bossCoins: 100 };
    const redeemed = redeemCoinsForGeneration(wallet);
    expect(redeemed.ok).toBe(true);
    expect(redeemed.wallet.bossCoins).toBe(0);
    expect(redeemed.wallet.extraGenerationCredits).toBe(1);
    const consumed = consumeExtraGenerationCredit(redeemed.wallet);
    expect(consumed.ok).toBe(true);
    expect(consumed.wallet.extraGenerationCredits).toBe(0);
  });
});
