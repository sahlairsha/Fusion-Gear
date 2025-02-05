

    function retryPayment(orderId) {
        console.log("Retrying payment for orderId:", orderId);
        if (!orderId) {
            console.error("Invalid order ID");
            return;
        }
    
        fetch('/retry-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const options = {
                    key: data.keyId,
                    amount: data.amount * 100, // Convert to paise for Razorpay
                    currency: 'INR',
                    name: 'Fusion Gear',
                    description: 'Order Payment',
                    order_id: data.razorpay_order_id, // Razorpay order ID
                    handler: function (response) {
                        console.log("Payment response received:", response);
                        fetch('/retry-payment-verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        })
                        .then(res => res.json())
                        .then(result => {
                            if (result.success) {
                                Swal.fire({
                                    title: 'Payment Successful!',
                                    text: 'Your order has been paid successfully.',
                                    icon: 'success',
                                }).then(() => {
                                    window.location.reload(); // Reload to show updated order status
                                });
                            } else {
                                Swal.fire({
                                    title: 'Payment Verification Failed!',
                                    text: 'The payment could not be verified. Please try again later.',
                                    icon: 'error',
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error verifying payment:', error);
                            Swal.fire({
                                title: 'Payment Verification Error!',
                                text: 'Error verifying payment, please try again later.',
                                icon: 'error',
                            });
                        });
                    },
                    prefill: {
                        name: 'User Name',
                        email: 'user@example.com',
                        contact: '1234567890',
                    },
                };
    
                const rzp1 = new Razorpay(options);
                rzp1.open();
            } else {
                Swal.fire({
                    title: 'Payment Failed',
                    text: data.message || 'Failed to retry payment. Please try again later.',
                    icon: 'error',
                });
            }
        })
        .catch(error => {
            console.error('Error retrying payment:', error);
            Swal.fire({
                title: 'Payment Failed',
                text: 'Failed to retry payment. Please try again later.',
                icon: 'error',
            });
        });
    }
  