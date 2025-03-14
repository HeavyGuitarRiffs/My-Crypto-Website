const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// ** Middleware **
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
// ** Ensure uploads directory exists **
const dir = path.join(__dirname, "uploads/");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// ** Content Security Policy Middleware **

    app.use((req, res, next) => {
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self' https://my-crypto-website-production.up.railway.app; object-src 'none';"
        );
        next();
      });
            
// ** Check & Connect to MongoDB **
if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is missing from .env file.");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit only on failure
});





// ** Blog Schema & Model **
const BlogSchema = new mongoose.Schema({
    title: String,
    content: String,
    coverImage: String, // Stores image URL
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    date: { type: String, default: () => new Date().toLocaleString() } // ✅ Add this line
});

const Blog = mongoose.model("Blog", BlogSchema);

// ** Image Upload Configuration **
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "uploads/");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// ** Multer File Upload Middleware **
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file limit
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


// 📌 Get all blog posts
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
const formattedBlogs = blogs.map(blog => ({
    id: blog._id,
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
        res.status(500).json({ error: error.message});
    }
});

// 📌 Get a single blog post by ID & increase view count
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

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
            id: newBlog._id, // ✅ Ensure frontend gets `id`
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
app.delete("/api/blogs/:id", async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) return res.status(404).json({ error: "Blog not found" });

        // Delete associated image file if it exists
        if (deletedBlog.coverImage) {
            const filePath = path.resolve(__dirname, deletedBlog.coverImage);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        

        res.json({ message: "Blog deleted successfully", id: req.params.id }); // ✅ Return deleted blog's ID
    } catch (error) {
        console.error("❌ Error deleting blog post:", error);
        res.status(500).json({ error: "Error deleting blog post" });
    }
});

app.patch("/api/blogs/:id", upload.single("coverImage"), async (req, res) => {
    try {
        const { title, content } = req.body;
        const existingBlog = await Blog.findById(req.params.id);
        if (!existingBlog) return res.status(404).json({ error: "Blog not found" });

        let newCoverImage = existingBlog.coverImage;
        if (req.file) {
            newCoverImage = `/uploads/${req.file.filename}`;

            // Delete old image if it exists
            if (existingBlog.coverImage) {
                const oldFilePath = path.join(__dirname, existingBlog.coverImage);
                if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            }
        }

        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, content, coverImage: newCoverImage },
            { new: true }
        );

        res.json({
            id: updatedBlog._id,
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


