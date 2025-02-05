const formSubmit = document.getElementById("form-submit");
const nameField = document.getElementById("name");
const descriptionField = document.getElementById("description");
const discountField = document.getElementById("discount");
const startDateField = document.getElementById("start_Date");
const endDateField = document.getElementById("end_Date");

const nameError = document.getElementById("nameError");
const descriptionError = document.getElementById("descriptionError");
const discountError = document.getElementById("discountError");
const startDateError = document.getElementById("start_DateError");
const endDateError = document.getElementById("end_DateError");

function formValidation() {
  let isValid = true;

  if (nameField.value.trim() === "") {
    nameError.innerText = "Please enter a category name.";
    isValid = false;
  } else {
    nameError.innerText = "";
  }

  if (descriptionField.value.trim() === "") {
    descriptionError.innerText = "Please enter a description.";
    isValid = false;
  } else {
    descriptionError.innerText = "";
  }

  if (
    discountField.value.trim() === "" ||
    isNaN(discountField.value) ||
    discountField.value < 0 ||
    discountField.value > 100
  ) {
    discountError.innerText = "Please enter a discount between 0 and 100.";
    isValid = false;
  } else {
    discountError.innerText = "";
  }
  if (startDateField.value.trim() === "") {
    startDateError.innerText = "Please select a start date.";
    isValid = false;
  } else {
    startDateError.innerText = "";
  }

  if (endDateField.value.trim() === "") {
    endDateError.innerText = "Please select an end date.";
    isValid = false;
  } else {
    endDateError.innerText = "";
  }
  return isValid;
}

formSubmit.addEventListener("submit", (e) => {
  e.preventDefault();

  if (formValidation()) {
    formSubmit.submit();
  }
});



