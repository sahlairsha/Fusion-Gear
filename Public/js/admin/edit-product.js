function addVariant() {
    const variantIndex = document.querySelectorAll(".variant-row").length; 
    const variantContainer = document.getElementById("variant-container");

    // Create a new variant row
    const variantRow = document.createElement("div");
    variantRow.className = "variant-row d-flex align-items-center mb-3";
    variantRow.id = `variant-row-${variantIndex}`;

    variantRow.innerHTML = `
        <div class="me-3">
            <label for="variantColor${variantIndex}" class="form-label">Color</label>
            <input type="text" class="form-control" id="variantColor${variantIndex}" name="variants[${variantIndex}][color]">
        </div>
        <div class="me-3">
            <label for="variantSize${variantIndex}" class="form-label">Size</label>
            <input type="text" class="form-control" id="variantSize${variantIndex}" name="variants[${variantIndex}][size]">
        </div>
        <div class="me-3">
            <label for="variantStock${variantIndex}" class="form-label">Stock</label>
            <input type="number" class="form-control" id="variantStock${variantIndex}" name="variants[${variantIndex}][stock]">
        </div>
        <div class="me-3">
            <label for="variantRegularPrice${variantIndex}" class="form-label">Regular Price</label>
            <input type="number" class="form-control" id="variantRegularPrice${variantIndex}" name="variants[${variantIndex}][regularPrice]">
        </div>
        <div class="me-3">
            <label for="variantSalePrice${variantIndex}" class="form-label">Sale Price</label>
            <input type="number" class="form-control" id="variantSalePrice${variantIndex}" name="variants[${variantIndex}][salePrice]">
        </div>
        <button type="button" class="remove-variant" data-product-id="<%= product._id %>">X</button>
    `;

    variantContainer.appendChild(variantRow);
}

