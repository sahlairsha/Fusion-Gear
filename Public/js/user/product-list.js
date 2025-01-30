
function addToWishlist(productId, variantId) {
    const quantity = 1;
    fetch('/wishlist/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            variantId: variantId,
            quantity : quantity
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Product added to wishlist') {
            const heartIcon = document.getElementById('heart-icon');
            heartIcon.classList.remove('far', 'fa-heart');
            heartIcon.classList.add('fas', 'fa-heart');
            
            // Show success alert without redirecting
            Swal.fire({
                title: 'Product added to wishlist',
                  icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Go to Wishlist',
                    cancelButtonText: 'Stay Here',
            }).then((result) => {
                if (result.isConfirmed) {
        window.location.href = '/wishlist';
     }
            });
        } else {
            Swal.fire({
                title: 'Error',
                icon: 'error',
                text: data.message || 'Failed to add to wishlist',
                confirmButtonText: 'Try Again',
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            icon: 'error',
            text: 'Internal Server Error',
            confirmButtonText: 'Try Again',
        });
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
            quantity: quantity, 
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


document.addEventListener('DOMContentLoaded', function () {
    // Toggle clear buttons visibility
    toggleClearButtons();

    // Event delegation for dynamically rendered elements
    document.body.addEventListener('click', function (event) {
        if (event.target.matches('.clear-filter')) {
            event.preventDefault();
            const filterType = event.target.getAttribute('data-filter');
            const queryParams = new URLSearchParams(window.location.search);

            queryParams.delete(filterType);
            window.location.search = queryParams.toString();
        }

        if (event.target.matches('.clear-all a')) {
            event.preventDefault();
            window.location.search = '';
        }
    });

    // Handle filter changes
    document.querySelectorAll('input[name="size"], input[name="color"]').forEach(input => {
        input.addEventListener('change', updateFilters);
    });

    // Handle search form submission
    document.getElementById('searchForm').onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const queryParams = new URLSearchParams(window.location.search);

        for (const [key, value] of formData.entries()) {
            queryParams.set(key, value);
        }

        queryParams.set('page', 1); // Reset to page 1
        window.location.search = queryParams.toString();
    };

    // Handle price filter
    document.querySelectorAll('.price-filter').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            const priceRange = this.getAttribute('data-range');

            if (!/^\d+-\d+$/.test(priceRange)) {
                console.error('Invalid price range:', priceRange);
                return;
            }

            const queryParams = new URLSearchParams(window.location.search);
            queryParams.set('priceRange', priceRange);
            queryParams.set('page', 1);
            window.location.search = queryParams.toString();
        });
    });
});

function toggleClearButtons() {
    const urlParams = new URLSearchParams(window.location.search);

    document.querySelectorAll('.clear-filter').forEach(button => {
        const filterType = button.getAttribute('data-filter');
        button.style.display = urlParams.has(filterType) && urlParams.get(filterType) ? 'inline-block' : 'none';
    });

    const clearAllButton = document.querySelector('.clear-all a');
    clearAllButton.style.display = [...urlParams].length > 0 ? 'inline-block' : 'none';
}

function updateFilters() {
    const queryParams = new URLSearchParams(window.location.search);
    const size = document.querySelector('input[name="size"]:checked')?.value;
    const color = document.querySelector('input[name="color"]:checked')?.value;

    if (size) queryParams.set('size', size);
    else queryParams.delete('size');

    if (color) queryParams.set('color', color);
    else queryParams.delete('color');

    queryParams.set('page', 1); // Reset to page 1
    window.location.search = queryParams.toString();
}


    function updateSortAndFilters(select) {
        const queryParams = new URLSearchParams(window.location.search);  
        queryParams.set('sort', select.value);         
        window.location.search = queryParams.toString();
    }
