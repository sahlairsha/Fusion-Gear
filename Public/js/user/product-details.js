document.addEventListener("DOMContentLoaded", function() {
    // Trigger the update for the first selected size (if it's checked by default)
    const firstRadioButton = document.querySelector('input[name="size"]:checked');
    if (firstRadioButton) {
        updateProductDetails(firstRadioButton);
    }
});
function updateProductDetails(selectedSize) {
const selectedVariant = selectedSize.dataset;

// Update price: only display the offer price
const productPriceElement = document.getElementById("productPrice");
productPriceElement.textContent = `₹${selectedVariant.offerPrice}`;

// Update stock status
const stockStatusElement = document.getElementById("stock-status");
const stock = parseInt(selectedVariant.stock);

if (stock < 5 && stock > 0) {
    stockStatusElement.textContent = `Only ${stock} left, please hurry up!`;
    stockStatusElement.classList.add("text-danger");
} else if (stock === 0) {
    stockStatusElement.textContent = "Out of Stock";
    stockStatusElement.classList.add("text-danger");
} else {
    stockStatusElement.textContent = "In Stock";
    stockStatusElement.classList.remove("text-danger");
}

// Log variant ID for debugging
const variantId = selectedVariant.variantId;
console.log(`Selected variant ID: ${variantId}`);
}

const productId = document.getElementById('ratings').getAttribute('data-product-id')
console.log("Product id for rating:",productId)
// Fetch product details
fetch(`/product-ratings?productId=${productId}`)
    .then(response => response.json())
    .then(data => {
        // Assuming data contains the required rating information
        const { totalRatings, ratingPercentages, counts, averageRating } = data;

        // Create the rating overview HTML dynamically
        let ratingOverviewHtml = `<p>Average Rating: ${averageRating.toFixed(1)}★</p>`;
        ratingOverviewHtml += `<div class="rating-bars">`;

        // Loop through each star rating (1 to 5)
        for (let i = 5 -1 ; i >= 0; i--) {
            ratingOverviewHtml += `
                <div class="rating-bar">
                    <span>${1 + i}★</span>
                    <div class="bar-container">
                        <div class="bar" style="width: ${ratingPercentages[i]}%"></div>
                    </div>
                    <span>${counts[i]} (${ratingPercentages[i].toFixed(1)}%)</span>
                </div>
            `;
        }

        ratingOverviewHtml += `</div>`;

        // Insert the generated HTML into the rating-overview div
        document.getElementById('rating-overview').innerHTML = ratingOverviewHtml;
    })
    .catch(error => {
        console.error('Error fetching product details:', error);
    });


    document.getElementById('rateProductBtn').addEventListener('click', function () {
        const productId = this.getAttribute('data-product-id');
        if (productId) {
            window.location.href = `/ratings?id=${productId}`;
        } else {
            console.error('Product ID is missing.');
        }
    });








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



function addToWishlistFromDetails(productId){
    const selectedSizeElement = document.querySelector('input[name="size"]:checked');
    console.log("Selected Varaint",selectedSizeElement)
    if (!selectedSizeElement) {
        Swal.fire({
            title: "Error",
            icon: "error",
            text: "Please select a size before adding to wishlist.",
            showConfirmButton: true,
        });
        return;
    }

    const selectedVariantId = selectedSizeElement.dataset.variantId;

    // Log the data being sent to ensure it's correct
    console.log({
        productId: productId,
        variantId: selectedVariantId
    });

    $.ajax({
        url: '/wishlist/add',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            productId: productId,
            variantId: selectedVariantId
        }),
        success: function(response) {
            Swal.fire({
                title: "Success",
                icon: "success",
                text: "Product added to wishlist successfully",
                showConfirmButton: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/wishlist';
                }
            });
        },
        error: function(xhr, status, error) {
            console.error("Error:", error);
            Swal.fire({
                title: "Error",
                icon: "error",
                text:"The product Already existed in wishlist",
                showConfirmButton: true,
            });
        }
    });
}



function addToCart(productId) {
   
    const selectedSizeElement = document.querySelector('input[name="size"]:checked');
    
    if (!selectedSizeElement) {
        Swal.fire({
            title: "Error",
            icon: "error",
            text: "Please select a size before adding to cart.",
            showConfirmButton: true,
        });
        return;
    }

    // Get the selected variant ID from the data-variant-id attribute
    const selectedVariantId = selectedSizeElement.dataset.variantId;

    if (!selectedVariantId) {
        Swal.fire({
            title: "Error",
            icon: "error",
            text: "Variant ID is missing.",
            showConfirmButton: true,
        });
        return;
    }

    // Get the quantity from the input field (use default value of 1 if empty)
    const quantity = document.querySelector('.pro-qty input').value || 1;

    // Proceed with AJAX to add the product to the cart
    $.ajax({
        url: `/cart/add`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            quantity: parseInt(quantity, 10),
            productId: productId,
            variantId: selectedVariantId 
        }),
        success: function(response) {
            Swal.fire({
                title: "Success",
                icon: "success",
                text: "Product added successfully",
                showConfirmButton: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/cart';  
                }
            });
        },
        error: function() {
            Swal.fire({
                title: "Error",
                icon: "error",
                text: "Failed to add product to cart!",
                showConfirmButton: true,
            });
        }
    });
}


const imageContainers = document.querySelectorAll('.product__details__pic__item');
const images = document.querySelectorAll('.product-image');

imageContainers.forEach((imageContainer, index) => {
    const image = images[index]; 

    imageContainer.addEventListener('mousemove', (event) => {
        const rect = imageContainer.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        image.style.transition = 'transform 0.2s ease-out'; // Smooth zoom
        image.style.transformOrigin = `${x}% ${y}%`;
        image.style.transform = 'scale(1.8)'; // More zoom effect
    });

    imageContainer.addEventListener('mouseleave', () => {
        image.style.transition = 'transform 0.4s ease-in-out'; // Smooth reset
        image.style.transform = 'scale(1)';
        image.style.transformOrigin = 'center center';
    });
});
