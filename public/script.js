document.addEventListener("DOMContentLoaded", () => {
    setupPageTransitions();
    fetchBlogs();

    // Auto-refresh blog list every 5 seconds
    setInterval(fetchBlogs, 5000);
});

/* 🌟 1. Setup Page Transitions */
function setupPageTransitions() {
    const pageContent = document.querySelector(".page-content");
    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", event => {
            if (link.href.includes(location.hostname)) {
                event.preventDefault();
                pageContent?.classList.add("fade-out");
                setTimeout(() => {
                    window.location.href = link.href;
                }, 400);
            }
        });
    });
}

/* 🌟 2. Fetch Blogs from Backend */
async function fetchBlogs() {
    try {
        const response = await fetch("http://localhost:5001/api/blogs");
        if (!response.ok) throw new Error("Failed to fetch blogs");

        const blogs = await response.json();
        const blogList = document.getElementById("blog-list");
        if (!blogList) return;

        blogList.innerHTML = ""; // Clear previous content

        blogs.forEach(blog => {
            const postDiv = document.createElement("div");
            postDiv.classList.add("blog-item");

            postDiv.innerHTML = `
                <h2>${blog.title}</h2>
                <p>${blog.content}</p>
                ${blog.coverImage ? `<img src="http://localhost:5001${blog.coverImage}" class="cover-img" alt="${blog.title}">` : ""}
                <button class="delete-btn" data-id="${blog._id}">Delete</button>
            `;

            blogList.appendChild(postDiv);
        });

        // Attach delete event listeners
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async event => {
                const blogId = event.target.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this post?")) {
                    await deletePost(blogId);
                }
            });
        });

    } catch (error) {
        console.error("Error fetching blogs:", error);
    }
}

/* 🌟 3. Save Blog Post */
async function saveBlogPost() {
    const title = document.getElementById("blogTitle")?.value.trim();
    const content = document.getElementById("blogContent")?.value.trim();

    if (!title || !content) {
        alert("Please enter both a title and content.");
        return;
    }

    try {
        await fetch("http://localhost:5001/api/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
        });

        alert("Blog saved successfully!");
        fetchBlogs(); // Refresh UI after saving
    } catch (error) {
        console.error("Error saving blog:", error);
    }
}

/* 🌟 4. Delete a Blog Post */
async function deletePost(id) {
    try {
        const response = await fetch(`http://localhost:5001/api/blogs/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            alert("Post deleted successfully!");
            fetchBlogs();
        } else {
            alert("Error deleting post!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to delete post.");
    }
}
