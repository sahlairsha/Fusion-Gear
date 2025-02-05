  // Form validation
  const form = document.getElementById('editBrandForm');
  const brandNameField = document.getElementById('brand_name');
  const descriptionField = document.getElementById('description');
  const logoField = document.getElementById('logo');

  const brandNameError = document.getElementById('brandNameError');
  const descriptionError = document.getElementById('descriptionError');

  function validateForm(event) {
    let isValid = true;

    // Reset error messages
    brandNameError.textContent = '';
    descriptionError.textContent = '';

    // Validate brand name
    if (brandNameField.value.trim() === '') {
      brandNameError.textContent = 'Please enter the brand name.';
      isValid = false;
    }

    // Validate description
    if (descriptionField.value.trim() === '') {
      descriptionError.textContent = 'Please enter a description.';
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault(); // Prevent form submission if validation fails
    }
  }

  form.addEventListener('submit', validateForm);