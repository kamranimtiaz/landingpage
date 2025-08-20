/**
 * Hotel Landing Page Application
 * Refactored for better organization and maintainability
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

const TRANSLATION_CONFIG = {
  de: {
    selectDates: 'Datum auswählen',
    adults: { one: '{n} Erwachsener', other: '{n} Erwachsene' },
    children: { one: '{n} Kind', other: '{n} Kinder' },
    nights: { one: '{n} Übernachtung', other: '{n} Übernachtungen' },
    nightsSuffix: ' — klingt nach einer guten Auszeit!'
  },
  en: {
    selectDates: 'Select dates',
    adults: { one: '{n} adult', other: '{n} adults' },
    children: { one: '{n} child', other: '{n} children' },
    nights: { one: '{n} night', other: '{n} nights' },
    nightsSuffix: ' — sounds like a great getaway!'
  },
  it: {
    selectDates: 'Seleziona le date',
    adults: { one: '{n} adulto', other: '{n} adulti' },
    children: { one: '{n} bambino', other: '{n} bambini' },
    nights: { one: '{n} notte', other: '{n} notti' },
    nightsSuffix: ' — sembra una bella pausa!'
  },
  fr: {
    selectDates: 'Sélectionner les dates',
    adults: { one: '{n} adulte', other: '{n} adultes' },
    children: { one: '{n} enfant', other: '{n} enfants' },
    nights: { one: '{n} nuit', other: '{n} nuits' },
    nightsSuffix: ' — ça ressemble à une belle escapade !'
  }
};

/******************************************************************************
 * LOCALIZATION MODULE
 *****************************************************************************/
class LocalizationManager {
  constructor() {
    this.pluralRulesCache = new Map();
    this.initializeFlatpickrLocales();
  }

  getCurrentLocale() {
    const htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (htmlLang) return htmlLang.split('-')[0];
    
    const bodyLocale = (document.body && document.body.getAttribute('data-locale')) || '';
    if (bodyLocale) return bodyLocale.toLowerCase().split('-')[0];
    
    const navigatorLanguage = (navigator.language || 'de').toLowerCase();
    return navigatorLanguage.split('-')[0];
  }

  translate(translationKey) {
    const currentLocale = this.getCurrentLocale();
    const translations = TRANSLATION_CONFIG[currentLocale] || TRANSLATION_CONFIG.de;
    return translations[translationKey] || TRANSLATION_CONFIG.de[translationKey] || '';
  }

  translateWithCount(nounKey, count) {
    const currentLocale = this.getCurrentLocale();
    const translations = TRANSLATION_CONFIG[currentLocale] || TRANSLATION_CONFIG.de;
    const pluralForms = translations[nounKey] || TRANSLATION_CONFIG.de[nounKey];
    
    let pluralRules = this.pluralRulesCache.get(currentLocale);
    if (!pluralRules) {
      try {
        pluralRules = new Intl.PluralRules(currentLocale);
      } catch (e) {
        pluralRules = new Intl.PluralRules('en');
      }
      this.pluralRulesCache.set(currentLocale, pluralRules);
    }

    let category;
    try {
      category = pluralRules.select(count);
    } catch {
      category = count === 1 ? 'one' : 'other';
    }

    const template = pluralForms[category] || pluralForms.other;
    return template.replace('{n}', String(count));
  }

  generatePersonsSummary(adultsCount, childrenCount) {
    return this.translateWithCount('adults', adultsCount) + ', ' + 
           this.translateWithCount('children', childrenCount);
  }

  initializeFlatpickrLocales() {
    if (!window.flatpickr || !window.flatpickr.l10ns) return;
    
    const locales = window.flatpickr.l10ns;
    
    this.setupFrenchLocale(locales);
    this.setupItalianLocale(locales);
  }

