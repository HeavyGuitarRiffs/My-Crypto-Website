const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");

// Get all blog posts
router.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching blogs" });
  }
});

// Get a single blog post and track views
router.get("/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ error: "Post not found" });

    blog.views += 1; // Increment views
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: "Error fetching post" });
  }
});

// Create a new blog post
router.post("/blogs", async (req, res) => {
  try {
    const { title, content, coverImage } = req.body;
    const newBlog = new Blog({ title, content, coverImage });
    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (error) {
    res.status(500).json({ error: "Error creating blog" });
  }
});

// Update a blog post
router.put("/blogs/:id", async (req, res) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: "Error updating blog" });
  }
});

// Delete a blog post
router.delete("/blogs/:id", async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting blog" });
  }
});

module.exports = router;

