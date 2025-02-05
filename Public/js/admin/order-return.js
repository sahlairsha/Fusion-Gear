document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("approve-return-btn") || event.target.classList.contains("reject-return-btn")) {
        const orderId = event.target.getAttribute("data-order-id");
        const action = event.target.classList.contains("approve-return-btn") ? "approve" : "reject";

        Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${action} this return request?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: action === "approve" ? "#28a745" : "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: `Yes, ${action} it!`,
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/admin/orders/${orderId}/return`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ action }),
                    });

                    if (response.ok) {
                        Swal.fire("Success", `Return request has been ${action}d.`, "success");
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


const socketIo = io(); // Admin socket client-side initialization
   
   socketIo.on('order_return_request', (data) => {
       console.log(`Received return request for order ID: ${data.orderId}`);
   
       // Show a notification or update the admin dashboard
       displayCancellationRequest(data); // Function to display the request in the admin UI
   });
   
   // Function to handle admin decision (Approve or Reject)
   const handleAdminDecisionReturn = async (orderId, action) => {
       try {
           const response = await fetch(`/admin//admin/orders/${orderId}/return`, {
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
   