  setupFrenchLocale(locales) {
    if (!locales.fr) {
      locales.fr = {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
          longhand: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
        },
        months: {
          shorthand: ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
          longhand: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
        },
        rangeSeparator: " au ",
        weekAbbreviation: "Sem",
        scrollTitle: "Défiler pour augmenter",
        toggleTitle: "Cliquer pour basculer",
      };
    }
  }

  setupItalianLocale(locales) {
    if (!locales.it) {
      locales.it = {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
          longhand: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"]
        },
        months: {
          shorthand: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
          longhand: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"]
        },
        rangeSeparator: " al ",
        weekAbbreviation: "Sett",
        scrollTitle: "Scorrere per aumentare",
        toggleTitle: "Fare clic per cambiare",
      };
    }
  }
}

/******************************************************************************
 * GALLERY DATA MANAGER
 *****************************************************************************/
class GalleryDataManager {
  constructor() {
    this.galleryDataScript = document.getElementById("gallery-data");
  }

  parseGalleryData() {
    if (!this.galleryDataScript) {
      console.warn('Gallery data script element not found');
      return [];
    }

    try {
      const jsonData = JSON.parse(this.galleryDataScript.textContent);
      return Array.isArray(jsonData) ? jsonData : [];
    } catch (error) {
      console.error('Error parsing gallery data:', error);
      return [];
    }
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

    const firstTopic = Object.keys(this.topicToImageMap)[0];
    if (firstTopic) {
      this.loadHeroImageForTopic(firstTopic);
      this.hasLoadedInitialImage = true;
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

  initialize() {
    this.setupDOMElements();
    this.initializeSwiper();
    this.setupEventListeners();
    this.setupDefaultTopic();
  }

  setupDOMElements() {
    this.swiperTriggers = document.querySelectorAll(".topic_tab_trigger");
    this.tabItems = document.querySelectorAll(".topic_tab_item");
  }

  initializeSwiper() {
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
        trigger => trigger.getAttribute("data-topic") === urlTopic
      );
      
      if (matchingTrigger) {
        const index = Array.from(this.swiperTriggers).indexOf(matchingTrigger);
        this.handleTopicSelection(index, matchingTrigger, false);
        return;
      }
    }

    if (this.swiperTriggers.length > 0) {
      this.handleTopicSelection(0, this.swiperTriggers[0], false);
    }
  }

