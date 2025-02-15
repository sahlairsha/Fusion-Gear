const modal = document.getElementById('modal');
const overlay = document.getElementById('overlay');
const modalHeader = document.getElementById('modalHeader');
const stockInput = document.getElementById('stockInput');
const productTable = document.getElementById('productTable');
let productId = '';
let variantId = '';
let actionType = '';

function openModal(type, prodId, varId) {
    actionType = type;
    productId = prodId;
    variantId = varId;

    modalHeader.innerText = type === 'add' ? 'Add Stock' : 'Reduce Stock';

    modal.classList.add('active');
    overlay.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    overlay.classList.remove('active');
}

async function submitStockChange() {
    const stock = parseInt(stockInput.value, 10);
    if (isNaN(stock) || stock <= 0) {
        Swal.fire({
            title: 'Error',
            text: 'Please enter a valid quantity.',
            icon: 'warning',
            confirmButtonText: 'Okay'
        });
        return;
    }

    const actionUrl = actionType === 'add'
        ? `/stock/add/${productId}/${variantId}`
        : `/stock/reduce/${productId}/${variantId}`;

    try {
        const response = await fetch(actionUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ stock })
        });

        const data = await response.json();
        if (response.ok) {
            Swal.fire({
                title: 'Success',
                text: `${data.message || 'Stock updated successfully'}`,
                icon: 'success',
                confirmButtonText: 'Okay'
            });
            closeModal();
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            Swal.fire({
                title: 'Error',
                text: `${data.error || 'Failed to update stock'}`,
                icon: 'error',
                confirmButtonText: 'Okay'
            });
        }
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: 'An error occurred while updating stock.',
            icon: 'error',
            confirmButtonText: 'Okay'
        });
        console.error('Error:', error);
    }
}

function filterProducts() {
    const searchValue = document.getElementById('searchProduct').value.toLowerCase();
    const categoryValue = document.getElementById('categoryFilter').value;

    [...productTable.children].forEach(row => {
        const productName = row.querySelector('td:first-child').innerText.toLowerCase();
        const categoryId = row.getAttribute('data-category-id');

        const matchesSearch = productName.includes(searchValue);
        const matchesCategory = !categoryValue || categoryId === categoryValue;

        row.style.display = matchesSearch && matchesCategory ? '' : 'none';
    });
}




// Get references to the search input, category dropdown, and the table body
const searchInput = document.getElementById('searchProduct');
const categorySelect = document.getElementById('categoryFilter');


// Function to filter products based on product name and selected category
function filterProducts() {
  // Get the search term and convert it to lowercase for case-insensitive matching
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  // Get the selected category ID; if none is selected, use an empty string (which means "all")
  const selectedCategory = categorySelect.value;
  
  // Get all rows from the product table
  const rows = productTable.querySelectorAll('tr');
  
  rows.forEach(row => {

    const productName = row.querySelector('td:first-child').innerText.toLowerCase();
    

    const rowCategoryId = row.getAttribute('data-category-id') || "";

    const matchesSearch = productName.includes(searchTerm);
    

    const matchesCategory = (selectedCategory === "" || rowCategoryId === selectedCategory);
    

    row.style.display = (matchesSearch && matchesCategory) ? "" : "none";
  });
}

searchInput.addEventListener('input', filterProducts);
categorySelect.addEventListener('change', filterProducts);
