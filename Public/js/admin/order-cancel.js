document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("approve-cancel-btn") || event.target.classList.contains("reject-cancel-btn")) {
        const orderId = event.target.getAttribute("data-order-id");
        const action = event.target.classList.contains("approve-cancel-btn") ? "approve" : "reject";

        Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${action} this cancellation request?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: action === "approve" ? "#28a745" : "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: `Yes, ${action} it!`,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/cancel-order/${orderId}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ action }),
                    });

                    if (response.ok) {
                        Swal.fire("Success", `Cancellation request has been ${action}d.`,"success");
                        location.reload();
                    } else {
                        Swal.fire("Error", "Failed to process the request.", "error");
                    }
                } catch (error) {
                    Swal.fire("Error", "Something went wrong.", "error");
                    console.error("Admin action error:", error);
                }
            }
        });
    }
});


const handleAdminDecision = async (orderId, action) => {
    try {
        const response = await fetch(`/admin/cancel-order/${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }), 
        });

        const result = await response.json();
        console.log(`Order ${orderId} ${action}d:`, result);
    } catch (error) {
        console.error('Error handling admin decision:', error);
    }
};
const socket = io();

socket.on('order_cancellation_request', (data) => {
    console.log(`Received cancellation request for order ID: ${data.orderId}`);

   
    displayCancellationRequest(data); 
});


