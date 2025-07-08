import config from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createUserForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const jobInput = document.getElementById("job");

    const userData = {
      name: nameInput.value,
      job: jobInput.value,
    };

    try {
      const response = await fetch(
        `${config.api.url}${config.endpoints.users}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.status === 201) {
        const data = await response.json();
        alert("User created successfully!");
        window.location.href = "index.html";
      } else {
        throw new Error("Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user. Please try again.");
    }
  });
});
