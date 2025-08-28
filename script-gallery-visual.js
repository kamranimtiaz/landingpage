/**
 * Hotel Landing Page - Gallery and Visual Components
 * Main visual functionality for the landing page
 */

/******************************************************************************
 * CONFIGURATION CONSTANTS
 *****************************************************************************/
const SWIPER_ANIMATION_CONFIG = {
  speed: 700,
  on: {
    init: function () {
      this.slides.forEach((slide) => {
        slide.style.transitionTimingFunction = "cubic-bezier(0.34, 1.8, 0.64, 1)";
      });
    },
  },
};

/******************************************************************************
 * GALLERY DATA MANAGER
 *****************************************************************************/
class GalleryDataManager {
  constructor() {
    this.galleryDataScript = document.getElementById("gallery-data");
    this.domDataContainer = document.querySelector('[role="list"].w-dyn-items');
  }

  parseGalleryData() {
    // First try to parse from JSON script tag (fallback)
    if (this.galleryDataScript) {
      try {
        const jsonData = JSON.parse(this.galleryDataScript.textContent);
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          return jsonData;
        }
      } catch (error) {
        console.warn('Error parsing JSON gallery data:', error);
      }
    }

    // Parse from DOM structure (your actual implementation)
    return this.parseFromDOMStructure();
  }

  parseFromDOMStructure() {
    if (!this.domDataContainer) {
      console.warn('Gallery data DOM container not found');
      return [];
    }

    const galleryItems = this.domDataContainer.querySelectorAll('[data-topic-name]');
    const parsedData = [];

    galleryItems.forEach(item => {
      const topicName = item.getAttribute('data-topic-name');
      const galleryName = item.getAttribute('data-gallery-name');
      
      if (!topicName) return;

      const topicData = {
        topicname: topicName,
        galleryname: galleryName || topicName,
        images: { summer: [], winter: [] },
        heroImages: { summer: null, winter: null },
        quoteImages: { summer: null, winter: null }
      };

      // Parse images for each season
      const summerGallery = item.querySelector('[data-season="summer"] .w-dyn-items');
      const winterGallery = item.querySelector('[data-season="winter"] .w-dyn-items');

      if (summerGallery) {
        const summerImages = summerGallery.querySelectorAll('[data-img-url]');
        topicData.images.summer = Array.from(summerImages).map(img => 
          img.getAttribute('data-img-url')
        ).filter(Boolean);
      }

      if (winterGallery) {
        const winterImages = winterGallery.querySelectorAll('[data-img-url]');
        topicData.images.winter = Array.from(winterImages).map(img => 
          img.getAttribute('data-img-url')
        ).filter(Boolean);
      }

      // Parse hero and quote images
      const heroSummer = item.querySelector('[data-hero-summer-img]');
      const heroWinter = item.querySelector('[data-hero-winter-img]');
      const quoteSummer = item.querySelector('[data-quote-summer-img]');
      const quoteWinter = item.querySelector('[data-quote-winter-img]');

      if (heroSummer) {
        topicData.heroImages.summer = heroSummer.getAttribute('data-hero-summer-img');
      }
      if (heroWinter) {
        topicData.heroImages.winter = heroWinter.getAttribute('data-hero-winter-img');
      }
      if (quoteSummer) {
        topicData.quoteImages.summer = quoteSummer.getAttribute('data-quote-summer-img');
      }
      if (quoteWinter) {
        topicData.quoteImages.winter = quoteWinter.getAttribute('data-quote-winter-img');
      }

      parsedData.push(topicData);
    });

    console.log('Parsed gallery data from DOM:', parsedData);
    return parsedData;
  }

  getSeasonImages(topicName, season) {
    const data = this.parseGalleryData();
    const topic = data.find((topic) => topic.topicname === topicName);
    return topic ? topic.images[season] || [] : [];
  }

  getHeroImage(topicName, season) {
    const data = this.parseGalleryData();
    const topic = data.find((topic) => topic.topicname === topicName);
    return topic ? topic.heroImages[season] || null : null;
  }

  getQuoteImage(topicName, season) {
    const data = this.parseGalleryData();
    const topic = data.find((topic) => topic.topicname === topicName);
    return topic ? topic.quoteImages[season] || null : null;
  }

  getAllTopicImages(topicName, season) {
    const data = this.parseGalleryData();
    const topic = data.find((topic) => topic.topicname === topicName);

    if (!topic) return null;

    return {
      galleryImages: topic.images[season] || [],
      heroImage: topic.heroImages[season] || null,
      quoteImage: topic.quoteImages[season] || null,
    };
  }
}

