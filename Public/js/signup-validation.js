const signupForm = document.getElementById('signup-form');
const nameid = document.getElementById('full-name');
const usermaneid = document.getElementById('username');
const emailid = document.getElementById('email');
const passwordId = document.getElementById('password');
const cpasswordId = document.getElementById('cpassword');
const phoneId = document.getElementById('phone');


const err1 = document.getElementById('error1');
const err2 = document.getElementById('error2');
const err3 = document.getElementById('error3');
const err4 = document.getElementById('error4');
const err5 = document.getElementById('error5');
const err6 = document.getElementById('error6');

function nameValidation() {
    const nameval = nameid.value.trim();
    const namepattern = /^[a-zA-Z\s]{2,50}$/;
    if (nameval === "") {
        err1.innerText = "Please enter the full name";
    } else if (!namepattern.test(nameval)) {
        err1.innerText = "Name can only contain alphabets and spaces";
    } else {
        err1.innerText = "";
    }
}

function usernameValidation() {
    const username = usermaneid.value.trim();
    const usernamepattern = /^[a-zA-Z0-9_.]{3,15}$/;
    if (username === "") {
        err2.innerText = "Please enter the username";
    } else if (!usernamepattern.test(username)) {
        err2.innerText = "Only alphabets, numbers, and underscores. No spaces.";
    } else {
        err2.innerText = "";
    }
}

function emailValidation() {
    const email = emailid.value.trim();
    const emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email === "") {
        err3.innerText = "Please enter email address";
    } else if (!emailpattern.test(email)) {
        err3.innerText = "Please enter a valid email ID";
    } else {
        err3.innerText = "";
    }
}

function passwordValidation() {
    const password = passwordId.value.trim();
    const passwordpattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password === "") {
        err4.innerText = "Please enter a valid password";
    } else if (!passwordpattern.test(password)) {
        err4.innerText = "Minimum 8 characters, at least one letter and one number";
    } else {
        err4.innerText = "";
    }
}

function phoneValidation() {
    const phone = phoneId.value.trim();
    const phonepattern = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    const allZero = /^0+$/;
    if (phone === "") {
        err5.innerText = "Please enter your phone number";
    } else if (!phonepattern.test(phone)) {
        err5.innerText = "Enter a valid phone number!";
    } else if (allZero.test(phone.replace(/[-+ ]/g, ""))) {
        err5.innerText = "Phone number cannot be all zeros!";
    } else {
        err5.innerText = "";
    }
}

function confirmPasswordValidation() {
    const password = passwordId.value.trim();
    const cpassword = cpasswordId.value.trim();
    if (cpassword === "") {
        err6.innerText = "Enter the password for confirmation";
    } else if (password !== cpassword) {
        err6.innerText = "Passwords do not match";
    } else {
        err6.innerText = "";
    }
}


nameid.addEventListener('blur', nameValidation);
usermaneid.addEventListener('blur', usernameValidation);
emailid.addEventListener('blur', emailValidation);
passwordId.addEventListener('blur', passwordValidation);
phoneId.addEventListener('blur', phoneValidation);
cpasswordId.addEventListener('blur', confirmPasswordValidation);


signupForm.addEventListener('submit', (e) => {
    nameValidation();
    usernameValidation();
    emailValidation();
    passwordValidation();
    phoneValidation();
    confirmPasswordValidation();

    const hasError = [err1, err2, err3, err4, err5, err6].some(err => err.innerText !== "");
    if (hasError) {
        e.preventDefault();
    }
});
