document.addEventListener("DOMContentLoaded", function () {
    setupPageTransitions();
    if (document.getElementById("blog-list")) {
        fetchBlogs(); // Load blogs from backend
    }
});

/* 🌟 1. Page Transitions (Fade-out Effect) */
function setupPageTransitions() {
    const pageContent = document.querySelector(".page-content");

    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", function (event) {
            if (this.href.includes(location.hostname)) { // Prevent external links
                event.preventDefault();
                
                if (pageContent) { 
                    pageContent.classList.add("fade-out");
                }

                setTimeout(() => {
                    window.location.href = this.href;
                }, 400); // Wait for fade-out to complete
            }
        });
    });
}

/* 🌟 2. Fetch Blogs from Backend & Display */
async function fetchBlogs() {
    try {
        const response = await fetch("http://localhost:5000/api/blogs");
        if (!response.ok) throw new Error("Failed to fetch blogs");

        const blogs = await response.json();
        const blogList = document.getElementById("blog-list");
        blogList.innerHTML = ""; // Clear previous content

        blogs.forEach(blog => {
            let postDiv = document.createElement("div");
            postDiv.classList.add("blog-item");

            postDiv.innerHTML = `
                <h2>${blog.title}</h2>
                <p>${blog.content}</p>
                ${blog.coverImage ? `<img src="http://localhost:5000${blog.coverImage}" class="cover-img" alt="${blog.title}">` : ""}
                <button class="delete-btn" data-id="${blog._id}">Delete</button>
            `;

            blogList.appendChild(postDiv);
        });

        // Attach event listeners AFTER generating all blog posts
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", async (event) => {
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

/* 🌟 3. Delete a Blog Post */
async function deletePost(id) {
    try {
        const response = await fetch(`http://localhost:5000/api/blogs/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            alert("Post deleted successfully!");
            fetchBlogs(); // Refresh the list
        } else {
            alert("Error deleting post!");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to delete post.");
    }
}

/* 🌟 4. LocalStorage-based Blog Posts */
function saveBlogPost() {
    const title = document.getElementById("blogTitle")?.value.trim();
    const content = document.getElementById("blogContent")?.value.trim();

    if (!title || !content) {
        alert("Please enter both a title and content.");
        return;
    }

    let posts = JSON.parse(localStorage.getItem("blogPosts")) || [];
    posts.push({ title, content, date: new Date().toISOString() });

    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    localStorage.setItem("blogPosts", JSON.stringify(posts));
    loadBlogPosts();

    // Clear input fields
    document.getElementById("blogTitle").value = "";
    document.getElementById("blogContent").value = "";
}

function loadBlogPosts() {
    const blogPostsDiv = document.getElementById("blogPosts");
    if (!blogPostsDiv) return; // Prevent errors if the blog page is not loaded

    blogPostsDiv.innerHTML = "";

    let posts = JSON.parse(localStorage.getItem("blogPosts")) || [];

    posts.forEach(post => {
        let postDiv = document.createElement("div");
        postDiv.classList.add("blog-post");
        postDiv.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p><small>${new Date(post.date).toLocaleString()}</small>`;
        blogPostsDiv.appendChild(postDiv);
    });
}