/******************************************************************************
 * HERO IMAGE MANAGER
 *****************************************************************************/
class HeroImageManager {
  constructor(galleryDataManager, initialSeason = "summer") {
    this.galleryDataManager = galleryDataManager;
    this.currentSeason = initialSeason;
    this.heroImageElement = document.querySelector(".hero_img");
    this.currentTopic = null;
    this.hasLoadedInitialImage = false;
    this.imageCache = new Map();
    this.isTransitioning = false;
    
    this.topicToImageMap = this.buildTopicImageMap();
    this.initialize();
  }

  buildTopicImageMap() {
    const imageMap = {};
    const galleryData = this.galleryDataManager.parseGalleryData();
    
    galleryData.forEach((topic) => {
      const topicKey = topic.topicname.toLowerCase();
      const heroImage = topic.heroImages?.[this.currentSeason];
      if (heroImage) {
        imageMap[topicKey] = heroImage;
      }
    });
    
    return imageMap;
  }

  preloadAllImages() {
    Object.entries(this.topicToImageMap).forEach(([topic, imageUrl]) => {
      if (!this.imageCache.has(imageUrl)) {
        const image = new Image();
        image.src = imageUrl;
        image.onload = () => {
          this.imageCache.set(imageUrl, image);
        };
        image.onerror = () => {
          console.warn(`Failed to preload hero image: ${imageUrl}`);
        };
      }
    });
  }

  updateSeason(newSeason, currentTopic = null) {
    this.currentSeason = newSeason;
    this.topicToImageMap = this.buildTopicImageMap();
    this.preloadAllImages();

    if (!this.hasLoadedInitialImage) return;

    const topicToCheck = currentTopic || this.currentTopic;
    if (topicToCheck && this.topicToImageMap[topicToCheck.toLowerCase()]) {
      this.loadHeroImageForTopic(topicToCheck.toLowerCase(), true);
    }
  }

  initialize() {
    if (!this.heroImageElement) return;
    
    this.preloadAllImages();
    this.handleInitialTopicSelection();
    this.setupTopicChangeListener();
  }

  handleInitialTopicSelection() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTopic = urlParams.get("topic");
    
    if (urlTopic && this.topicToImageMap[urlTopic.toLowerCase()]) {
      this.loadHeroImageForTopic(urlTopic.toLowerCase());
      this.hasLoadedInitialImage = true;
      return;
    }

    // Try to find the first topic from parsed data
    const firstTopic = Object.keys(this.topicToImageMap)[0];
    if (firstTopic) {
      this.loadHeroImageForTopic(firstTopic);
      this.hasLoadedInitialImage = true;
      console.log('Loaded initial hero image for topic:', firstTopic);
    } else {
      console.warn('No hero images found in topic map:', this.topicToImageMap);
    }
  }

  setupTopicChangeListener() {
    document.addEventListener("topicChanged", (event) => {
      const selectedTopic = event.detail?.topic?.toLowerCase();
      this.currentTopic = selectedTopic;
      
      if (this.hasLoadedInitialImage && this.topicToImageMap[selectedTopic]) {
        this.loadHeroImageForTopic(selectedTopic, true);
      }
    });
    
    // Also listen for direct topic clicks if topics are already in DOM
    document.addEventListener("click", (event) => {
      const topicElement = event.target.closest("[data-topic], .topic_tab_trigger");
      if (topicElement) {
        const topicName = topicElement.getAttribute("data-topic") || 
                         topicElement.textContent?.trim();
        if (topicName) {
          this.currentTopic = topicName.toLowerCase();
          if (this.topicToImageMap[this.currentTopic]) {
            this.loadHeroImageForTopic(this.currentTopic, true);
          }
        }
      }
    });
  }

  loadHeroImageForTopic(topicKey, animated = false) {
    if (this.isTransitioning) return;
    
    const imageUrl = this.topicToImageMap[topicKey];
    if (!imageUrl || !this.heroImageElement) return;

    this.isTransitioning = true;

    if (this.imageCache.has(imageUrl)) {
      this.performImageTransition(imageUrl, animated);
    } else {
      const tempImage = new Image();
      tempImage.src = imageUrl;

      tempImage.onload = () => {
        this.imageCache.set(imageUrl, tempImage);
        this.performImageTransition(imageUrl, animated);
      };

      tempImage.onerror = () => {
        console.warn(`Failed to load hero image for topic: ${topicKey}`);
        this.isTransitioning = false;
        this.showHeroImage();
      };
    }
  }

  performImageTransition(imageUrl, animated) {
    if (!animated) {
      this.setImageDirectly(imageUrl);
      return;
    }

    this.heroImageElement.style.opacity = '0';
    
    setTimeout(() => {
      this.heroImageElement.classList.remove("scaleup");
      
      this.heroImageElement.removeAttribute("srcset");
      this.heroImageElement.removeAttribute("sizes");
      this.heroImageElement.src = imageUrl;
      
      void this.heroImageElement.offsetWidth;
      
      this.heroImageElement.classList.add("scaleup");
      this.heroImageElement.style.opacity = '1';
      
      this.isTransitioning = false;
    }, 200);
  }

  setImageDirectly(imageUrl) {
    this.heroImageElement.removeAttribute("srcset");
    this.heroImageElement.removeAttribute("sizes");
    this.heroImageElement.src = imageUrl;
    this.heroImageElement.style.opacity = '1';
    this.isTransitioning = false;
  }

  showHeroImage() {
    if (this.heroImageElement) {
      this.heroImageElement.style.visibility = "visible";
      if (!this.isTransitioning) {
        this.heroImageElement.style.opacity = "1";
      }
    }
  }

  getCurrentTopic() {
    return this.currentTopic;
  }
}