// Event delegation to handle removing a variant dynamically
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#variant-container").addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("remove-variant")) {
            const variantRow = event.target.closest(".variant-row");
            const productId = event.target.getAttribute("data-product-id");
            const variantIndex = variantRow.id.split("-")[1]; // Extract variant index

            // Restrict removal of the last variant
            const variantCount = document.querySelectorAll("#variant-container .variant-row").length;
           

            // Confirm before deletion
            Swal.fire({
                title: 'Are you sure?',
                text: 'You won’t be able to revert this!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, remove it!',
                cancelButtonText: 'Cancel',
            }).then((result) => {
                if (result.isConfirmed) {
                    // Send request to remove the variant
                    fetch(`/admin/remove-variant/${productId}/${variantIndex}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json"
                        },
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Remove the variant from UI
                                variantRow.remove();
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Removed!',
                                    text: 'Variant has been removed successfully.',
                                    confirmButtonText: 'Ok',
                                });
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: data.message || 'An error occurred.',
                                    confirmButtonText: 'Ok',
                                });
                            }
                        })
                        .catch(error => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Something went wrong while removing the variant.',
                                confirmButtonText: 'Ok',
                            });
                        });
                }
            });
        }
    });
});

// Function to validate and submit the form
function validateAndSubmit() {
    if (validateForm()) {
        document.forms[0].submit();
    }
}

// Form validation function
function validateForm() {
    clearErrorMessages();
    const name = document.getElementsByName('productName')[0].value;
    const description = document.getElementById('descriptionid').value;

    let isValid = true;

    // Product Name Validation
    if (name.trim() === "" || !/^[a-zA-Z\s]+$/.test(name)) {
        displayErrorMessage('productName-error', 'Please enter a valid product name with alphabetic characters.');
        isValid = false;
    }

    // Description Validation
    if (description.trim() === "" || description.trim().length < 10) {
        displayErrorMessage('description-error', 'Description should be at least 10 characters.');
        isValid = false;
    }

    // Category Validation
    if (category.trim() === "") {
        displayErrorMessage('category-error', 'Please select a category.');
        isValid = false;
    }

   
    return isValid;
}

// Function to display error messages
function displayErrorMessage(elementId, message) {
    let errorElement = document.getElementById(elementId);
    errorElement.innerText = message;
    errorElement.style.display = "block";
}

// Function to clear error messages
function clearErrorMessages() {
    const errorElements = document.getElementsByClassName('error-message');
    Array.from(errorElements).forEach(element => {
        element.innerText = '';
    });
    const errorMessage = document.getElementById('errorMessage');
}


function deleteSingleImage(imageId,productId){
        $.ajax({
            url:"/deleteImage",
            method : "POST",
            data : {
                imageNameToServer : imageId,
                productIdToServer : productId
            },
            success : ((response)=>{
                if(response.status === true){
                    window.location.reload()
                }
            })
        })
       }

// Image preview functionality
 let cropper1, cropper2, cropper3, cropper4;

function initializeCropper(imageElement, cropperInstance, saveButtonId, inputId, imgViewId) {
if (cropperInstance) {
    cropperInstance.destroy();
}

cropperInstance = new Cropper(imageElement, {
    aspectRatio: 1, // Set your desired aspect ratio
    viewMode: 1,
    autoCropArea: 0.8,
    responsive: true,
    checkCrossOrigin: false
});

document.getElementById(saveButtonId).addEventListener('click', function() {
    const croppedCanvas = cropperInstance.getCroppedCanvas();
    const croppedImage = document.getElementById(imgViewId);
    
    croppedImage.src = croppedCanvas.toDataURL('image/jpeg');
    
    // Convert canvas to Blob and update file input
    croppedCanvas.toBlob((blob) => {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.getElementById(inputId).files = dataTransfer.files;
    });

    // Hide cropper
    this.parentElement.style.display = 'none';
});

return cropperInstance;
}

function handleImageUpload(event, cropperNumber) {
const input = event.target;
const imageView = document.getElementById(`imgView${cropperNumber}`);
const cropperContainer = document.querySelector(`#croppedImg${cropperNumber}`).parentElement;
const saveButton = document.getElementById(`saveButton${cropperNumber}`);

if (input.files && input.files[0]) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        imageView.src = e.target.result;
        cropperContainer.style.display = 'flex';
        
        // Initialize cropper
        switch(cropperNumber) {
            case 1:
                cropper1 = initializeCropper(imageView, cropper1, 'saveButton1', 'input1', 'imgView1');
                break;
            case 2:
                cropper2 = initializeCropper(imageView, cropper2, 'saveButton2', 'input2', 'imgView2');
                break;
            case 3:
                cropper3 = initializeCropper(imageView, cropper3, 'saveButton3', 'input3', 'imgView3');
                break;
            case 4:
                cropper4 = initializeCropper(imageView, cropper4, 'saveButton4', 'input4', 'imgView4');
                break;
        }
    };
    
    reader.readAsDataURL(input.files[0]);
}
}

// Update your viewImage functions
function viewImage1(event) { handleImageUpload(event, 1); }
function viewImage2(event) { handleImageUpload(event, 2); }
function viewImage3(event) { handleImageUpload(event, 3); }
function viewImage4(event) { handleImageUpload(event, 4); }


const selectedImages = [];
document.getElementById("imageInput").addEventListener("change", handleFileSelect);

function handleFileSelect(event) {
    const addedImagesContainer = document.getElementById("addedImagesContainer");
    addedImagesContainer.innerHTML = "";
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        selectedImages.push(file);
        const thumbnail = document.createElement("div");
        thumbnail.classList.add("thumbnail");
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.alt = "thumbnail";
        img.style.width = "100px";
        img.style.height = "auto";
        const removeIcon = document.createElement("span");
        removeIcon.classList.add("remove-icon");
        removeIcon.innerHTML = "&times;";
        removeIcon.addEventListener("click", function () {
            const index = selectedImages.indexOf(file);
            if (index !== -1) {
                selectedImages.splice(index, 1);
            }
            thumbnail.remove();
        });
        thumbnail.appendChild(img);
        thumbnail.appendChild(removeIcon);
        addedImagesContainer.appendChild(thumbnail);
    }
};