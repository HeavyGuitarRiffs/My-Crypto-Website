const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Blog = require("../models/Blog");



// ** Image Upload Configuration **
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../uploads/");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
        cb(null, allowedMimeTypes.includes(file.mimetype) || false);
    }
});

// ** Get all blog posts **
router.get("/", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: "Error fetching blogs" });
    }
});

// ** Get a single blog post by ID & increase view count **
router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Post not found" });

        blog.views += 1;
        await blog.save();
        res.json(blog);
    } catch (error) {
        res.status(500).json({ error: "Error fetching post" });
    }
});

// ** Create a new blog post **
router.post("/", upload.single("coverImage"), async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }

        const coverImagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newBlog = new Blog({
            title,
            content,
            coverImage: coverImagePath
        });

        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (error) {
        res.status(500).json({ error: "Error creating blog post" });
    }
});

// ** Update a blog post **
router.put("/:id", async (req, res) => {
    try {
        const { title, content, coverImage } = req.body;

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, content, coverImage },
            { new: true }
        );

        if (!updatedBlog) return res.status(404).json({ error: "Blog not found" });

        res.json(updatedBlog);
    } catch (error) {
        res.status(500).json({ error: "Error updating blog post" });
    }
});

// ** Delete a blog post **
router.delete("/:id", async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) return res.status(404).json({ error: "Blog not found" });

        if (deletedBlog.coverImage) {
            const filePath = path.join(__dirname, "../", deletedBlog.coverImage);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting blog post" });
    }
});

module.exports = router;