/******************************************************************************
 * TOPIC SWIPER MANAGER
 *****************************************************************************/
class TopicSwiperManager {
  constructor(galleryData) {
    this.galleryData = galleryData;
    this.swiper = null;
    this.swiperTriggers = [];
    this.tabItems = [];
    this.currentTopic = null;
    this.initialize();
  }

  createTopicTriggers() {
    // If no topic triggers exist, we can still work with the topic data
    // This method can be used to create missing UI elements if needed
    console.log('No topic triggers found, functionality will work with programmatic topic changes');
  }

  initialize() {
    this.setupDOMElements();
    this.initializeSwiper();
    this.setupEventListeners();
    this.setupDefaultTopic();
  }

  setupDOMElements() {
    // Look for various topic trigger selectors
    this.swiperTriggers = document.querySelectorAll(".topic_tab_trigger, [data-topic], .topic-tab, .tab-trigger");
    this.tabItems = document.querySelectorAll(".topic_tab_item, .tab-item, [data-topic-name]");
    
    console.log('Found topic triggers:', this.swiperTriggers.length);
    console.log('Found tab items:', this.tabItems.length);
    
    // If no triggers found, create them from gallery data
    if (this.swiperTriggers.length === 0) {
      this.createTopicTriggers();
    }
  }

  initializeSwiper() {
    // Look for existing topic swiper
    const swiperContainer = document.querySelector(".swiper.is-topic");
    
    if (swiperContainer) {
      this.swiper = new Swiper(".swiper.is-topic", {
        ...SWIPER_ANIMATION_CONFIG,
        slidesPerView: "auto",
        centeredSlides: false,
        spaceBetween: 0,
        allowTouchMove: true,
        simulateTouch: true,
        touchRatio: 1,
        threshold: 10,
        longSwipesRatio: 0.5,
        followFinger: true,
        grabCursor: true,
        on: {
          init: function() {
            this.slides.forEach((slide) => {
              slide.style.transitionTimingFunction = "cubic-bezier(0.34, 1.8, 0.64, 1)";
            });
          }
        }
      });
      console.log('Topic swiper initialized');
    } else {
      console.log('No topic swiper container found, topics will work without swiper');
    }
  }

  setupEventListeners() {
    this.swiperTriggers.forEach((trigger, index) => {
      trigger.addEventListener("click", () => {
        this.handleTopicSelection(index, trigger);
      });
    });
  }

  setupDefaultTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTopic = urlParams.get("topic");
    
    if (urlTopic) {
      const matchingTrigger = Array.from(this.swiperTriggers).find(
        trigger => trigger.getAttribute("data-topic") === urlTopic ||
                  trigger.textContent?.trim() === urlTopic
      );
      
      if (matchingTrigger) {
        const index = Array.from(this.swiperTriggers).indexOf(matchingTrigger);
        this.handleTopicSelection(index, matchingTrigger, true);
        return;
      }
    }

