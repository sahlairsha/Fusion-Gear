function toggleAddMoneyForm() {
    const formContainer = document.getElementById('addMoneyFormContainer');
    formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
  }
  
  document.getElementById("addMoneyForm").addEventListener("submit", async function (event) {
      event.preventDefault();
  
      // Safely retrieve the amount input and payment method
      const amountElement = document.getElementById("addMoneyAmount");
      const paymentMethodElement = document.querySelector('input[name="payment_method"]:checked');
  
      // Check if the elements exist and have valid values
      if (!amountElement || !paymentMethodElement) {
          Swal.fire({
              icon: "error",
              title: "Invalid Form",
              text: "Please fill in all the required fields."
          });
          return;
      }
  
      const amount = parseFloat(amountElement.value);
      console.log("Ammount in frontend:",amount)
      const paymentMethod = paymentMethodElement.value;
  
      // Validate the amount
      if (isNaN(amount) || amount <= 0) {
          Swal.fire({
              icon: 'error',
              title: 'Invalid amount',
              text: "Please enter a valid amount greater than zero."
          });
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
  
          // Initialize Razorpay
          const razorpayOptions = {
              key: "rzp_test_slK6OGJAoLPk9J",
              amount: amount * 100,
              currency: currency,
              order_id: orderId,
              name: "Fusion-Gear",
              description: "Add Money to Wallet",
              handler: async function (response) {
                  // Verify payment on the backend
                  const verifyResponse = await fetch("/wallet/verify-payment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                          razorpayOrderId: response.razorpay_order_id,
                          razorpayPaymentId: response.razorpay_payment_id,
                          razorpaySignature: response.razorpay_signature,
                          amount: amount,
                      }),
                  });
  
                  const verifyResult = await verifyResponse.json();
                  if (verifyResponse.ok) {
                      document.getElementById("balance").innerText = `₹${verifyResult.newBalance.toFixed(2)}`;
                      addTransactionToTable(verifyResult.transaction);
                      Swal.fire("Success!", "Money added to wallet successfully!", "success");
                  } else {
                      Swal.fire("Error!", verifyResult.message || "Payment failed.", "error");
                  }
              },
              theme: { color: "#528FF0" },
          };
  
          const rzp = new Razorpay(razorpayOptions);
          rzp.open();
      } catch (error) {
          console.error("Error initiating payment:", error);
          Swal.fire({
              icon: "error",
              title: "Error",
              text: "An error occurred while initiating payment. Please try again later.",
          });
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