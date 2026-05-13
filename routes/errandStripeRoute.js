const router = require("express").Router();
const errandController = require("../controllers/errandController");

router.post("/hold", errandController.holdFunds);

module.exports = router;