    // Default to first topic if available
    if (this.swiperTriggers.length > 0) {
      this.handleTopicSelection(0, this.swiperTriggers[0], true);
    } else if (this.galleryData.length > 0) {
      // If no triggers but we have data, manually trigger first topic
      this.dispatchTopicChangeEvent(this.galleryData[0].topicname);
    }
  }

  handleTopicSelection(index, trigger, shouldDispatchEvent = true) {
    this.updateActiveStates(index);
    this.updateSwiperSlide(index);
    
    const topicName = trigger.getAttribute("data-topic") || 
                     trigger.textContent?.trim() ||
                     (this.galleryData[index]?.topicname);
    
    this.currentTopic = topicName;
    console.log('Topic selected:', topicName);

    if (shouldDispatchEvent && topicName) {
      this.dispatchTopicChangeEvent(topicName);
    }
  }

  updateActiveStates(activeIndex) {
    this.swiperTriggers.forEach((trigger, index) => {
      const isActive = index === activeIndex;
      trigger.classList.toggle("is-active", isActive);
      trigger.setAttribute("aria-selected", isActive);
    });

    this.tabItems.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
    });
  }

  updateSwiperSlide(index) {
    if (this.swiper && this.swiper.slideTo) {
      this.swiper.slideTo(index, 700);
    } else {
      console.log('Swiper not available, topic change handled without swiper animation');
    }
  }

  dispatchTopicChangeEvent(topicName) {
    const topicData = this.galleryData.find(topic => topic.topicname === topicName);
    
    document.dispatchEvent(new CustomEvent("topicChanged", {
      detail: { topic: topicName, data: topicData }
    }));
  }

  getCurrentTopic() {
    return this.currentTopic;
  }
}

/******************************************************************************
 * GALLERY SYSTEM COMPONENTS
 *****************************************************************************/
class GalleryTabsRenderer {
  constructor(galleryData) {
    this.galleryData = galleryData;
    // Look for existing topic tabs in your structure
    this.existingTabs = document.querySelectorAll(".topic_tab_trigger, [data-topic]");
  }

  renderAllTabs() {
    // Since you likely have existing tabs, we'll enhance them instead of replacing
    console.log('Gallery tabs found:', this.existingTabs.length);
    
    // If no existing tabs found, try to create them
    if (this.existingTabs.length === 0) {
      this.createTabsFromData();
    } else {
      this.enhanceExistingTabs();
    }
  }

  createTabsFromData() {
    const tabTemplate = document.querySelector(".gallery_tabs-collection-item");
    const tabsContainer = tabTemplate?.parentElement;
    
    if (!tabTemplate || !tabsContainer) {
      console.warn('Gallery tabs template or container not found');
      return;
    }

    tabsContainer.innerHTML = "";

    this.galleryData.forEach((topic) => {
      const tabClone = tabTemplate.cloneNode(true);
      const textElement = tabClone.querySelector("p");
      
      if (textElement) {
        textElement.textContent = topic.galleryname;
        const topicSlug = this.createTopicSlug(topic.topicname);
        textElement.setAttribute("data-gallery-id", topicSlug);
        textElement.setAttribute("data-topic-target", topicSlug);
      }

      tabsContainer.appendChild(tabClone);
    });
  }

  enhanceExistingTabs() {
    // Add data attributes to existing tabs for filtering
    this.existingTabs.forEach((tab, index) => {
      const topicName = tab.getAttribute('data-topic') || 
                       tab.textContent?.trim() ||
                       (this.galleryData[index]?.topicname);
      
      if (topicName) {
        const topicSlug = this.createTopicSlug(topicName);
        tab.setAttribute("data-gallery-id", topicSlug);
        tab.setAttribute("data-topic-target", topicSlug);
      }
    });
  }

  createTopicSlug(topicName) {
    return topicName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}

class GalleryImageRenderer {
  constructor(galleryData, initialSeason = "summer") {
    this.galleryData = galleryData;
    this.currentSeason = initialSeason;
    this.domDataContainer = document.querySelector('[role="list"].w-dyn-items');
  }

  renderAllImages() {
    // Instead of replacing content, we'll show/hide based on current season
    this.updateSeasonVisibility();
  }

  updateSeason(newSeason) {
    this.currentSeason = newSeason;
    this.updateSeasonVisibility();
  }

