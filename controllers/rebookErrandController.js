const ErrandModel = require("../models/Errand");

const getRebookData = async (req, res) => {

    try {

        const { id } = req.params;

        const errand = await ErrandModel.findById(id)
            .populate(
                "erranzer_id",
                "_id firstName lastName status"
            );

        if (!errand) {
            return res.status(404).json({
                success: false,
                message: "Errand not found."
            });
        }

        // Only owner can rebook
        if (errand.poster_id.toString() !== req.user.id) {

            return res.status(403).json({
                success: false,
                message: "Unauthorized."
            });

        }

        if (errand.status !== "completed") {

            return res.status(400).json({
                success: false,
                message: "Only completed errands can be rebooked."
            });

        }

        let preferredErranzer = null;

        if (
            errand.erranzer_id &&
            errand.erranzer_id.status === "active"
        ) {

            preferredErranzer = {
                _id: errand.erranzer_id._id,
                fullname: errand.erranzer_id.firstName + " " + errand.erranzer_id.lastName,
            };

        }

        return res.status(200).json({

            success: true,

            data: {

                sourceErrandId: errand._id,

                title: errand.title,

                description: errand.description,

                category: errand.category,

                location: errand.location,

                address: errand.address,

                preferredErranzerId:
                    preferredErranzer?._id || null,

                preferredErranzer

            }

        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });

    }

};

module.exports = {
    getRebookData
};