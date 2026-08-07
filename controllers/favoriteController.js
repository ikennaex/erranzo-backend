const FavouriteHelperModel = require("../models/FavoriteHelper");
const UserModel = require("../models/User");



const toggleFavourite = async (req, res) => {

    try { 
        const userId = req.user.id;
        const { erranzerId } = req.params;

        if (userId === erranzerId) {
            return res.status(400).json({
                success: false,
                message: "You cannot favourite yourself."
            });
        }

        const erranzer = await UserModel.findById(erranzerId);

        if (!erranzer) {
            return res.status(404).json({
                success: false,
                message: "Erranzer not found."
            });
        }

        if (erranzer.role !== "erranzer") {
            return res.status(400).json({
                success: false,
                message: "User is not an Erranzer."
            });
        }

        const existing = await FavouriteHelperModel.findOne({
            userId,
            erranzerId,
        });

        if (existing) {

            await existing.deleteOne();

            return res.json({
                success: true,
                isFavourited: false,
            });

        }

        const count = await FavouriteHelperModel.countDocuments({
            userId,
        });

        if (count >= 100) {

            return res.status(400).json({
                success: false,
                message: "Favourite limit reached."
            });

        }

        await FavouriteHelperModel.create({
            userId,
            erranzerId,
        });

        return res.json({
            success: true,
            isFavourited: true,
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

const getFavourites = async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const favourites = await FavouriteHelperModel.find({
            userId: req.user.id,
        })
        .populate({
            path: "erranzerId",
            match: {
                status: { $ne: "suspended" },
            },
            select: `
                firstName
                lastName
                averageRating
                totalReviews
            `,
        })
        .skip((page - 1) * limit)
        .limit(limit);

        const data = favourites.filter(
            fav => fav.erranzerId
        );

        return res.json({
            success: true,
            data,
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

const checkFavourite = async (req, res) => {

    try {

        const favourite =
            await FavouriteHelperModel.findOne({

                userId: req.user.id,

                erranzerId: req.params.erranzerId

            });

        return res.json({

            success: true,

            isFavourited: !!favourite

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

module.exports = {
    toggleFavourite,
    getFavourites,
    checkFavourite
};