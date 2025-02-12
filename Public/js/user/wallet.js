
function processRazorpay(options) {
    return new Promise((resolve, reject) => {
      options.handler = function (response) {
        resolve(response);
      };
  
      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (response) {
        reject(response);
      });
      rzp.open();
    });
  }
  
  function toggleAddMoneyForm() {
    const formContainer = document.getElementById("addMoneyFormContainer");
    formContainer.style.display =
      formContainer.style.display === "none" ? "block" : "none";
  }
  
  document.getElementById("addMoneyForm").addEventListener("submit", async function (event) {
    event.preventDefault();
  
    const submitButton = document.querySelector('#addMoneyForm button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    // Disable the button and add spinner text
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Processing...';
  
    const amountElement = document.getElementById("addMoneyAmount");
    const paymentMethodElement = document.querySelector('input[name="payment_method"]:checked');
  
    // Validate required fields
    if (!amountElement || !paymentMethodElement) {
      toastr.error("Please fill in all the required fields.", "Invalid Form");
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
      return;
    }
  
    const amount = parseFloat(amountElement.value);
    console.log("Amount in frontend:", amount);
    const paymentMethod = paymentMethodElement.value;
  
    // Validate the amount
    if (isNaN(amount) || amount <= 0) {
      toastr.error("Please enter a valid amount greater than zero.", "Invalid Amount");
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
      return;
    }
  
    try {
      // Create an order on the backend
      const orderResponse = await fetch("/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, paymentMethod }),
      });
  
      const { orderId, currency } = await orderResponse.json();
  
      // Set up Razorpay options without specifying the handler here
      const razorpayOptions = {
        key: "rzp_test_slK6OGJAoLPk9J",
        amount: amount * 100, // amount in paise
        currency: currency,
        order_id: orderId,
        name: "Fusion-Gear",
        description: "Add Money to Wallet",
        theme: { color: "#528FF0" },
      };
  
      // Await the payment response from Razorpay (outside its handler)
      const paymentResponse = await processRazorpay(razorpayOptions);
      console.log("Razorpay payment response:", paymentResponse);
  
      // Now verify the payment on the backend
      const verifyResponse = await fetch("/wallet/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: paymentResponse.razorpay_order_id,
          razorpayPaymentId: paymentResponse.razorpay_payment_id,
          razorpaySignature: paymentResponse.razorpay_signature,
          amount: amount,
        }),
      });
  
      const verifyResult = await verifyResponse.json();
  
      if (verifyResponse.ok) {
        // Update balance and transaction table
        document.getElementById("balance").innerText = `₹${verifyResult.newBalance.toFixed(2)}`;
        addTransactionToTable(verifyResult.transaction);
  
        console.log("Payment verified successfully. Showing success notification.");
  
        toastr.success("Money added to wallet successfully!", "Success");
        setTimeout(function() {
          window.location.reload();
        }, 1500);
      } else {
        toastr.error(verifyResult.message || "Payment failed.", "Error");
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      toastr.error("An error occurred while initiating payment. Please try again later.", "Error");
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });
  
  function addTransactionToTable(transaction) {
    const table = document.getElementById("transactionTable");
    const row = document.createElement("tr");
  
    const dateCell = document.createElement("td");
    dateCell.innerText = new Date(transaction.date).toLocaleString();
  
    const descCell = document.createElement("td");
    descCell.innerText = transaction.type;
  
    const amountCell = document.createElement("td");
    amountCell.innerText = `₹${transaction.amount.toFixed(2)}`;
    amountCell.style.color = transaction.amount > 0 ? "green" : "red";
  
    row.appendChild(dateCell);
    row.appendChild(descCell);
    row.appendChild(amountCell);
    table.appendChild(row);
  }
  