$(document).ready(function(){
    const iconPaths = [
        'https://cdn-icons-png.flaticon.com/128/2901/2901131.png', // Replace with your icon URLs
        'https://cdn-icons-png.flaticon.com/128/5111/5111178.png',
        'https://cdn-icons-png.flaticon.com/128/5853/5853827.png',
        'https://cdn-icons-png.flaticon.com/128/6181/6181673.png',
        'https://cdn-icons-png.flaticon.com/128/6895/6895356.png',
        'https://cdn-icons-png.flaticon.com/128/3873/3873823.png',
        'https://cdn-icons-png.flaticon.com/128/1828/1828884.png'
    ];

    const container = $('#floatingIconsContainer');

    function createIconElement(src) {
        const icon = $('<img>').attr('src', src).addClass('icon');
        icon.css({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 20 + 10}s infinite ease-in-out`
        });
        return icon;
    }

    iconPaths.forEach(path => {
        const iconElement = createIconElement(path);
        container.append(iconElement);
    });

    // CSS keyframes for floating effect
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            @keyframes float {
                0% {
                    transform: translateY(0) translateX(0);
                }
                50% {
                    transform: translateY(-50px) translateX(50px);
                }
                100% {
                    transform: translateY(0) translateX(0);
                }
            }
        `).appendTo('head');
});