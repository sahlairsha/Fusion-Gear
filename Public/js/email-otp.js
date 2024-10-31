document.getElementById("otp").focus();

let timer = 60;
let timerInterval;

function startTimer() {
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById("timerValue").textContent = timer;
        if (timer <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timerValue").classList.add("expired");
            document.getElementById("timerValue").textContent = "Expired";
            document.getElementById("otp").disabled = true;
        }
    }, 1000);
}
startTimer();

const otpForm = document.getElementById('otpForm');

otpForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const otpInput = document.getElementById('otp').value;

    $.ajax({
        type: "POST",
        url: "/emailOtp",
        data: { otp: otpInput },
        success: function (response) {
            if (response.success) {
                Swal.fire({
                    icon: "success",
                    title: "OTP Verification is Successful",
                    showConfirmButton: false,
                    timer: 1500,
                }).then(() => {
                    window.location.href = response.redirectUrl;
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: response.message,
                });
            }
        },
        error: function () {
            Swal.fire({
                icon: "error",
                title: "Invalid OTP",
                text: "Please Try Again!"
            });
        }
    });
});


document.getElementById('resend-otp').addEventListener('click',(e)=>{

    clearInterval(timerInterval);
    timer = 60
    document.getElementById("otp").disabled=false;
    document.getElementById("timerValue").classList.remove('expired');
    startTimer();

    $.ajax({
        type : "POST",
        url : "/resend-otp",
        success : function(response){
            if(response.success){
                Swal.fire({
                    icon : "success",
                    title : "OTP Resend Successful",
                    showConfirmButton : false,
                    timer : 1500,
                })
            }else{
                Swal.fire({
                    icon : "error",
                    title : "Error",
                    text : "Error occured while resend otp.Please try again."
                })
            }
        }
    })
    return false;


})
