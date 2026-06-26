function calculatePriceScore(sourcePrice, candidatePrice) {
  if (sourcePrice === 0) {
    return candidatePrice === 0 ? 1 : 0;
  }

  return 1 - Math.min(Math.abs(candidatePrice - sourcePrice) / sourcePrice, 1);
}

function calculateRatingScore(candidateRating) {
  return candidateRating / 5;
}

function calculateInventoryScore(availableQuantity) {
  return availableQuantity > 0 ? 1 : 0;
}

function buildExplainerTags(source, candidate, inventoryQty) {
  const tags = [];
  if (candidate.category === source.category) tags.push("Same Category");
  if (candidate.price < source.price)         tags.push("Lower Price");
  if (candidate.rating > source.rating)       tags.push("Higher Rating");
  if (inventoryQty > 0)                       tags.push("In Stock");
  return tags;
}

export function recommend(source, candidates, inventoryMap, limit = 5) {
  const scored = candidates
    .filter((candidate) => candidate.category === source.category)
    .map((candidate) => {
      const qty = inventoryMap.get(candidate._id.toString()) ?? 0;

      // Category is both the hard gate above and the 40-point relevance floor.
      const categoryScore = 1;
      const priceScore = calculatePriceScore(source.price, candidate.price);
      const ratingScore = calculateRatingScore(candidate.rating);
      const inventoryScore = calculateInventoryScore(qty);

      const finalScore = Number(
        (
          categoryScore * 40 +
          priceScore * 20 +
          ratingScore * 20 +
          inventoryScore * 20
        ).toFixed(1)
      );

      return {
        product: candidate,
        score: finalScore,
        inventoryQty: qty,
        tags: buildExplainerTags(source, candidate, qty),
      };
    });

  // In-stock alternatives stay ahead before score tie-breaking.
  return scored
    .sort((a, b) => {
      const stockDelta = Number(b.inventoryQty > 0) - Number(a.inventoryQty > 0);
      if (stockDelta !== 0) return stockDelta;
      return b.score - a.score;
    })
    .slice(0, limit);
}

export default recommend;
