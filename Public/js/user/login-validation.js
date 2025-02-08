const loginSubmit = document.getElementById('login-form');
const emailId = document.getElementById('email');
const passwordId = document.getElementById('password');


const err1 = document.getElementById('error1')
const err2 = document.getElementById('error2')

const loginBtn = document.getElementById('login-btn');

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
    if (password === "") {
        err2.innerText = "Please enter a valid password";
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

    loginBtn.disabled = false;
    loginBtn.innerHTML = 'Login';
}else{
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span>';

    setTimeout(() => {  
        window.location.href = '/';  
      }, 2000);  
    
    
}

})