  updateSeasonVisibility() {
    if (!this.domDataContainer) {
      console.warn('Gallery data container not found for season update');
      return;
    }

    // Hide all season galleries first
    const allSeasonGalleries = this.domDataContainer.querySelectorAll('[data-season]');
    allSeasonGalleries.forEach(gallery => {
      gallery.style.display = 'none';
    });

    // Show only current season galleries
    const currentSeasonGalleries = this.domDataContainer.querySelectorAll(`[data-season="${this.currentSeason}"]`);
    currentSeasonGalleries.forEach(gallery => {
      gallery.style.display = 'block';
    });

    console.log(`Updated gallery visibility for season: ${this.currentSeason}`);
    
    // Add data attributes to images for filtering
    this.addDataAttributesToImages();
  }

  addDataAttributesToImages() {
    this.galleryData.forEach((topic) => {
      const topicSlug = this.createTopicSlug(topic.topicname);
      const topicContainer = document.querySelector(`[data-topic-name="${topic.topicname}"]`);
      
      if (topicContainer) {
        const currentSeasonImages = topicContainer.querySelectorAll(`[data-season="${this.currentSeason}"] [data-img-url]`);
        currentSeasonImages.forEach(imageContainer => {
          imageContainer.setAttribute("data-gallery-id", topicSlug);
          imageContainer.setAttribute("data-topic", topic.topicname);
        });
      }
    });
  }

  createTopicSlug(topicName) {
    return topicName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}

class GallerySwiperManager {
  constructor() {
    this.gallerySwiper = null;
    this.currentVisibleImages = [];
    this.filterButtons = [];
    this.allTopicContainers = [];
    this.domDataContainer = document.querySelector('[role="list"].w-dyn-items');
    
    this.initialize();
  }

  initialize() {
    this.setupFilterButtons();
    this.cacheTopicContainers();
    this.setupFilterEventListeners();
    this.initializeSwiper();
  }

  setupFilterButtons() {
    // Look for existing filter buttons or topic triggers
    this.filterButtons = Array.from(document.querySelectorAll(
      ".gallery-filter-btn, [data-gallery-id], .topic_tab_trigger, [data-topic]"
    ));
    console.log('Found filter buttons:', this.filterButtons.length);
  }

  initializeSwiper() {
    // Look for existing swiper gallery
    const existingGallerySwiper = document.querySelector(".swiper.is-gallery");
    
    if (existingGallerySwiper) {
      this.gallerySwiper = new Swiper(".swiper.is-gallery", {
        ...SWIPER_ANIMATION_CONFIG,
        slidesPerView: 1,
        spaceBetween: 20,
        centeredSlides: true,
        loop: false,
        allowTouchMove: true,
        breakpoints: {
          768: {
            slidesPerView: 2,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 40,
          },
        },
      });
    } else {
      console.log('No gallery swiper container found');
    }
  }

  setupFilterEventListeners() {
    this.filterButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const galleryId = event.target.getAttribute("data-gallery-id") ||
                         event.target.getAttribute("data-topic-target") ||
                         event.target.getAttribute("data-topic") ||
                         this.createTopicSlug(event.target.textContent?.trim());
        
        if (galleryId) {
          this.filterGalleryByTopic(galleryId);
        }
      });
    });
  }

  cacheTopicContainers() {
    if (this.domDataContainer) {
      this.allTopicContainers = Array.from(
        this.domDataContainer.querySelectorAll('[data-topic-name]')
      );
    }
  }

  filterGalleryByTopic(topicId) {
    console.log('Filtering gallery by topic:', topicId);
    
    // Hide all topic containers
    this.allTopicContainers.forEach(container => {
      container.style.display = 'none';
    });

    // Show matching topic container
    const matchingContainers = this.allTopicContainers.filter(container => {
      const topicName = container.getAttribute('data-topic-name');
      const topicSlug = this.createTopicSlug(topicName);
      return topicSlug === topicId || topicName === topicId;
    });

    matchingContainers.forEach(container => {
      container.style.display = 'block';
    });

    // Update swiper if it exists
    if (this.gallerySwiper) {
      this.gallerySwiper.update();
      this.gallerySwiper.slideTo(0);
    }
  }

  createTopicSlug(topicName) {
    if (!topicName) return '';
    return topicName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}

class QuoteImageManager {
  constructor(galleryDataManager, initialSeason = "summer") {
    this.galleryDataManager = galleryDataManager;
    this.currentSeason = initialSeason;
    this.quoteImageElement = document.querySelector(".quote_img");
    this.currentTopic = null;
    this.imageCache = new Map();
    
    this.initialize();
  }

