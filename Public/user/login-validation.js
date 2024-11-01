const loginSubmit = document.getElementById('login-form');
const emailId = document.getElementById('email');
const passwordId = document.getElementById('password');


const err1 = document.getElementById('error1')
const err2 = document.getElementById('error2')



function emailValidation() {
    const email = emailId.value.trim();
    const emailpattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email === "") {
        err1.innerText = "Please enter email address";
    } else if (!emailpattern.test(email)) {
        err1.innerText = "Please enter a valid email ID";
    } else {
        err1.innerText = "";
    }
}

function passwordValidation() {
    const password = passwordId.value.trim();
    const passwordpattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (password === "") {
        err2.innerText = "Please enter a valid password";
    } else if (!passwordpattern.test(password)) {
        err2.innerText = "Minimum 8 characters, at least one letter and one number";
    } else {
        err2.innerText = "";
    }
}



emailId.addEventListener('blur', emailValidation);
passwordId.addEventListener('blur', passwordValidation);



loginSubmit.addEventListener('submit',(e)=>{
emailValidation();
passwordValidation();

const hasError = [err1,err2].some(err=> err.innerText !== "")

if(hasError){
    e.preventDefault()
}


})