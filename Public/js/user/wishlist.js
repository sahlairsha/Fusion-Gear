function removeFromWishlist(productId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to remove this product from your wishlist?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!',
        cancelButtonText: 'Cancel',
    }).then((result) => {
        if (result.isConfirmed) {
            // Make a DELETE request to the server
            fetch(`/wishlist/remove`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        Swal.fire(
                            'Removed!',
                            'The product has been removed from your wishlist.',
                            'success'
                        );

                        // Safely remove the element from the DOM
                        const element = document.getElementById(`wishlist-item-${productId}`);
                        if (element) {
                            element.remove();
                        } else {
                            console.warn(`No element found with ID wishlist-item-${productId}`);
                        }
                    } else {
                        Swal.fire(
                            'Error!',
                            data.message || 'Failed to remove the product from your wishlist.',
                            'error'
                        );
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    Swal.fire(
                        'Error!',
                        'An error occurred while removing the product.',
                        'error'
                    );
                });
        }
    });
}




function addToCart(productId, variantId) {
    const quantity = 1;  // Default quantity set to 1

    fetch('/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            variantId: variantId,
            quantity: quantity, // Send quantity in the request body
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: 'Added to Cart',
                text: 'The product has been added to your cart.',
                icon: 'success',
                confirmButtonText: 'Go to Cart',
            }).then(result => {
                if (result.isConfirmed) {
                    window.location.href = '/cart';
                }
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.message || 'Failed to add product to cart.',
                icon: 'error',
                confirmButtonText: 'Try Again',
            });
        }
    })
    .catch(error => {
        console.error('Error adding product to cart:', error);
        Swal.fire({
            title: 'Error',
            text: 'Internal Server Error',
            icon: 'error',
            confirmButtonText: 'Try Again',
        });
    });
}