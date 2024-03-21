// leaderboard-client.js

document.addEventListener("DOMContentLoaded", function() {
    // Function to fetch and display leaderboard data
    function fetchLeaderboard() {
      fetch('/leaderboard') // Fetch leaderboard data from the server
        .then(response => response.json()) // Parse the JSON response
        .then(data => {
          // Clear the current leaderboard table
          const leaderboardTable = document.getElementById('leaderboard');
          leaderboardTable.innerHTML = ''; // Clear existing rows
  
          // Loop through the data and add rows to the leaderboard table
          data.forEach((entry, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
              <td>${index + 1}</td>
              <td>${entry.driver_name}</td>
              <td>${entry.track_name}</td>
              <td>${entry.car_name}</td>
              <td>${entry.lap_time}</td>
              <td><a href="${entry.youtube_link}" target="_blank">Watch</a></td>
            `;
            leaderboardTable.appendChild(newRow);
          });
        })
        .catch(error => console.error('Error fetching leaderboard:', error));
    }
  
    // Call fetchLeaderboard() function to initially load the leaderboard
    fetchLeaderboard();
  
    // Add event listener to the leaderboardForm for form submission
    document.getElementById('leaderboardForm').addEventListener('submit', function(event) {
      event.preventDefault();
  
      // Get form data
      const formData = new FormData(this);
  
      // Convert form data to JSON
      const jsonObject = {};
      formData.forEach((value, key) => {
        jsonObject[key] = value;
      });
  
      // POST form data to server
      fetch('/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonObject)
      })
        .then(response => {
          if (response.ok) {
            // If successful, fetch and display updated leaderboard
            fetchLeaderboard();
            // Reset form fields
            this.reset();
          } else {
            throw new Error('Failed to add entry to leaderboard');
          }
        })
        .catch(error => console.error('Error adding entry to leaderboard:', error));
    });
});