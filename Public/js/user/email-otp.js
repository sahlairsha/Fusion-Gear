document.getElementById("otp").focus();

let timer = 60;
let timerInterval;

function startTimer() {
    document.getElementById('resend-otp').disabled = true; 
    
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById("timerValue").textContent = timer;

        if (timer <= 0) {
            clearInterval(timerInterval);
            document.getElementById("timerValue").classList.add("expired");
            document.getElementById("timerValue").textContent = "Expired";
            document.getElementById("otp").disabled = true;

            document.getElementById('resend-otp').disabled = false; 
        }
    }, 1000);
}

startTimer();

otpForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const verifyButton = document.querySelector('button[type="submit"]');
    verifyButton.innerHTML='Verfiying <span class="btn-loading"><span>'


    const otpInput = document.getElementById('otp').value.trim();
    

    if (!otpInput) {
        Swal.fire({
            icon: 'warning',
            title: 'Empty OTP',
            text: 'Please enter the OTP before submitting.'
        });
        
        verifyButton.innerHTML = 'Verify Email';
        document.getElementById("otp").focus();
        return;
    }
    $.ajax({
        type: "POST",
        url: "/email-otp",
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

document.getElementById('resend-otp').addEventListener('click', (e) => {
    e.preventDefault();

    // Disable the button immediately after clicking
    document.getElementById('resend-otp').disabled = true;

    clearInterval(timerInterval);
    timer = 60;
    document.getElementById("otp").disabled = false;
    document.getElementById("timerValue").classList.remove('expired');
    startTimer(); // Restart timer after resending OTP

    $.ajax({
        type: "POST",
        url: "/resend-otp",
        success: function (response) {
            if (response.success) {
                Swal.fire({
                    icon: "success",
                    title: "OTP Resent Successfully",
                    showConfirmButton: false,
                    timer: 1500,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "An error occurred while resending OTP. Please try again."
                });
                // Re-enable the button if resend fails
                document.getElementById('resend-otp').disabled = false;
            }
        },
        error: function () {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to resend OTP. Please try again!"
            });
            
            document.getElementById('resend-otp').disabled = false;
        }
    });
});
