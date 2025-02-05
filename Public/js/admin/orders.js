  
  document.addEventListener('change', function (event) {
    if (event.target.classList.contains('order-status-dropdown')) {
        const orderId = event.target.getAttribute('data-order-id');
        const newStatus = event.target.value;

        Swal.fire({
            title: "Are you sure?",
            text: `Do you want to change the order status to "${newStatus}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, update it!",
            cancelButtonText: "Cancel"
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/admin/orders/${orderId}/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                })
                .then((response) => {
                    if (response.ok) {
                        const statusCell = event.target.closest('tr').querySelector('.order-status-display');
                        statusCell.textContent = newStatus;
                        statusCell.className = `order-status-display text-center bg-${getStatusColor(newStatus)}`;
                        Swal.fire("Updated!", "Order status has been updated.", "success");
                    } else {
                        Swal.fire("Error!", "Failed to update order status.", "error");
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    Swal.fire("Error!", "Something went wrong.", "error");
                });
            } else {
                event.target.value = event.target.getAttribute('data-current-status');
            }
        });
    }
});

function getStatusColor(status) {
    switch (status) {
        case 'Pending': return 'warning';
        case 'Dispatch': return 'primary';
        case 'Shipped': return 'info';
        case 'Delivered': return 'success';
        case 'Canceled': return 'danger';
        default: return 'secondary';
    }
}


document.getElementById('searchBar').addEventListener('input', function() {
const query = this.value.toLowerCase();
const rows = document.querySelectorAll('#tableBody tr');

rows.forEach(row => {
    const productName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
    const category = row.querySelector('td:nth-child(5)').textContent.toLowerCase();

    if (productName.includes(query) || category.includes(query)) {
        row.style.display = '';
    } else {
        row.style.display = 'none';
    }
});
});


document.addEventListener("DOMContentLoaded", () => {
    const orderCards = document.querySelectorAll(".table-row")

    const images = document.querySelectorAll(".product_image");

    images.forEach(image => {
        image.addEventListener("click", (e) => {
            e.stopPropagation();
            const orderId = image.closest(".table-row").getAttribute("data-order-id");
            window.location.href = `/admin/order-details/${orderId}`;
        });
    });
});




