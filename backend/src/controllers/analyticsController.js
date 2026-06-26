import Recommendation from "../models/Recommendation.js";

export const getTopRecommended = async (req, res, next) => {
  try {
    // Counts cached recommendation targets for the dashboard/analytics view.
    const topRecommended = await Recommendation.aggregate([
      {
        $group: {
          _id: "$recommendedProductId",
          recommendationCount: { $sum: 1 },
          averageScore: { $avg: "$recommendationScore" },
        },
      },
      { $sort: { recommendationCount: -1, averageScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    return res.status(200).json({
      success: true,
      count: topRecommended.length,
      data: topRecommended,
    });
  } catch (error) {
    return next(error);
  }
};
