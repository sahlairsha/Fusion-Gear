
        
function validateAndSubmit() {
    if (!validateForm()) {
        return false; 
    }

    document.forms[0].submit();
}


let variants = [];

function addVariant() {
    const color = document.getElementById("variantColor").value.trim();
    const size = document.getElementById("variantSize").value.trim();
    const stock = parseInt(document.getElementById("variantStock").value.trim());
    const regularPrice = parseFloat(document.getElementById("variantRegularPrice").value.trim());
    const salePrice = parseFloat(document.getElementById("variantSalePrice").value.trim());

    // Check for valid input values
    if (!color || isNaN(stock) || stock <= 0 || isNaN(regularPrice) || regularPrice <= 0 || isNaN(salePrice) || salePrice < 0) {
        Swal.fire({ title: "Error!", text: "Please fill in all variant details with valid values.", icon: "error", confirmButtonText: "Okay" });
        return;
    }

    if (isNaN(regularPrice) < isNaN(salePrice)) {
        Swal.fire({ title: "Error!", text: "Regular price should be greater than sale price.", icon: "error", confirmButtonText: "Okay" });
        return;
    }

    // Check if the limit has been reached
    const variantLimit = 4;
    if (variants.length >= variantLimit) {
        Swal.fire({ title: "Error!", text: `You can only add up to ${variantLimit} variants.`, icon: "error", confirmButtonText: "Okay" });
        return;
    }

    // Add the new variant
    variants.push({ color, size, stock, regularPrice, salePrice });

    // Update the hidden input field
    document.getElementById("variantData").value = JSON.stringify(variants);

    // Add the new variant to the table
    const tableBody = document.getElementById("variantTableBody");
    const row = document.createElement("tr");
    row.setAttribute("data-index", variants.length - 1); 
    row.innerHTML = `<td>${color}</td>
             <td>${size}</td>
             <td>${stock}</td>
             <td>${regularPrice}</td>
             <td>${salePrice}</td>
             <td><button type="button" class="btn btn-danger btn-sm" onclick="removeVariant(${variants.length - 1})">Remove</button></td>`;
    tableBody.appendChild(row);

    // Clear input fields
    document.getElementById("variantColor").value = "";
    document.getElementById("variantSize").value = "";
    document.getElementById("variantStock").value = "";
    document.getElementById("variantRegularPrice").value = "";
    document.getElementById("variantSalePrice").value = "";
}
function viewImage1(event) {
    document.getElementById('imgView1').src = URL.createObjectURL(event.target.files[0])
}

function viewImage2(event) {
    document.getElementById('imgView2').src = URL.createObjectURL(event.target.files[0])
}


function viewImage3(event) {
    document.getElementById('imgView3').src = URL.createObjectURL(event.target.files[0])
}

function viewImage4(event) {
    document.getElementById('imgView4').src = URL.createObjectURL(event.target.files[0])
}

let cropperInstances = {}; 



function viewImage(event, index) {
let input = event.target;
let reader = new FileReader();

reader.onload = function () {
let dataURL = reader.result;
let image = document.getElementById('imgThumbnail' + index);
image.src = dataURL;

document.getElementById('thumbnailContainer' + index).style.display = 'block';
};
reader.readAsDataURL(input.files[0]);
}

// Remove Thumbnail
function removeThumbnail(index) {
// Hide the thumbnail container and reset the image source
document.getElementById('thumbnailContainer' + index).style.display = 'none';
document.getElementById('imgThumbnail' + index).src = '';
document.getElementById('input' + index).value = ''; // Clear the input field
}