  handleTopicSelection(index, trigger, shouldDispatchEvent = true) {
    this.updateActiveStates(index);
    this.updateSwiperSlide(index);
    
    const topicName = trigger.getAttribute("data-topic");
    this.currentTopic = topicName;

    if (shouldDispatchEvent) {
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
 * GALLERY SYSTEM COMPONENTS
 *****************************************************************************/
class GalleryTabsRenderer {
  constructor(galleryData) {
    this.galleryData = galleryData;
    this.tabTemplate = document.querySelector(".gallery_tabs-collection-item")?.cloneNode(true);
    this.tabsContainer = document.querySelector(".gallery_tabs-collection-item")?.parentElement;
  }

  renderAllTabs() {
    if (!this.tabTemplate || !this.tabsContainer) return;

    this.tabsContainer.innerHTML = "";

    this.galleryData.forEach((topic) => {
      const tabClone = this.tabTemplate.cloneNode(true);
      const textElement = tabClone.querySelector("p");
      
      if (textElement) {
        textElement.textContent = topic.galleryname;
        const topicSlug = this.createTopicSlug(topic.topicname);
        textElement.setAttribute("data-gallery-id", topicSlug);
        textElement.setAttribute("data-topic-target", topicSlug);
      }

      this.tabsContainer.appendChild(tabClone);
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
    this.imageTemplate = document.querySelector(".swiper-slide.is-gallery")?.cloneNode(true);
    this.imagesContainer = document.querySelector(".swiper-slide.is-gallery")?.parentElement;
  }

  renderAllImages() {
    if (!this.imagesContainer || !this.imageTemplate) return;

    this.imagesContainer.innerHTML = "";

    this.galleryData.forEach((topic) => {
      const topicImages = topic.images[this.currentSeason] || [];
      
      topicImages.forEach((imageUrl) => {
        const imageClone = this.imageTemplate.cloneNode(true);
        const imageElement = imageClone.querySelector("img");
        
        if (imageElement) {
          imageElement.src = imageUrl;
          imageElement.alt = `${topic.topicname} gallery image`;
          imageElement.setAttribute("data-gallery-id", this.createTopicSlug(topic.topicname));
        }

        this.imagesContainer.appendChild(imageClone);
      });
    });
  }

  updateSeason(newSeason) {
    this.currentSeason = newSeason;
    this.renderAllImages();
  }

  createTopicSlug(topicName) {
    return topicName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}

class GallerySwiperManager {
  constructor() {
    this.gallerySwiper = null;
    this.currentVisibleImages = [];
    this.filterButtons = document.querySelectorAll(".gallery-filter-btn, [data-gallery-id]");
    this.allSlides = [];
    
    this.initialize();
  }

  initialize() {
    this.initializeSwiper();
    this.setupFilterEventListeners();
    this.cacheAllSlides();
  }

  initializeSwiper() {
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
  }

  setupFilterEventListeners() {
    this.filterButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const galleryId = event.target.getAttribute("data-gallery-id") ||
                         event.target.getAttribute("data-topic-target");
        
        if (galleryId) {
          this.filterGalleryByTopic(galleryId);
        }
      });
    });
  }

  cacheAllSlides() {
    this.allSlides = Array.from(document.querySelectorAll(".swiper-slide.is-gallery"));
  }

  filterGalleryByTopic(topicId) {
    const filteredSlides = this.allSlides.filter((slide) => {
      const image = slide.querySelector("img");
      return image && image.getAttribute("data-gallery-id") === topicId;
    });

    this.updateSwiperWithFilteredSlides(filteredSlides);
  }

  updateSwiperWithFilteredSlides(slides) {
    if (!this.gallerySwiper) return;

    this.allSlides.forEach(slide => slide.style.display = "none");
    slides.forEach(slide => slide.style.display = "block");

    this.gallerySwiper.update();
    this.gallerySwiper.slideTo(0);
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
    }
  }

  updateSeason(newSeason) {
    this.currentSeason = newSeason;
    this.preloadQuoteImages();
    
    if (this.currentTopic) {
      this.updateQuoteImageForTopic(this.currentTopic);
    }
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
 * BOOKING FORM MANAGER
 *****************************************************************************/
class BookingFormManager {
  constructor(localizationManager) {
    this.localizationManager = localizationManager;
    this.heroSelectedDates = [];
    this.heroAdultsCount = 2;
    this.heroChildrenCount = 0;
    this.formAdultsCount = 2;
    this.formChildrenCount = 0;
    this.formDateInstance = null;
    
    this.initialize();
  }

  initialize() {
    this.setupChildAgeManagement();
    this.setupDatePicker();
    this.setupPersonSelector();
  }

  updateChildAgeItems(childCount) {
    const wrapper = document.querySelector('[data-child-age-element]');
    if (!wrapper) return;
    
    const items = wrapper.querySelectorAll('[data-child-age-item]');
    const count = Math.max(0, Math.min(childCount || 0, items.length));
    
    // Wrapper visibility
    if (count > 0) {
      wrapper.style.display = 'block';
      wrapper.setAttribute('aria-hidden', 'false');
    } else {
      wrapper.style.display = 'none';
      wrapper.setAttribute('aria-hidden', 'true');
    }
    
    items.forEach((item, index) => {
      const shouldShow = index < count;
      const inputs = item.querySelectorAll('input, select, textarea');
      
      if (shouldShow) {
        item.style.display = 'block';
        item.setAttribute('aria-hidden', 'false');
        
        inputs.forEach((input) => {
          if (input.dataset.originalName && !input.name) {
            input.name = input.dataset.originalName;
          }
          input.disabled = false;
        });
        
        item.setAttribute('data-required', '');
      } else {
        item.style.display = 'none';
        item.setAttribute('aria-hidden', 'true');
        item.removeAttribute('data-required');
        
        inputs.forEach((input) => {
          if (!input.dataset.originalName) {
            input.dataset.originalName = input.getAttribute('name') || '';
          }
          input.value = '';
          input.disabled = true;
          input.removeAttribute('name');
        });
      }
    });
  }

  getMaxChildrenSelectable() {
    const wrapper = document.querySelector('[data-child-age-element]');
    if (!wrapper) return Infinity;
    
    const items = wrapper.querySelectorAll('[data-child-age-item]');
    const length = items ? items.length : 0;
    return length > 0 ? length : Infinity;
  }

  clampChildrenCount(value) {
    const max = this.getMaxChildrenSelectable();
    let clampedValue = typeof value === 'number' ? value : 0;
    
    if (clampedValue < 0) clampedValue = 0;
    if (max !== Infinity && clampedValue > max) clampedValue = max;
    
    return clampedValue;
  }

  updateChildPlusMinusState(wrapperElement, currentCount) {
    if (!wrapperElement) return;
    
    const minusButton = wrapperElement.querySelector('[data-controls="minus"]');
    const plusButton = wrapperElement.querySelector('[data-controls="plus"]');
    
    if (minusButton) {
      minusButton.classList.toggle('is-disabled', currentCount === 0);
    }
    
    const max = this.getMaxChildrenSelectable();
    if (plusButton) {
      plusButton.classList.toggle('is-disabled', max !== Infinity && currentCount >= max);
    }
  }

  formatFancyDateRange(selectedDates, instance) {
    if (!selectedDates || selectedDates.length < 1) return "";
    
    return selectedDates
      .map(date => instance.formatDate(date, instance.config.dateFormat))
      .join(" bis ");
  }

  formatTechnicalDateRange(selectedDates) {
    if (!selectedDates || selectedDates.length < 1) return "";
    
    return selectedDates
      .map(date => {
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
      })
      .join(" - ");
  }

  updateNightsDisplay(selectedDates) {
    const nightsElement = document.querySelector("[data-summary-nights]");
    const container = nightsElement?.closest(".form_picker-nights-wrapper");

    if (!nightsElement || !container) return;

    if (!selectedDates || selectedDates.length < 2) {
      container.style.visibility = "hidden";
      return;
    }

    const dayDifference = Math.round((selectedDates[1] - selectedDates[0]) / 86400000);
    const nights = dayDifference < 1 ? 1 : dayDifference;
    container.style.visibility = "visible";

    const nightsLabel = this.localizationManager.translateWithCount('nights', nights);
    nightsElement.textContent = nightsLabel;
    
    const suffixElement = container.querySelector('[data-summary-nights-suffix]') || 
                         container.querySelector('em');
    if (suffixElement) {
      suffixElement.textContent = this.localizationManager.translate('nightsSuffix');
    }
  }

  resolveFlatpickrLocale() {
    if (!window.flatpickr || !window.flatpickr.l10ns) return 'default';
    
    const currentLocale = this.localizationManager.getCurrentLocale();
    const availableLocales = window.flatpickr.l10ns;
    
    if (availableLocales[currentLocale]) {
      return currentLocale;
    }
    
    return 'default';
  }

  setupChildAgeManagement() {
    // This will be called when children count changes
    document.addEventListener('childrenCountChanged', (event) => {
      this.updateChildAgeItems(event.detail.count);
    });
  }

  setupDatePicker() {
    if (window.innerWidth < 992) return;
    
    setTimeout(() => {
      const pickerComponent = document.querySelector(".picker_component");
      if (pickerComponent) {
        pickerComponent.classList.add("show");
      }

      const datePicker = flatpickr(".picker_date", {
        mode: "range",
        dateFormat: "D., d. M.",
        minDate: "today",
        locale: this.resolveFlatpickrLocale(),
        static: true,
        position: "above",
        onReady: (selectedDates, dateStr, instance) => {
          const calendar = instance.calendarContainer;
          if (calendar) {
            calendar.classList.add("picker_initial-position");
            const extraInputs = calendar.querySelectorAll("input[name^='field']");
            extraInputs.forEach(input => input.removeAttribute("name"));
          }
        },
        onChange: (selectedDates, dateStr, instance) => {
          this.heroSelectedDates = selectedDates;
          const heroTextElement = document.querySelector('[data-picker="date-text"]');
          
          if (heroTextElement) {
            const displayText = dateStr || this.localizationManager.translate('selectDates');
            
            if (heroTextElement.value !== undefined) {
              heroTextElement.value = displayText;
            } else {
              heroTextElement.textContent = displayText;
            }
          }
        },
      });
    }, 100);
  }

  setupPersonSelector() {
    const pickerTrigger = document.querySelector('[data-open-popup-persons=""]');
    const pickerPopup = document.querySelector('[data-popup-persons=""]');
    const pickerText = document.querySelector('[data-picker="persons-text"]');
    const closeButton = pickerPopup?.querySelector('[data-custom="submit-person"]');
    const controls = pickerPopup?.querySelectorAll("[data-controls]");

    if (!pickerTrigger || !pickerPopup || !closeButton || !controls) return;

    // Open popup
    pickerTrigger.addEventListener("click", () => {
      if (pickerPopup.getAttribute("aria-hidden") === "true") {
        this.openPersonsPopup(pickerPopup, pickerTrigger);
      }
    });

    // Close popup
    closeButton.addEventListener("click", () => {
      this.closePersonsPopup(pickerPopup, pickerTrigger, pickerText);
    });

    // Click outside to close
    document.addEventListener("click", (event) => {
      if (!pickerPopup.contains(event.target) && event.target !== pickerTrigger) {
        if (pickerPopup.getAttribute("aria-hidden") === "false") {
          this.closePersonsPopup(pickerPopup, pickerTrigger, pickerText);
        }
      }
    });

    // Setup counter controls
    this.setupCounterControls(controls);
  }

  openPersonsPopup(popup, trigger) {
    popup.style.display = "block";
    popup.style.opacity = 0;

    requestAnimationFrame(() => {
      popup.style.opacity = 1;
      popup.setAttribute("aria-hidden", "false");
      trigger.setAttribute("aria-expanded", "true");
    });
  }

  closePersonsPopup(popup, trigger, textElement) {
    const focusedElement = document.activeElement;
    if (focusedElement && popup.contains(focusedElement)) {
      focusedElement.blur();
    }

    trigger.setAttribute("aria-expanded", "false");
    popup.style.opacity = 0;

    setTimeout(() => {
      popup.style.display = "none";
      popup.setAttribute("aria-hidden", "true");
    }, 300);

    if (textElement) {
      const summaryText = this.localizationManager.generatePersonsSummary(
        this.heroAdultsCount, 
        this.heroChildrenCount
      );
      
      if (textElement.value !== undefined) {
        textElement.value = summaryText;
      } else {
        textElement.textContent = summaryText;
      }
    }
  }

  setupCounterControls(controls) {
    controls.forEach(control => {
      control.addEventListener("click", (event) => {
        const action = event.target.getAttribute("data-controls");
        const counterType = event.target.closest("[data-counter-wrapper]")?.getAttribute("data-counter-wrapper");
        
        if (counterType === "adults") {
          this.handleAdultsCounter(action);
        } else if (counterType === "children") {
          this.handleChildrenCounter(action);
        }
      });
    });
  }

  handleAdultsCounter(action) {
    if (action === "plus" && this.heroAdultsCount < 10) {
      this.heroAdultsCount++;
    } else if (action === "minus" && this.heroAdultsCount > 1) {
      this.heroAdultsCount--;
    }
    
    this.updateCounterDisplay("adults", this.heroAdultsCount);
  }

  handleChildrenCounter(action) {
    const max = this.getMaxChildrenSelectable();
    
    if (action === "plus" && this.heroChildrenCount < max) {
      this.heroChildrenCount++;
    } else if (action === "minus" && this.heroChildrenCount > 0) {
      this.heroChildrenCount--;
    }
    
    this.updateCounterDisplay("children", this.heroChildrenCount);
    this.updateChildAgeItems(this.heroChildrenCount);
    
    document.dispatchEvent(new CustomEvent('childrenCountChanged', {
      detail: { count: this.heroChildrenCount }
    }));
  }

  updateCounterDisplay(type, count) {
    const counterText = document.querySelector(`[data-counter="${type}-text"]`);
    if (counterText) {
      const displayText = this.localizationManager.translateWithCount(type, count);
      counterText.textContent = displayText;
    }
  }
}

/******************************************************************************
 * LOCATION DROPDOWN MANAGER
 ****************************************************************************/
class LocationDropdownManager {
  constructor() {
    this.locationDropdownCheckbox = document.querySelector(".location_dropdown-checkbox");
    this.contentWrapper = document.querySelector(".location_content-wrapper");
    this.focusableElement = null;
    
    this.initialize();
  }

  initialize() {
    this.setupFocusableElement();
    this.setupLocationLinks();
  }

  setupFocusableElement() {
    if (this.contentWrapper) {
      this.focusableElement = this.contentWrapper.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    }
  }

  setupLocationLinks() {
    const locationLinks = document.querySelectorAll('a[href="#location"]');
    
    if (!locationLinks.length || !this.locationDropdownCheckbox) return;

    locationLinks.forEach((link) => {
      link.addEventListener("click", this.handleLocationLinkClick.bind(this), { passive: true });
    });
  }

  handleLocationLinkClick(event) {
    requestAnimationFrame(() => {
      this.locationDropdownCheckbox.checked = true;

      if (this.focusableElement) {
        this.focusableElement.focus();
      }
    });
  }
}

/******************************************************************************
 * MAIN APPLICATION CLASS
 *****************************************************************************/
class HotelLandingPageApp {
  constructor() {
    this.localizationManager = new LocalizationManager();
    this.galleryDataManager = new GalleryDataManager();
    this.heroImageManager = null;
    this.topicSwiperManager = null;
    this.locationDropdownManager = null;
    this.galleryTabsRenderer = null;
    this.galleryImageRenderer = null;
    this.gallerySwiperManager = null;
    this.quoteImageManager = null;
    this.seasonSwitchManager = null;
    this.bookingFormManager = null;
  }

  initialize() {
    const galleryData = this.galleryDataManager.parseGalleryData();
    
    this.heroImageManager = new HeroImageManager(this.galleryDataManager);
    this.topicSwiperManager = new TopicSwiperManager(galleryData);
    this.locationDropdownManager = new LocationDropdownManager();
    
    // Gallery system components
    this.galleryTabsRenderer = new GalleryTabsRenderer(galleryData);
    this.galleryImageRenderer = new GalleryImageRenderer(galleryData);
    this.gallerySwiperManager = new GallerySwiperManager();
    this.quoteImageManager = new QuoteImageManager(this.galleryDataManager);
    this.seasonSwitchManager = new SeasonSwitchManager();
    this.bookingFormManager = new BookingFormManager(this.localizationManager);
    
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
  }

  setupSeasonChangeListeners() {
    document.addEventListener("seasonChanged", (event) => {
      const newSeason = event.detail?.season;
      if (newSeason) {
        this.heroImageManager.updateSeason(newSeason);
        this.galleryImageRenderer.updateSeason(newSeason);
        this.quoteImageManager.updateSeason(newSeason);
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
    // Expose translation functions globally for backward compatibility
    window.t = this.localizationManager.translate.bind(this.localizationManager);
    window.tCount = this.localizationManager.translateWithCount.bind(this.localizationManager);
    window.personsSummary = this.localizationManager.generatePersonsSummary.bind(this.localizationManager);
    
    // Expose gallery data manager for other components that might need it
    window.galleryDataManager = this.galleryDataManager;
  }
}

/******************************************************************************
 * APPLICATION INITIALIZATION
 *****************************************************************************/
document.addEventListener("DOMContentLoaded", function() {
  const hotelApp = new HotelLandingPageApp();
  hotelApp.initialize();
});