document.getElementById('leaderboardForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    var driverName = document.getElementById('driverName').value;
    var trackName = document.getElementById('trackName').value;
    var carName = document.getElementById('carName').value;
    var lapTime = document.getElementById('lapTime').value;
    var videoFile = document.getElementById('videoFile').files[0]; // Assuming single file upload
    
    var newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>${document.getElementById('leaderboard').getElementsByTagName('tr').length}</td>
      <td>${driverName}</td>
      <td>${trackName}</td>
      <td>${carName}</td>
      <td>${lapTime}</td>
      <td><a href="#" onclick="playVideo('${videoFile.name}')">Play</a></td>
    `;
    
    document.querySelector('#leaderboard tbody').appendChild(newRow);
    
    // Reset form fields
    document.getElementById('leaderboardForm').reset();
  });
  
  function playVideo(videoName) {
    // This function can be implemented to play the video
    alert(`Playing video: ${videoName}`);
  }
  