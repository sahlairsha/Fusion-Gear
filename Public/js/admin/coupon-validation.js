document.getElementById('discountType').addEventListener('change', function() {
    const discountType = this.value;
    
    // Show discount value field
    document.getElementById('discountValueFields').style.display = 'block';
    
    // Show/hide amount/rate field based on discount type
    if (discountType === 'fixed') {
        document.getElementById('discountValue').placeholder = 'Enter fixed discount amount';
    } else {
        document.getElementById('discountValue').placeholder = 'Enter percentage discount rate';
    }
});



document.getElementById('discountType').dispatchEvent(new Event('change'));

document.addEventListener('DOMContentLoaded', function() {
document.getElementById('coupon-form').addEventListener('submit', function(e) {
    e.preventDefault(); 
    console.log('Form submitted, validating...');
    let valid = true;

    clearErrors();

    
    const code = document.getElementById('code').value.trim();
    if (code === '') {
        document.getElementById('code-error').innerText = "Coupon Code is required.";
        valid = false;
    } else {
        document.getElementById('code-error').innerText = "";
    }
    console.log('Coupon Code validation:', valid);

    const description = document.getElementById('description').value.trim();
    if(description === "") {
        document.getElementById('description-error').innerText = "Description is required.";
        valid = false;
    } else {
        document.getElementById('description-error').innerText = "";
    }

   
    const discountValue = document.getElementById('discountValue').value.trim();
    console.log('Discount Value:', discountValue);
    if (discountValue === "") {
        document.getElementById('discountValue-error').innerText = "Discount value is required";
        valid = false;
    } else if (discountValue <= 0) {
        document.getElementById('discountValue-error').innerText = "Discount should be greater than zero";
        valid = false;
    } else {
        document.getElementById('discountValue-error').innerText = "";
    }

    const startDate = document.getElementById('startDate').value;

    if (!startDate) {
        document.getElementById('startDate-error').innerText = "Start Date is required.";
        valid = false;
    } else {
        document.getElementById('startDate-error').innerText = "";
    }

    // Validate End Date
    const endDate = document.getElementById('endDate').value;

    if (!endDate) {
        document.getElementById('endDate-error').innerText = "End Date is required.";
        valid = false;
    } else if (new Date(startDate) > new Date(endDate)) {
        document.getElementById('endDate-error').innerText = "End Date must be later than Start Date.";
        valid = false;
    } else {
        document.getElementById('endDate-error').innerText = "";
    }

   
        const minOrderValue = document.getElementById('minOrderValue').value;
        if (!minOrderValue || minOrderValue <= 0) {
            document.getElementById('minOrderValue-error').innerText = "Minimum Order Value must be greater than 0.";
            valid = false;
        }
    

    if (valid) {
        // If all validations pass, submit the form
        document.getElementById('coupon-form').submit();
    }
});
});

function clearErrors() {
const errorElements = document.querySelectorAll('.error-message');
errorElements.forEach((errorElement) => {
    errorElement.innerText = ''; // Clear previous error messages
});
}
