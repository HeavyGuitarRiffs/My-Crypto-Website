document.addEventListener("DOMContentLoaded", async () => {
    const blogList = document.getElementById("blogList");

    try {
        const response = await fetch("/api/blogs");
        if (!response.ok) throw new Error("Failed to fetch blogs");

        const blogs = await response.json();
        blogList.innerHTML = ""; // Clear previous content

        blogs.forEach(blog => {
            const blogPost = document.createElement("div");
            blogPost.classList.add("blog-post");

            const title = document.createElement("h2");
            title.textContent = blog.title;

            const content = document.createElement("p");
            content.textContent = blog.content.substring(0, 100) + "...";

            const img = document.createElement("img");
            console.log("Blog cover image:", blog.coverImage);

            if (blog.coverImage) {
                img.src = blog.coverImage.startsWith("http") ? blog.coverImage : `/uploads/${blog.coverImage}`;
            } else {
                img.src = "images/default-image.jpg"; // Fallback
            }
            img.onerror = () => img.src = "images/default-image.jpg"; // Handle broken image
            

            img.alt = "Cover Image";
            img.width = 200;
            img.onerror = () => img.src = "images/default-image.jpg"; // ✅ Handle broken images

            // ✅ FIXING INVALID DATE ISSUE
            console.log("Blog date raw value:", blog.date);
            const formattedDate = blog.date ? new Date(blog.date).toLocaleDateString("en-US", { 
                year: "numeric", month: "long", day: "numeric" 
            }) : "Unknown Date";

            const views = document.createElement("p");
            views.textContent = `👁 Views: ${blog.views}`;
            
            const dateInfo = document.createElement("p");
            dateInfo.textContent = `📅 Posted on: ${formattedDate}`;

            const link = document.createElement("a");
            link.href = `blog-details.html?id=${blog._id}`;
            link.textContent = "Read More";
            link.rel = "noopener";

            blogPost.appendChild(title);
            blogPost.appendChild(content);
            blogPost.appendChild(img);
            blogPost.appendChild(dateInfo);
            blogPost.appendChild(views);
            blogPost.appendChild(link);

            blogList.appendChild(blogPost);
        });
    } catch (error) {
        console.error("Error loading blogs:", error);
        blogList.innerHTML = "<p>⚠ Failed to load blogs. Please try again later.</p>";
    }
});

// ✅ Only add event listener if image upload exists
document.addEventListener("DOMContentLoaded", () => {
    const imageUpload = document.getElementById("imageUpload");
    if (!imageUpload) return;

    imageUpload.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        fetch("/upload", {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.imageUrl) {
                const preview = document.getElementById("blog-image-preview");
                const coverImageInput = document.getElementById("coverImageInput");
                if (preview) preview.src = data.imageUrl; // ✅ Ensure preview updates
                if (coverImageInput) coverImageInput.value = data.imageUrl; // ✅ Store URL in input field
            }
        })
        .catch(error => console.error("Upload error:", error));
    });
});
