export const ARCADE_REWARD_HINT = 'Arcade Reward: 1 score = 1 coin';

export function getBonusTiers(levelConfig) {
  const tiers = Array.isArray(levelConfig?.bonusTiers)
    ? levelConfig.bonusTiers
    : [];

  return tiers
    .filter((tier) => Number.isFinite(tier?.threshold) && Number.isFinite(tier?.reward))
    .map((tier) => ({ threshold: tier.threshold, reward: tier.reward }))
    .sort((a, b) => a.threshold - b.threshold);
}

export function getRewardMetricValue(levelConfig, stats) {
  const goalType = levelConfig?.goal?.type;
  switch (goalType) {
    case 'score':
      return stats.score ?? 0;
    case 'catchCount':
      return stats.catchCount ?? 0;
    case 'correctAnswers':
      return stats.correct ?? 0;
    case 'combo':
      return stats.maxCombo ?? 0;
    default:
      return stats.score ?? 0;
  }
}

export function getRewardMetricLabel(goalType) {
  switch (goalType) {
    case 'score':
      return 'Score';
    case 'catchCount':
      return 'Caught';
    case 'correctAnswers':
      return 'Correct';
    case 'combo':
      return 'Best Combo';
    default:
      return 'Goal';
  }
}

export function computeAdventureRewards(levelConfig, stats) {
  const goal = levelConfig?.goal ?? null;
  const goalValue = goal?.value ?? 0;
  const metricValue = getRewardMetricValue(levelConfig, stats);
  const goalType = goal?.type ?? 'score';
  const clearReward = levelConfig?.clearReward ?? 0;
  const bonusTiers = getBonusTiers(levelConfig);
  const cleared = metricValue >= goalValue;

  let coinsEarned = 0;
  const breakdown = [];
  const missedBonuses = [];

  if (cleared) {
    coinsEarned += clearReward;
    breakdown.push({
      label: `Goal Reached (${goalValue})`,
      reward: clearReward,
      reached: true,
    });

    for (const tier of bonusTiers) {
      if (metricValue >= tier.threshold) {
        coinsEarned += tier.reward;
        breakdown.push({
          label: `Bonus Reached (${tier.threshold})`,
          reward: tier.reward,
          reached: true,
        });
      } else {
        missedBonuses.push({
          label: `Bonus (${tier.threshold})`,
          reward: tier.reward,
          reached: false,
        });
      }
    }
  } else {
    for (const tier of bonusTiers) {
      missedBonuses.push({
        label: `Bonus (${tier.threshold})`,
        reward: tier.reward,
        reached: false,
      });
    }
  }

  return {
    cleared,
    coinsEarned,
    breakdown,
    missedBonuses,
    metricValue,
    metricLabel: getRewardMetricLabel(goalType),
    goalValue,
    goalType,
    bonusTiers,
  };
}

export function getUnlockRequirementText(levelNum) {
  if (levelNum <= 1) {
    return 'Available now';
  }
  return `Complete Level ${levelNum - 1} to unlock`;
}

export function formatBonusPreview(levelConfig) {
  const tiers = getBonusTiers(levelConfig);
  if (!tiers.length) {
    return 'No bonus tiers';
  }

  return tiers.map((tier) => `${tier.threshold} → +${tier.reward}`).join(', ');
}

export function renderRewardBreakdownHtml(summary) {
  const earnedRows = summary.breakdown.map((entry) => `
    <div class="game-reward-row">
      <span>${entry.label}</span>
      <strong>+${entry.reward} coins</strong>
    </div>
  `).join('');

  const missedRows = summary.missedBonuses.map((entry) => `
    <div class="game-reward-row game-reward-row--missed">
      <span>${entry.label}</span>
      <strong>not reached</strong>
    </div>
  `).join('');

  return `
    <div class="game-reward-breakdown">
      ${earnedRows || '<div class="game-reward-row game-reward-row--missed"><span>No rewards earned</span><strong>0 coins</strong></div>'}
      ${missedRows}
    </div>
    <div class="game-reward-total">Total Earned: ${summary.coinsEarned} coins</div>
  `;
}