  initialize() {
    this.setupTopicChangeListener();
    this.preloadQuoteImages();
  }

  preloadQuoteImages() {
    const galleryData = this.galleryDataManager.parseGalleryData();
    
    galleryData.forEach((topic) => {
      const quoteImage = topic.quoteImages?.[this.currentSeason];
      if (quoteImage && !this.imageCache.has(quoteImage)) {
        const image = new Image();
        image.src = quoteImage;
        image.onload = () => this.imageCache.set(quoteImage, image);
        image.onerror = () => console.warn(`Failed to preload quote image: ${quoteImage}`);
      }
    });
  }

  setupTopicChangeListener() {
    document.addEventListener("topicChanged", (event) => {
      const topicName = event.detail?.topic;
      if (topicName) {
        this.updateQuoteImageForTopic(topicName);
      }
    });
  }

  updateQuoteImageForTopic(topicName) {
    const quoteImageUrl = this.galleryDataManager.getQuoteImage(topicName, this.currentSeason);
    
    if (quoteImageUrl && this.quoteImageElement) {
      this.quoteImageElement.src = quoteImageUrl;
      this.quoteImageElement.alt = `Quote image for ${topicName}`;
      console.log('Updated quote image for topic:', topicName, 'URL:', quoteImageUrl);
    } else {
      console.warn('Quote image element not found or no image URL for topic:', topicName);
      console.log('Quote element:', this.quoteImageElement);
      console.log('Quote URL:', quoteImageUrl);
    }
  }

  updateSeason(newSeason) {
    this.currentSeason = newSeason;
    this.preloadQuoteImages();
    
    if (this.currentTopic) {
      this.updateQuoteImageForTopic(this.currentTopic);
    }
  }

  setCurrentTopic(topicName) {
    this.currentTopic = topicName;
    this.updateQuoteImageForTopic(topicName);
  }
}

class SeasonSwitchManager {
  constructor() {
    this.seasonSwitches = document.querySelectorAll(".season-switch, [data-season]");
    this.currentSeason = "summer";
    
    this.initialize();
  }

  initialize() {
    this.setupSeasonSwitchListeners();
    this.setInitialSeason();
  }

  setupSeasonSwitchListeners() {
    this.seasonSwitches.forEach((switchElement) => {
      switchElement.addEventListener("click", (event) => {
        const newSeason = event.target.getAttribute("data-season") ||
                         event.target.getAttribute("data-season-target");
        
        if (newSeason && newSeason !== this.currentSeason) {
          this.switchToSeason(newSeason);
        }
      });
    });
  }

  setInitialSeason() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSeason = urlParams.get("season");
    
    if (urlSeason && ["summer", "winter", "spring", "autumn"].includes(urlSeason)) {
      this.switchToSeason(urlSeason);
    }
  }

  switchToSeason(newSeason) {
    this.currentSeason = newSeason;
    this.updateSeasonSwitchStates();
    this.dispatchSeasonChangeEvent();
  }

  updateSeasonSwitchStates() {
    this.seasonSwitches.forEach((switchElement) => {
      const season = switchElement.getAttribute("data-season") ||
                    switchElement.getAttribute("data-season-target");
      
      switchElement.classList.toggle("is-active", season === this.currentSeason);
    });
  }

  dispatchSeasonChangeEvent() {
    document.dispatchEvent(new CustomEvent("seasonChanged", {
      detail: { season: this.currentSeason }
    }));
  }

  getCurrentSeason() {
    return this.currentSeason;
  }
}

/******************************************************************************
 * ACCESSIBILITY HELPER
 *****************************************************************************/
class AccessibilityHelper {
  static setupSwiperTabsAccessibility() {
    const swiperWrappers = document.querySelectorAll(".swiper-wrapper.is-topic");
    
    swiperWrappers.forEach((wrapper) => {
      wrapper.setAttribute("role", "tablist");
      wrapper.setAttribute("aria-orientation", "horizontal");

      const slides = wrapper.querySelectorAll(".swiper-slide");
      slides.forEach((slide, index) => {
        const trigger = slide.querySelector(".topic_tab_trigger");
        if (trigger) {
          trigger.setAttribute("role", "tab");
          trigger.setAttribute("tabindex", index === 0 ? "0" : "-1");
          
          const isActive = trigger.classList.contains("is-active");
          trigger.setAttribute("aria-selected", isActive);
        }
      });
    });
  }

