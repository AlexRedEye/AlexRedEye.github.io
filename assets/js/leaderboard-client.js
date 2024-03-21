function searchLeaderboard() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById("searchInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("leaderboard");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td");
        for (var j = 0; j < td.length; j++) {
            if (td[j]) {
                txtValue = td[j].textContent || td[j].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                    break;
                } else {
                    tr[i].style.display = "none";
                }
            }
        }
    }
}

function submitLeaderboard() {
    var form = document.getElementById("leaderboardForm");
    var formData = new FormData(form);

    fetch('save.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log(data);
        // Reload leaderboard after submission
        fetchLeaderboard();
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchLeaderboard() {
    fetch('endpoint_to_fetch_leaderboard_data.php') // Replace 'endpoint_to_fetch_leaderboard_data.php' with the actual endpoint URL to fetch leaderboard data
        .then(response => response.json())
        .then(data => {
            // Update HTML table with fetched leaderboard data
            // For example, you can iterate over the data and dynamically create table rows and cells
        })
        .catch(error => {
            console.error('Error fetching leaderboard data:', error);
        });
}

