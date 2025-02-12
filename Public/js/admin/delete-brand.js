// Function to delete a brand
function deleteBrand(brandId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this brand.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            // Call your backend deletion endpoint using fetch
            fetch(`/admin/brands/delete/${brandId}`, {
                method: 'GET'
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Brand deleted successfully.') {
                    Swal.fire({
                        title: "Deleted!",
                        text: "Brand deleted successfully.",
                        icon: "success"
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: "Error deleting brand.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error('Error deleting brand:', error);
                Swal.fire({
                    title: "Error!",
                    text: "Error deleting brand.",
                    icon: "error"
                });
            });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Brand not deleted.",
                icon: "info"
            });
        }
    });
}

// Function to restore a brand
function restoreBrand(brandId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Do you want to restore this brand?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, restore it!"
    }).then((result) => {
        if (result.isConfirmed) {
            // Call your backend restoration endpoint using fetch
            fetch(`/admin/brands/restore/${brandId}`, {
                method: 'GET'
            })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Brand restored successfully.') {
                    Swal.fire({
                        title: "Restored!",
                        text: "Brand restored successfully.",
                        icon: "success"
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: "Error restoring brand.",
                        icon: "error"
                    });
                }
            })
            .catch(error => {
                console.error('Error restoring brand:', error);
                Swal.fire({
                    title: "Error!",
                    text: "Error restoring brand.",
                    icon: "error"
                });
            });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Brand not restored.",
                icon: "info"
            });
        }
    });
}
