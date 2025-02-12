function deleteCategory(categoryId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this category.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/deleteCategory?id=${categoryId}`, {
                method: 'GET',
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Category deleted successfully.",
                            icon: "success"
                        }).then(() => {
                            location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text:  "Error deleting category.",
                            icon: "error"
                        });
                    }
                })
                .catch(error => {
                    console.error('Error deleting Category:', error);
                    Swal.fire({
                        title: "Error!",
                        text: "Error in deleting category .",
                        icon: "error"
                    });
                });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Category not deleted.",
                icon: "info"
            });
        }
    });
}
function restoreCategory(categoryId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to restore this category?",
        icon: "warning", // You can change this icon as needed (e.g., "question")
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, restore it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/restoreCategory?id=${categoryId}`, {
                method: 'GET'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    Swal.fire({
                        title: "Restored!",
                        text: "Category restored successfully.",
                        icon: "success"
                    }).then(() => {
                        location.reload(); // Reload to reflect the restored state
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: "Error restoring category.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error("Error restoring category:", error);
                Swal.fire({
                    title: "Error!",
                    text: "Error restoring category.",
                    icon: "error"
                });
            });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Category not restored.",
                icon: "info"
            });
        }
    });
}
