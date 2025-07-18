document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Project Ideas Elements
  const projectIdeasList = document.getElementById("project-ideas-list");
  const projectIdeaForm = document.getElementById("project-idea-form");

  // Fetch and display project ideas
  async function fetchProjectIdeas() {
    try {
      const response = await fetch("/project-ideas");
      const ideas = await response.json();
      projectIdeasList.innerHTML = "";
      if (ideas.length === 0) {
        projectIdeasList.innerHTML = "<p>No project ideas posted yet.</p>";
        return;
      }
      ideas.forEach((idea) => {
        const ideaCard = document.createElement("div");
        ideaCard.className = "project-idea-card";
        // Format skills as chips
        let skillsHTML = "<span class='skills'>None specified</span>";
        if (idea.skills_needed && idea.skills_needed.trim() !== "") {
          const skills = idea.skills_needed.split(",").map(s => s.trim()).filter(Boolean);
          skillsHTML = skills.map(skill => `<span class='skills'>${skill}</span>`).join(", ");
        }
        ideaCard.innerHTML = `
          <h4>${idea.title}</h4>
          <p>${idea.description}</p>
          <p><strong>Skills Needed:</strong> ${skillsHTML}</p>
          <p><strong>Posted by:</strong> ${idea.author_email ? `<a href='mailto:${idea.author_email}'>${idea.author_email}</a>` : "Anonymous"}</p>
        `;
        projectIdeasList.appendChild(ideaCard);
      });
    } catch (error) {
      projectIdeasList.innerHTML = "<p>Failed to load project ideas.</p>";
      console.error("Error fetching project ideas:", error);
    }
  }

  // Handle project idea form submission
  if (projectIdeaForm) {
    projectIdeaForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const title = document.getElementById("project-title").value;
      const description = document.getElementById("project-description").value;
      const skills_needed = document.getElementById("project-skills").value;
      const author_email = document.getElementById("project-author").value;
      try {
        const params = new URLSearchParams({
          title,
          description,
          skills_needed,
          author_email,
        });
        const response = await fetch(`/project-ideas?${params.toString()}`, {
          method: "POST",
        });
        const result = await response.json();
        if (response.ok) {
          projectIdeaForm.reset();
          fetchProjectIdeas();
        } else {
          alert(result.detail || "Failed to post project idea.");
        }
      } catch (error) {
        alert("Failed to post project idea.");
        console.error("Error posting project idea:", error);
      }
    });
  }
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  fetchProjectIdeas();
});