  static setupCarouselAccessibility(wrapperSelector, slideSelector) {
    const wrappers = document.querySelectorAll(wrapperSelector);
    if (wrappers.length === 0) return;

    wrappers.forEach((wrapper) => {
      if (wrapper.getAttribute("role") === "list" || !wrapper.getAttribute("role")) {
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-roledescription", "carousel");
      }

      const slides = wrapper.querySelectorAll(slideSelector);
      slides.forEach((slide) => {
        if (slide.getAttribute("role") !== "tab") {
          slide.setAttribute("role", "group");
          slide.setAttribute("aria-roledescription", "slide");
        }
      });
    });
  }

  static initializeAllAccessibilityFeatures() {
    this.setupSwiperTabsAccessibility();
    this.setupCarouselAccessibility(".swiper-wrapper:not(.is-topic)", '.swiper-slide:not([role="tab"])');
  }
}

/******************************************************************************
 * MAIN GALLERY APPLICATION CLASS
 *****************************************************************************/
class HotelGalleryApp {
  constructor() {
    this.galleryDataManager = new GalleryDataManager();
    this.heroImageManager = null;
    this.topicSwiperManager = null;
    this.galleryTabsRenderer = null;
    this.galleryImageRenderer = null;
    this.gallerySwiperManager = null;
    this.quoteImageManager = null;
    this.seasonSwitchManager = null;
  }

  initialize() {
    const galleryData = this.galleryDataManager.parseGalleryData();
    
    this.heroImageManager = new HeroImageManager(this.galleryDataManager);
    this.topicSwiperManager = new TopicSwiperManager(galleryData);
    
    // Gallery system components
    this.galleryTabsRenderer = new GalleryTabsRenderer(galleryData);
    this.galleryImageRenderer = new GalleryImageRenderer(galleryData);
    this.gallerySwiperManager = new GallerySwiperManager();
    this.quoteImageManager = new QuoteImageManager(this.galleryDataManager);
    this.seasonSwitchManager = new SeasonSwitchManager();
    
    // Initialize gallery rendering
    this.initializeGallerySystem();
    
    // Setup cross-component event listeners
    this.setupSeasonChangeListeners();
    
    this.initializeAccessibility();
    this.setupGlobalUtilities();
  }

  initializeGallerySystem() {
    this.galleryTabsRenderer.renderAllTabs();
    this.galleryImageRenderer.renderAllImages();
    
    // Trigger initial topic selection after a short delay
    setTimeout(() => {
      const firstTopic = this.galleryDataManager.parseGalleryData()[0];
      if (firstTopic) {
        console.log('Triggering initial topic:', firstTopic.topicname);
        this.topicSwiperManager.dispatchTopicChangeEvent(firstTopic.topicname);
      }
    }, 100);
  }

  setupSeasonChangeListeners() {
    document.addEventListener("seasonChanged", (event) => {
      const newSeason = event.detail?.season;
      if (newSeason) {
        console.log('Season changed to:', newSeason);
        this.heroImageManager.updateSeason(newSeason);
        this.galleryImageRenderer.updateSeason(newSeason);
        this.quoteImageManager.updateSeason(newSeason);
      }
    });
    
    // Listen for topic changes and update quote images
    document.addEventListener("topicChanged", (event) => {
      const topicName = event.detail?.topic;
      if (topicName) {
        console.log('Topic changed to:', topicName);
        this.quoteImageManager.setCurrentTopic(topicName);
      }
    });
  }

  initializeAccessibility() {
    AccessibilityHelper.initializeAllAccessibilityFeatures();
    
    setTimeout(() => {
      AccessibilityHelper.initializeAllAccessibilityFeatures();
    }, 1000);
  }

  setupGlobalUtilities() {
    // Expose gallery data manager for other components that might need it
    window.galleryDataManager = this.galleryDataManager;
    
    // Wait for translation functions to be available from forms-booking script
    if (typeof window.t === 'function') {
      console.log('Translation functions are available from forms-booking script');
    }
  }
}

/******************************************************************************
 * APPLICATION INITIALIZATION
 *****************************************************************************/
document.addEventListener("DOMContentLoaded", function() {
  const hotelGalleryApp = new HotelGalleryApp();
  hotelGalleryApp.initialize();
});