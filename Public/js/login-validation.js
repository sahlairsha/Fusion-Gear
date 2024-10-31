const loginSubmit = document.getElementById('login-form');
const usernameId = document.getElementById('username');
const emailId = document.getElementById('email');
const passwordId = document.getElementById('password');

const err1 = document.getElementById('error1')
const err2 = document.getElementById('error2')
const err3 = document.getElementById('error3')



function usernameValidation() {
    const username = usernameId.value.trim();
    const usernamepattern = /^[a-zA-Z0-9_.]{3,15}$/;
    if (username === "") {
        err1.innerText = "Please enter the username";
    } else if (!usernamepattern.test(username)) {
        err1.innerText = "Only alphabets, numbers, and underscores. No spaces.";
    } else {
        err1.innerText = "";
    }
}

function emailValidation() {
    const email = emailId.value.trim();
    const emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email === "") {
        err2.innerText = "Please enter email address";
    } else if (!emailpattern.test(email)) {
        err2.innerText = "Please enter a valid email ID";
    } else {
        err2.innerText = "";
    }
}

function passwordValidation() {
    const password = passwordId.value.trim();
    const passwordpattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password === "") {
        err3.innerText = "Please enter a valid password";
    } else if (!passwordpattern.test(password)) {
        err3.innerText = "Minimum 8 characters, at least one letter and one number";
    } else {
        err3.innerText = "";
    }
}






usernameId.addEventListener('blur', usernameValidation);
emailId.addEventListener('blur', emailValidation);
passwordId.addEventListener('blur', passwordValidation);



loginSubmit.addEventListener('submit',(e)=>{
usernameValidation();
emailValidation();
passwordValidation();

const hasError = [err1,err2,err3].some(err=> err.innerText !== "")

if(hasError){
    e.preventDefault()
}


})