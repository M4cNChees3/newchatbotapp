import express from "express";
import multer from "multer";

const router = express.Router();

const upload = multer({
    dest: "uploads/"
});

router.post("/", upload.single("pdf"), (req, res) => {
    console.log("Uploaded file:");

    console.log(req.file);

    res.json({
        success: true,
        filename: req.file?.originalname
    });
});

export default router;