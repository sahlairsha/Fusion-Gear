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



addressForm.addEventListener('submit',(e)=>{
nameValidation();
addressValidation();
addressTypeValidation();
const hasError = [err1, err2, err3, err4, err5, err6,err7].some(err => err.innerText !== "");
if (hasError) {
    e.preventDefault();
}
})
