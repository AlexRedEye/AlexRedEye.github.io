<?php
$servername = "sql5.freesqldatabase.com";
$username = "sql5693290";
$password = "HpEALIJBct";
$dbname = "sql5693290";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $driverName = $_POST["driverName"];
    $trackName = $_POST["trackName"];
    $carName = $_POST["carName"];
    $lapTime = $_POST["lapTime"];
    $youtubeLink = $_POST["youtubeLink"];

    // Prepare and bind statement
    $stmt = $conn->prepare("INSERT INTO leaderboard (driver_name, track_name, car_name, lap_time, youtube_link) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $driverName, $trackName, $carName, $lapTime, $youtubeLink);

    // Execute statement
    if ($stmt->execute()) {
        echo "New record created successfully";
    } else {
        echo "Error: " . $stmt->error;
    }

    // Close statement
    $stmt->close();
}

// Close connection
$conn->close();
?>