export function getExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calcNewRating(rating: number, expected: number, actual: number): number {
  return Math.round(rating + 32 * (actual - expected));
}

export function getRank(rating: number): string {
  if (rating >= 1600) return "Expert";
  if (rating >= 1400) return "Specialist";
  if (rating >= 1200) return "Pupil";
  return "Beginner";
}

export function updateElo(
  player1Rating: number,
  player2Rating: number,
  player1Won: boolean
): { newRating1: number; newRating2: number } {
  const exp1 = getExpected(player1Rating, player2Rating);
  const exp2 = getExpected(player2Rating, player1Rating);
  const score1 = player1Won ? 1 : 0;
  const score2 = player1Won ? 0 : 1;
  return {
    newRating1: calcNewRating(player1Rating, exp1, score1),
    newRating2: calcNewRating(player2Rating, exp2, score2),
  };
}
