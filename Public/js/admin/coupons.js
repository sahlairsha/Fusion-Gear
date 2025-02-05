function deleteCoupon(couponId) {
    Swal.fire({
        title: "Are you sure?",
        text: "Once deleted, you will not be able to recover this coupon.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/admin/delete-coupon/${couponId}`, {
                method: 'DELETE',
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Coupon deleted successfully.",
                            icon: "success"
                        }).then(() => {
                            location.reload();
                        });
                    } else {
                        Swal.fire({
                            title: "Error!",
                            text: data.message || "Error deleting coupon.",
                            icon: "error"
                        });
                    }
                })
                .catch(error => {
                    console.error('Error deleting coupon:', error);
                    Swal.fire({
                        title: "Error!",
                        text: "Error deleting coupon.",
                        icon: "error"
                    });
                });
        } else {
            Swal.fire({
                title: "Cancelled",
                text: "Coupon not deleted.",
                icon: "info"
            });
        }
    });
}
