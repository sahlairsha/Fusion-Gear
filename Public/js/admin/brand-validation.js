const form = document.getElementById('brandForm');
  const brandNameField = document.getElementById('brand_name');
  const descriptionField = document.getElementById('description');
  const logoField = document.getElementById('logo');

  const brandNameError = document.getElementById('brandNameError');
  const descriptionError = document.getElementById('descriptionError');
  const logoError = document.getElementById('logoError');

  function validateForm(event) {
    let isValid = true;

    // Reset error messages
    brandNameError.textContent = '';
    descriptionError.textContent = '';
    logoError.textContent = '';

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

    // Validate logo
    if (logoField.files.length === 0) {
      logoError.textContent = 'Please upload a logo.';
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault(); // Prevent form submission if validation fails
    }
  }

  form.addEventListener('submit', validateForm);