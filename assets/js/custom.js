(function ($) {
  $(document).ready(function () {
    // Mobil Nav active states
    $("body").addClass("js");
    var $menu = $("#menu"),
        $menulink = $(".menu-link");

    $menulink.click(function (e) {
      e.preventDefault();
      $menulink.toggleClass("active");
      $menu.toggleClass("active");
    });

    // Close menu when link is clicked
    $menu.find("a").click(function() {
      $menu.removeClass("active");
      $menulink.removeClass("active");
    });

    // Sleek Intersection Observer for Scroll Reveals
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            // Unobserve once revealed to maintain high graphics performance
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15, // Trigger when 15% of section is visible
        rootMargin: "0px 0px -50px 0px" // Slight offset for better timing
      });

      // Target reveal classes
      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
      });
    } else {
      // Fallback for older browsers
      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        el.classList.add('reveal-visible');
      });
    }
  });

  // Video Overlay trigger check
  if (typeof videoPopup === "function") {
    videoPopup();
  }

  // Premium Owl Carousel setup
  $(".owl-carousel").owlCarousel({
    loop: false,
    margin: 30,
    nav: true,
    autoplay: false,
    autoplayTimeout: 6000,
    autoplayHoverPause: true,
    responsive: {
      0: {
        items: 1,
      },
      768: {
        items: 2,
      },
      1024: {
        items: 3,
      },
      1300: {
        items: 4,
      }
    },
  });

  // Modern Slick Slider setup (Fallback/Banner slider check)
  if (typeof $.fn.slick === "function") {
    $(".Modern-Slider").slick({
      autoplay: true,
      autoplaySpeed: 10000,
      speed: 600,
      slidesToShow: 1,
      slidesToScroll: 1,
      pauseOnHover: false,
      dots: true,
      pauseOnDotsHover: true,
      cssEase: "fade",
      draggable: false,
      prevArrow: '<button class="PrevArrow"></button>',
      nextArrow: '<button class="NextArrow"></button>',
    });
  }

  // Keep old toggle support just in case, but styled in a modern visible grid
  $("div.features-post").on("click", function (e) {
    if ($(e.target).closest("a, button").length) return;
    // Optional slide for custom elements, styled perfectly in modern layout
  });

  // Initialize jQuery UI tabs
  if (typeof $.fn.tabs === "function") {
    $("#tabs").tabs();
  }
})(jQuery);
