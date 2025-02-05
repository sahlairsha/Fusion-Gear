/*  ---------------------------------------------------
    Template Name: Male Fashion
    Description: Male Fashion - ecommerce teplate
    Author: Colorib
    Author URI: https://www.colorib.com/
    Version: 1.0
    Created: Colorib
---------------------------------------------------------  */

'use strict';

(function ($) {

    /*------------------
        Preloader
    --------------------*/
    $(window).on('load', function () {
        $(".loader").fadeOut();
        $("#preloder").delay(200).fadeOut("slow");

        /*------------------
            Gallery filter
        --------------------*/
        $('.filter__controls li').on('click', function () {
            $('.filter__controls li').removeClass('active');
            $(this).addClass('active');
        });
        if ($('.product__filter').length > 0) {
            var containerEl = document.querySelector('.product__filter');
            var mixer = mixitup(containerEl);
        }
    });

    /*------------------
        Background Set
    --------------------*/
    $('.set-bg').each(function () {
        var bg = $(this).data('setbg');
        $(this).css('background-image', 'url(' + bg + ')');
    });

    //Search Switch
    $(document).ready(function () {
        $('.search-switch').on('click', function (e) {
            e.preventDefault(); 
            $('.search-model').fadeIn(400);
        });
    
        $('.search-close-switch').on('click', function () {
            $('.search-model').fadeOut(400, function () {
                $('#search-input').val('');
            });
        });
    
        // Trigger search on Enter key
        $('#search-input').on('keypress', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                performSearch();
            }
        });
    
        // Click event for search button
        $('#search-button').on('click', function (e) {
            e.preventDefault();
            performSearch();
        });
    
        function performSearch() {
            let searchTerm = $('#search-input').val().trim();
         
    
            if (searchTerm) {
                let searchURL = `/products?search=${encodeURIComponent(searchTerm)}`;
              
                window.location.href = searchURL;
            } else {
                console.log("No search term entered."); // Debugging for empty input
            }
        }
    });
    
    
    /*------------------
		Navigation
	--------------------*/
    $(".mobile-menu").slicknav({
        prependTo: '#mobile-menu-wrap',
        allowParentLinks: true
    });

    /*------------------
        Accordin Active
    --------------------*/
    $('.collapse').on('shown.bs.collapse', function () {
        $(this).prev().addClass('active');
    });

    $('.collapse').on('hidden.bs.collapse', function () {
        $(this).prev().removeClass('active');
    });

    //Canvas Menu
    $(".canvas__open").on('click', function () {
        $(".offcanvas-menu-wrapper").addClass("active");
        $(".offcanvas-menu-overlay").addClass("active");
    });

    $(".offcanvas-menu-overlay").on('click', function () {
        $(".offcanvas-menu-wrapper").removeClass("active");
        $(".offcanvas-menu-overlay").removeClass("active");
    });

    /*-----------------------
        Hero Slider
    ------------------------*/
    $(document).ready(function(){
        function initOwlCarousel() {
            if ($(window).width() <= 767) {
                $(".hero__slider").owlCarousel({
                    loop: true,
                    margin: 0,
                    items: 1,
                    dots: false,
                    nav: false,   // Hide navigation buttons
                    animateOut: 'fadeOut',
                    animateIn: 'fadeIn',
                    smartSpeed: 1200,
                    autoHeight: false,
                    autoplay: true,  // Enable auto-scroll
                    autoplayTimeout: 4000, // Change slide every 4 seconds
                    autoplayHoverPause: false
                });
            } else {
                $(".hero__slider").owlCarousel({
                    loop: true,
                    margin: 0,
                    items: 1,
                    dots: false,
                    nav: true,   // Show navigation buttons for larger screens
                    navText:[ "<span class='arrow_left'><span/>", "<span class='arrow_right'><span/>"],
                    animateOut: 'fadeOut',
                    animateIn: 'fadeIn',
                    smartSpeed: 1200,
                    autoHeight: false,
                    autoplay: false  // Disable auto-scroll for larger screens
                });
            }
        }
    
        initOwlCarousel();
    
        // Reinitialize when window resizes
        $(window).resize(function() {
            $(".hero__slider").trigger('destroy.owl.carousel'); // Destroy current instance
            initOwlCarousel(); // Reinitialize based on screen size
        });
    });
    

    /*--------------------------
        Select
    ----------------------------*/
    $("select").niceSelect();

    /*-------------------
		Radio Btn
	--------------------- */
    $(".product__color__select label, .shop__sidebar__size label, .product__details__option__size label").on('click', function () {
        $(".product__color__select label, .shop__sidebar__size label, .product__details__option__size label").removeClass('active');
        $(this).addClass('active');
    });

    /*-------------------
		Scroll
	--------------------- */
    $(".nice-scroll").niceScroll({
        cursorcolor: "#0d0d0d",
        cursorwidth: "5px",
        background: "#e5e5e5",
        cursorborder: "",
        autohidemode: true,
        horizrailenabled: false
    });

    
    /*------------------
		Magnific
	--------------------*/
    $('.video-popup').magnificPopup({
        type: 'iframe'
    });

    /*------------------
        Achieve Counter
    --------------------*/
    $('.cn_num').each(function () {
        $(this).prop('Counter', 0).animate({
            Counter: $(this).text()
        }, {
            duration: 4000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

})(jQuery);