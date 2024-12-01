    // JavaScript to toggle the visibility of the form
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
          // Store the success message in localStorage before reloading
          localStorage.setItem('deleteSuccess', 'Address deleted successfully.');

          location.reload(); // Reload the page to update the list
        } else {
          // Store the error message in localStorage before reloading
          localStorage.setItem('deleteError', 'Failed to delete the address. Please try again.');
          location.reload();
        }
      } catch (error) {
        // Store the error message in localStorage before reloading
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
      text: successMessage,
      icon: 'success',
      confirmButtonText: 'OK'
    });
    localStorage.removeItem('deleteSuccess'); // Clear the success message
  } else if (errorMessage) {
    Swal.fire({
      title: 'Error!',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK'
    });
    localStorage.removeItem('deleteError'); // Clear the error message
  }
});

document.querySelectorAll('.edit-address').forEach((editLink) => {
  editLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const addressId = e.target.getAttribute('data-id');

    try {
      // Fetch the existing address data
      const response = await fetch(`/address-view/edit/${addressId}`);
      const addressData = await response.json();

      if (response.ok) {
        // Pre-fill the form with existing data
        document.getElementById('name').value = addressData.recipient_name;
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

        // Show the form
        document.getElementById('addressFormContainer').style.display = 'block';

        // Update form action to include the address ID
        const form = document.getElementById('addressForm');
        form.action = `/address-view/update/${addressId}`;
        form.method = 'POST';
      } else {

        Swal.fire({
            title: "Error!",
            text:'Failed to fetch address data. Please try again.',
             icon: 'error',
         confirmButtonText: 'OK'
        })
       
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
            title: "Error!",
            text:'Something went wrong. Please try again later.',
             icon: 'error',
         confirmButtonText: 'OK'
        })
    }
  });
});