// Open Crop Modal for a specific image input
function openCropModal(index) {
// Get the selected image for cropping
const imageSrc = document.getElementById('imgThumbnail' + index).src;
document.getElementById('cropImage').src = imageSrc;

// Show the crop modal
document.getElementById('cropModal').style.display = 'flex';

// Destroy any existing cropper instance for this index
if (cropperInstances[index]) {
cropperInstances[index].destroy();
}


cropperInstances[index] = new Cropper(document.getElementById('cropImage'), {
aspectRatio: 1,  
viewMode: 1,
guides: true,
background: false,
autoCropArea: 1,
zoomable: true,
});

// Save cropped image
document.getElementById('saveCropBtn').addEventListener('click', function () {
const croppedCanvas = cropperInstances[index].getCroppedCanvas();
const croppedImage = croppedCanvas.toDataURL('image/jpeg');

// Update the corresponding thumbnail with the cropped image
document.getElementById('imgThumbnail' + index).src = croppedImage;

// Optionally upload the cropped image
uploadCroppedImage(croppedCanvas, index);

// Close the modal after saving
closeCropModal();
});
}

// Upload the cropped image (optional, if needed)
function uploadCroppedImage(croppedCanvas, index) {
croppedCanvas.toBlob(function (blob) {
const formData = new FormData();
formData.append('image', blob, 'cropped-image-' + index + '.jpg');  // Unique filename

// Upload the cropped image to the server (if needed)
fetch('/admin/add-products', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Cropped image uploaded:', data);
})
.catch(error => {
    console.error('Error uploading cropped image:', error);
});
});
}

// Close Crop Modal and Cleanup
function closeCropModal() {
document.getElementById('cropModal').style.display = 'none';
document.getElementById('cropImage').src = ''; // Clear the modal image

// Clean up the cropper instance when closing the modal
Object.keys(cropperInstances).forEach(index => {
if (cropperInstances[index]) {
    cropperInstances[index].destroy();
    cropperInstances[index] = null;
}
});
}




function validateForm() {
    clearErrorMessages();
    const nameInput = document.getElementsByName('productName')[0];
    const name = nameInput.value.trim();
    const description = document.getElementById('descriptionid').value.trim();
    const offer = document.getElementById('productOffer').value.trim();
    const startDate = document.getElementById('offer_start').value;
    const endDate = document.getElementById('offer_end').value;

    let isValid = true;

    if (!name || !/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage('productName-error', 'Please enter a valid product name with alphabetic characters.');
        isValid = false;
    }

    if (description.length < 10) {
        displayErrorMessage('description-error', 'Description should be at least 10 characters.');
        isValid = false;
    }

    if (!offer || isNaN(offer) || offer <= 0 || offer > 100) {
        displayErrorMessage('productOffer-error', 'Offer should be a number between 1 and 100.');
        isValid = false;
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        displayErrorMessage('endDate-error', 'End date should be after start date.');
        isValid = false;
    }

    const imageInputs = ['input1', 'input2', 'input3', 'input4'];
    let imageUploaded = false;

    imageInputs.forEach(inputId => {
        const fileInput = document.getElementById(inputId);
        if (fileInput.files.length > 0) {
            imageUploaded = true;
        }
    });

    if (!imageUploaded) {
        displayErrorMessage('image-error', 'You should upload at least one image.');
        isValid = false;
    }

    return isValid;
}

// Add event listeners once
document.addEventListener("DOMContentLoaded", function () {
    document.getElementsByName('productName')[0].addEventListener('blur', validateForm);
    document.getElementById('descriptionid').addEventListener('blur', validateForm);
    document.getElementById('productOffer').addEventListener('blur', validateForm);
});


function displayErrorMessage(id, message) {
    const errorElement = document.getElementById(id);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display='block';
        errorElement.style.color = "red";
    }
}


function clearErrorMessages() {
    const errorElements = document.getElementsByClassName('error-message');
    Array.from(errorElements).forEach(element => {
        element.innerText = '';
        element.style.display = 'none';
    });
    const errorMessage = document.getElementById('errorMessage');
    // Clear image error message
    const imageErrorElement = document.getElementById('image-error');
    imageErrorElement.innerText = '';
    imageErrorElement.style.display = 'none';


}
