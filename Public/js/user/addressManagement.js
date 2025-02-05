const addressForm = document.getElementById('addressFormContainer')
const recipient_name = document.getElementById('recipient_name')
const streetAddress = document.getElementById('streetAddress')
const city = document.getElementById('city')
const state = document.getElementById('state')
const pincode = document.getElementById('pincode')
const phone = document.getElementById('phone');

const err1 = document.getElementById('error1')
const err2 = document.getElementById('error2')
const err3 = document.getElementById('error3')
const err4 = document.getElementById('error4')
const err5 = document.getElementById('error5')
const err6 = document.getElementById('error6')


const addressTypeInputs = document.getElementsByName('addressType');
const err7 = document.getElementById('error7');

function addressTypeValidation() {
const isSelected = Array.from(addressTypeInputs).some(input => input.checked);
if (!isSelected) {
    err7.innerText = "Please select an address type";
} else {
    err7.innerText = "";
}
}

addressTypeInputs.forEach(input => input.addEventListener('change', addressTypeValidation));


function nameValidation(){
const nameVal = recipient_name.value.trim();
const namePattern = /^[a-zA-Z\s]{2,50}$/;
if (nameVal === "") {
    err1.innerText = "Please enter the full name";
} else if (!namePattern.test(nameVal)) {
    err1.innerText = "Name can only contain alphabets and spaces";
} else {
    err1.innerText = "";
}
}

recipient_name.addEventListener('blur',nameValidation)
streetAddress.addEventListener('blur',addressValidation)
city.addEventListener('blur',addressValidation)
state.addEventListener('blur',addressValidation)
pincode.addEventListener('blur',addressValidation)
phone.addEventListener('blur',addressValidation)
altPhone.addEventListener('blur',addressValidation)

function addressValidation(){
const streetVal = streetAddress.value.trim()
const cityVal = city.value.trim();
const stateVal = state.value.trim();
const pincodeVal = pincode.value.trim();
const phoneVal = phone.value.trim()
const phonePattern = /^(\+\d{1,3}[- ]?)?\d{10}$/;
const pincodePattern = /^\d{6}$/;
const allZero = /^0+$/;



if (streetVal === "") {
    err2.innerText = "Please enter street address";
} else {
    err2.innerText = "";
}

if (cityVal === "") {
    err3.innerText = "Please enter city";
} else {
    err3.innerText = "";
}

if (stateVal === "") {
    err4.innerText = "Please enter state";
} else {
    err4.innerText = "";
}

if (!pincodePattern.test(pincodeVal)) {
    err5.innerText = "Enter a valid 6-digit pincode";
} else if(allZero.test(pincodeVal)){
    err5.innerText = "Pincode cannot be all zeros!";
}else {
    err5.innerText = "";
}

if (allZero.test(phoneVal)) {
    err6.innerText = "Phone number cannot be all zeros!";
} else if (!phonePattern.test(phoneVal)) {
    err6.innerText = "Enter a valid phone number";
} else {
    err6.innerText = "";
}


}
document.getElementById('addressForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Perform validation
  nameValidation();
  addressValidation();
  addressTypeValidation();

  const hasError = [err1, err2, err3, err4, err5, err6, err7].some(err => err.innerText !== "");
  if (hasError) {
    return;
  }

  const actionType = document.getElementById('actionType').value;
  const addressId = actionType === 'update' ? document.getElementById('addressId').value : null;
  const addressTypeElement = document.querySelector('input[name="addressType"]:checked');
  const addressType = addressTypeElement ? addressTypeElement.value : null;

  const addressData = {
    recipient_name: document.getElementById('recipient_name').value.trim(),
    streetAddress: document.getElementById('streetAddress').value.trim(),
    city: document.getElementById('city').value.trim(),
    state: document.getElementById('state').value.trim(),
    landMark: document.getElementById('landMark').value.trim(),
    pincode: document.getElementById('pincode').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    altPhone: document.getElementById('altPhone').value.trim(),
    addressType: addressType,
  };

  const url = actionType === 'update'
    ? `/address-view/update/${addressId}`
    : document.getElementById('addressForm').action;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    });

    const responseText = await response.text();
    console.log('Response text:', responseText);

    if (response.ok) {
      const responseData = JSON.parse(responseText);
      Swal.fire({
        title: 'Success!',
        text: responseData.message,
        icon: 'success',
        confirmButtonText: 'OK',
      }).then(() => {
        location.reload();
      });
    } else {
      const errorData = JSON.parse(responseText);
      console.error("Server-side error:", errorData);
      Swal.fire({
        title: 'Error!',
        text: errorData.message || 'Failed to add/update the address. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    }
  } catch (error) {
    console.error("Client-side error:", error);
    Swal.fire({
      title: 'Error!',
      text: 'Something went wrong. Please try again later.',
      icon: 'error',
      confirmButtonText: 'OK',
    });
  }
});

