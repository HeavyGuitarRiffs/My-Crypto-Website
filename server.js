const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const Blog = require("./models/Blog"); // ✅ Correct import
const app = express();
const PORT = process.env.PORT || 5001;
const bodyParser = require('body-parser');

app.use(express.static("public"));
// ** Middleware **
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*", // Allow all origins (or specify your frontend URL)
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads"))); // Serve uploaded images
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.json()); // Add body-parser middleware

// ** Ensure uploads directory exists **
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ** Content Security Policy Middleware **
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://thorough-radiance-production.up.railway.app; object-src 'none';"
    );
    next();
});

// ** Check & Connect to MongoDB **
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing from .env file.");
    process.exit(1);
}

// ✅ Correct & Organized Mongoose Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "mydatabase" // Ensure this is correct for your main site
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});

// ** Blog Schema & Model **
const BlogSchema = new mongoose.Schema({
    title: String,
    content: String,
    coverImage: String, // Stores image URL
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    date: { type: String, default: () => new Date().toLocaleString() }, // ✅ Add this line
});

// ** Image Upload Configuration **
const storage = multer.diskStorage({
    destination: "public/uploads/", // Store images in public/uploads/
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// ** Multer File Upload Middleware **
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG, and GIF allowed."));
        }
    }
});

// ** Routes **

const blogRoutes = require("./routes/blogRoutes");  // ✅ Import blogRoutes
app.use("/api/blogs", blogRoutes);  // ✅ Use blogRoutes under `/api/blogs`

// 📌 Get all blog posts
app.get("/api/blogs", async (req, res) => {
    try {
        // Load latest blogs first
        const blogs = await Blog.find({}).sort({ createdAt: -1 });

        // Format the response to include relevant fields
        const formattedBlogs = blogs.map(blog => ({
            id: blog._id.toString(), // Convert MongoDB `_id` to a string
            title: blog.title,
            content: blog.content,
            coverImage: blog.coverImage,
            views: blog.views,
            createdAt: blog.createdAt,
            date: blog.date
        }));

        res.json(formattedBlogs);
    } catch (error) {
        console.error("❌ Error fetching blogs:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 📌 Get a single blog post by ID & increase view count
app.get("/api/blogs/:id", async (req, res) => {
    try {
        console.log("Requested blog ID:", req.params.id);
        const blogExists = await Blog.findById(req.params.id);
        console.log("Blog found:", blogExists);

        // Ensure it's a valid ObjectId
        const blogId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(blogId)) {
            return res.status(400).json({ error: "Invalid blog ID format" });
        }

        console.log("Requested blog ID:", blogId);
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: "Post not found" });

        blog.views += 1;
        await blog.save();

        res.json({
            id: blog._id,
            title: blog.title,
            content: blog.content,
            coverImage: blog.coverImage,
            views: blog.views,
            createdAt: blog.createdAt,
            date: blog.date // ✅ Add this line
        });
    } catch (error) {
        console.error("❌ Error fetching blog post:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// 📌 Create a new blog post with optional image upload
app.post("/api/blogs", upload.single("coverImage"), async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }

        const coverImagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newBlog = new Blog({
            title,
            content,
            coverImage: coverImagePath,
            date: new Date().toLocaleString()
        });

        await newBlog.save();
        res.status(201).json({
            id: newBlog._id.toString(), // ✅ Ensure frontend gets `id`
            title: newBlog.title,
            content: newBlog.content,
            coverImage: newBlog.coverImage,
            views: newBlog.views,
            createdAt: newBlog.createdAt,
            date: newBlog.date
        });
    } catch (error) {
        console.error("❌ Error creating blog post:", error);
        res.status(500).json({ error: "Error creating blog post" });
    }
});

// 📌 Delete a blog post
app.delete('/api/blogs/:id', (req, res) => {
    const blogId = req.params.id;

    // Find the blog in the database
    const blog = blogs.find(b => b.id === parseInt(blogId));
    if (!blog) {
        return res.status(404).send('Blog not found');
    }

    // Delete the associated image file
    if (blog.coverImage) {
        const imagePath = path.join(__dirname, 'public/uploads', path.basename(blog.coverImage));
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error('Failed to delete image:', err);
            }
        });
    }

    // Remove the blog from the database
    blogs = blogs.filter(b => b.id !== parseInt(blogId));
    res.send('Blog deleted');
});

app.patch("/api/blogs/:id", async (req, res) => {
    try {
        const { title, content, coverImage } = req.body; // Only allow these fields

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, content, coverImage },
            { new: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        res.json({
            id: updatedBlog._id, // ✅ Ensure frontend receives `id`
            title: updatedBlog.title,
            content: updatedBlog.content,
            coverImage: updatedBlog.coverImage,
            views: updatedBlog.views,
            createdAt: updatedBlog.createdAt,
            date: updatedBlog.date
        });
    } catch (error) {
        console.error("❌ Error updating blog post:", error);
        res.status(500).json({ error: "Error updating blog post" });
    }
});

// ** Start Server **
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});


