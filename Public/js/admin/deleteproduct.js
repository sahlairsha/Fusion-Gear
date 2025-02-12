// Function to delete a product with SweetAlert confirmation
function deleteProduct(productId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this product.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/deleteproducts?id=${productId}`, {
                method: 'GET' 
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Product deleted successfully.') {
                    Swal.fire({
                        title: "Deleted!",
                        text: "Product deleted successfully.",
                        icon: "success"
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: "Error deleting product.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error("Error deleting product:", error);
                Swal.fire({
                    title: "Error!",
                    text: "Error deleting product.",
                    icon: "error"
                });
            });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Product not deleted.",
                icon: "info"
            });
        }
    });
}

// Function to restore a product with SweetAlert confirmation
function restoreProduct(productId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to restore this product?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, restore it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/restoreproducts?id=${productId}`, {
                method: 'GET' 
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Product restored successfully.') {
                    Swal.fire({
                        title: "Restored!",
                        text: "Product restored successfully.",
                        icon: "success"
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: "Error restoring product.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error("Error restoring product:", error);
                Swal.fire({
                    title: "Error!",
                    text: "Error restoring product.",
                    icon: "error"
                });
            });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Product remains deleted.",
                icon: "info"
            });
        }
    });
}
