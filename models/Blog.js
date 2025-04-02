const mongoose = require("mongoose");

// Define the schema
const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    coverImage: { type: String, required: true }, // Stores image URL
    views: { type: Number, default: 0 },
  },
  { timestamps: true } // Automatically adds createdAt & updatedAt fields
);

// Export the model
module.exports = mongoose.model("Blog", blogSchema);
