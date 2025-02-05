// Update Cart Quantity Logic
document.addEventListener('click', async (event) => {
    if (event.target.closest('.btn-increment') || event.target.closest('.btn-decrement')) {
        event.preventDefault();

        const isIncrement = event.target.closest('.btn-increment') ? true : false;
        const productId = event.target.closest('button').getAttribute('data-product-id');
        const variantId = event.target.getAttribute('data-variant-id');
        const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
        let quantity = parseInt(quantityInput.value);
        const availableStock = event.target.closest('button').getAttribute('data-available-stock');

        if (isIncrement) {
            quantity++;
        } else if (quantity > 1) {
            quantity--;
        }

        // Prevent quantity exceeding stock
        if (quantity > availableStock) {
            Swal.fire({
                icon: 'error',
                title: 'Stock Limit',
                text: `Only ${availableStock} items are available. Please reduce the quantity.`,
            });
            return;
        }

        quantityInput.value = quantity;

        try {
            const response = await fetch(`/cart/update-quantity/${productId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity , variantId})
            });

            const data = await response.json();

            if (response.ok) {
                updateCartUI(data);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: 'Failed to update product quantity',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error updating quantity',
            });
        }
    }
});

function updateCartUI(data) {
    document.querySelector('#cartTotal').textContent = `₹${data.cartTotal}`;
    document.querySelector('#discount').textContent = `-₹${data.discount}`;
    document.querySelector('#shippingCharges').textContent = `₹${data.shippingCharges}`;
    document.querySelector('#netAmount').textContent = `₹${data.netAmount}`;
}

// Remove item from cart logic
document.addEventListener('click', async (event) => {
    if (event.target.closest('.remove-item')) {
        event.preventDefault();
        const productId = event.target.closest('.remove-item').getAttribute('data-product-id');

        try {
            const response = await fetch(`/cart/delete/${productId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok) {
                event.target.closest('tr').remove();
                updateCartUI(data);

                Swal.fire({
                    icon: 'success',
                    title: 'Removed',
                    text: 'Product removed from cart successfully!',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: data.message || 'Failed to remove item',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error removing item',
            });
        }
    }
});


  // Prevent checkout if stock exceeds available limit
  document.querySelector('.primary-btn').addEventListener('click', async (event) => {
    event.preventDefault();

    const quantityInputs = document.querySelectorAll('.quantity-input');
    let hasInvalidStock = false;

    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value);
        const availableStock = parseInt(
            input.closest('.quantity').querySelector('.btn-increment').getAttribute('data-available-stock')
        );

        if (quantity > availableStock) {
            hasInvalidStock = true;
            Swal.fire({
                icon: 'error',
                title: 'Invalid Stock Quantity',
                text: `The quantity for "${input.closest('tr').querySelector('h6').innerText}" exceeds available stock (${availableStock}). Please update the quantity.`,
            });
        }
    });

    if (!hasInvalidStock) {
        window.location.href = "/checkout";
    }
});

function updateCartUI(data) {
    document.querySelector('#cartTotal').textContent = `₹${data.cartTotal}`;
    document.querySelector('#discount').textContent = `-₹${data.discount}`;
    document.querySelector('#shippingCharges').textContent = `₹${data.shippingCharges}`;
    document.querySelector('#netAmount').textContent = `₹${data.netAmount}`;
}

