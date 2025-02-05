document.addEventListener('DOMContentLoaded', function () {
    const editButtons = document.querySelectorAll('.edit-button');

    editButtons.forEach(button => {
        button.addEventListener('click', function () {
            const row = button.closest('tr');
            const nameCell = row.cells[2];
            const descriptionCell = row.cells[3];
            const discountCell = row.cells[4];
            const startDateCell = row.cells[5];
            const endDateCell = row.cells[6];

            const isEditable = nameCell.contentEditable === 'true';
            nameCell.contentEditable = !isEditable;
            descriptionCell.contentEditable = !isEditable;
            discountCell.contentEditable = !isEditable;
            startDateCell.contentEditable = !isEditable;
            endDateCell.contentEditable = !isEditable;

            if (isEditable) {
                const categoryId = row.getAttribute('data-category-id');
                const updatedName = nameCell.textContent.trim();
                const updatedDescription = descriptionCell.textContent.trim();
                const updatedDiscount = discountCell.textContent.trim();
                const updatedStartDate = startDateCell.textContent.trim();
                const updatedEndDate = endDateCell.textContent.trim();

                // Validation: Check if the fields are empty or only spaces
                if (updatedName === "" || updatedDescription === "") {
                    Swal.fire({
                        title: 'Error!',
                        text: 'Name and Description cannot be empty or spaces only.',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });

                    // Revert fields to non-editable mode and reset button text
                    nameCell.contentEditable = 'false';
                    descriptionCell.contentEditable = 'false';
                    button.textContent = "Edit";

                    return; // Exit without saving changes
                }

                // Make an AJAX request to update the category in the database
                fetch(`/admin/editcategory?id=${categoryId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: updatedName,
                        description: updatedDescription,
                        discount: updatedDiscount,
                        startDate: updatedStartDate,
                        endDate: updatedEndDate
                    }),
                })
                    .then(response => {
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error('Failed to save changes');
                    })
                    .then(updatedCategory => {
                        Swal.fire({
                            title: 'Success!',
                            text: 'Changes saved successfully!',
                            icon: 'success',
                            confirmButtonText: 'OK'
                        });

                        nameCell.contentEditable = 'false';
                        descriptionCell.contentEditable = 'false';
                        discountCell.contentEditable = 'false';
                        startDateCell.contentEditable = 'false';
                        endDateCell.contentEditable = 'false';

                        button.textContent = "Edit";
                    })
                    .catch(error => {
                        console.error(error);

                        Swal.fire({
                            title: 'Error!',
                            text: 'Error saving changes',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    });
            } else {
                button.textContent = "Save";
                nameCell.focus();
            }
        });
    });
});
