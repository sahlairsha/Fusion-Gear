const imageContainers = document.querySelectorAll('.product__details__pic__item');
const images = document.querySelectorAll('.product-image');

imageContainers.forEach((imageContainer, index) => {
    const image = images[index]; // Match the image to the container
    imageContainer.addEventListener('mousemove', (event) => {
        const rect = imageContainer.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 100;
        const y = (event.clientY - rect.top) / rect.height * 100;

        image.style.transformOrigin = `${x}% ${y}%`;
        image.style.transform = 'scale(1.5)';
    });

    imageContainer.addEventListener('mouseleave', () => {
        image.style.transform = 'scale(1)';
        image.style.transformOrigin = 'center center';
    });
});