document.getElementById('showFormBtn').addEventListener('click', function() {
    const formContainer = document.getElementById('addressFormContainer');
    formContainer.style.display = (formContainer.style.display === 'none' || formContainer.style.display === '') ? 'block' : 'none';
});

document.querySelectorAll('.delete-address').forEach((deleteLink) => {
deleteLink.addEventListener('click', async (e) => {
e.preventDefault();
const addressId = e.target.getAttribute('data-id');

// Show SweetAlert2 confirmation dialog
const { isConfirmed } = await Swal.fire({
  title: 'Are you sure?',
  text: "You won't be able to revert this!",
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Yes, delete it!',
  cancelButtonText: 'No, cancel'
});

if (isConfirmed) {
  try {
    const response = await fetch(`/address-view/delete/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
     
      localStorage.setItem('deleteSuccess', 'Address deleted successfully.');

      location.reload(); 
    } else {
     
      localStorage.setItem('deleteError', 'Failed to delete the address. Please try again.');
      location.reload();
    }
  } catch (error) {

    console.error("Error:", error);
    localStorage.setItem('deleteError', 'Something went wrong. Please try again later.');
    location.reload();
  }
}
});
});

// After page reload, check for success or error message
window.addEventListener('load', () => {
const successMessage = localStorage.getItem('deleteSuccess');
const errorMessage = localStorage.getItem('deleteError');

if (successMessage) {
Swal.fire({
  title: 'Deleted!',
  text:  successMessage,
  icon: 'success',
  confirmButtonText: 'OK'
});
localStorage.removeItem('deleteSuccess');
} else if (errorMessage) {
Swal.fire({
  title: 'Error!',
  text: errorMessage,
  icon: 'error',
  confirmButtonText: 'OK'
});
localStorage.removeItem('deleteError'); 
}
});

document.querySelectorAll('.edit-address').forEach((editLink) => {
editLink.addEventListener('click', async (e) => {
e.preventDefault();
const addressId = e.target.getAttribute('data-id');
try {

    // Fetch the existing address data
const response = await fetch(`/address-view/edit/${addressId}`);
console.log('Response Status:', response.status);
const addressData = await response.json();
console.log('Address Data:', addressData); 

if (response.ok) {
document.getElementById('recipient_name').value = addressData.recipient_name;
document.getElementById('streetAddress').value = addressData.streetAddress;
document.getElementById('city').value = addressData.city;
document.getElementById('state').value = addressData.state;
document.getElementById('landMark').value = addressData.landMark || '';
document.getElementById('pincode').value = addressData.pincode;
document.getElementById('phone').value = addressData.phone;
document.getElementById('altPhone').value = addressData.altPhone || '';

// Set the address type (radio button)
document.querySelectorAll('input[name="addressType"]').forEach((input) => {
  input.checked = input.value === addressData.addressType;
});

document.getElementById('addressFormContainer').style.display = 'block';
document.getElementById('showFormBtn').style.display = "none";
document.getElementById('submit-btn').innerText = "Update";

// Ensure the form exists before trying to modify it
const form = document.getElementById('addressForm');
if (form) {
form.action = `/address-view/update/${addressId}`;
form.method = 'POST';
} else {
console.error('Form not found');
}
} else {
Swal.fire({
  title: "Error!",
  text: 'Failed to fetch address data. Please try again.',
  icon: 'error',
  confirmButtonText: 'OK'
});
}
} catch (error) {
console.error('Error:', error);
Swal.fire({
title: "Error!",
text: 'Something went wrong. Please try again later.',
icon: 'error',
confirmButtonText: 'OK'
});
}

});
});
