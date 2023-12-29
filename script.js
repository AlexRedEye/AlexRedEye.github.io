let currentIndex = 0;

    function showSlide(index) {
      const track = document.querySelector('.carousel-track');
      const items = document.querySelectorAll('.carousel-item');
      const itemWidth = items[0].offsetWidth;

      currentIndex = index;
      const newPosition = -currentIndex * itemWidth;
      track.style.transform = `translateX(${newPosition}px)`;
    }

    function nextSlide() {
      const items = document.querySelectorAll('.carousel-item');
      currentIndex = (currentIndex + 1) % items.length;
      showSlide(currentIndex);
    }

    function prevSlide() {
      const items = document.querySelectorAll('.carousel-item');
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      showSlide(currentIndex);
    }