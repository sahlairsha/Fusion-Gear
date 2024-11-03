

// Interactive search functionality
document.getElementById('searchBar').addEventListener('keyup', function() {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll('#customerTableBody tr');

    rows.forEach(row => {
        const name = row.cells[2].textContent.toLowerCase(); // Name cell
        const email = row.cells[3].textContent.toLowerCase(); // Email cell
        if (name.includes(filter) || email.includes(filter)) {
            row.style.display = ''; // Show row
        } else {
            row.style.display = 'none'; // Hide row
        }
    });
});


document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.customer-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});