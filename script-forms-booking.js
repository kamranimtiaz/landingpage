/**
 * Hotel Landing Page - Forms, Localization, Booking & Location Functionality
 * Extracted functionality for better organization
 */

/******************************************************************************
 * TRANSLATION CONFIGURATION
 *****************************************************************************/
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
 * LOCALIZATION MANAGER
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

  resolveFlatpickrLocale() {
    if (!window.flatpickr || !window.flatpickr.l10ns) return 'default';
    
    const currentLocale = this.getCurrentLocale();
    const availableLocales = window.flatpickr.l10ns;
    
    if (availableLocales[currentLocale]) {
      return currentLocale;
    }
    
    return 'default';
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
        locale: this.localizationManager.resolveFlatpickrLocale(),
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
 *****************************************************************************/
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
 * FORMS & BOOKING INITIALIZATION
 *****************************************************************************/
class FormsBookingApp {
  constructor() {
    this.localizationManager = new LocalizationManager();
    this.bookingFormManager = null;
    this.locationDropdownManager = null;
  }

  initialize() {
    this.bookingFormManager = new BookingFormManager(this.localizationManager);
    this.locationDropdownManager = new LocationDropdownManager();
    
    this.setupGlobalUtilities();
  }

  setupGlobalUtilities() {
    // Expose translation functions globally for backward compatibility
    window.t = this.localizationManager.translate.bind(this.localizationManager);
    window.tCount = this.localizationManager.translateWithCount.bind(this.localizationManager);
    window.personsSummary = this.localizationManager.generatePersonsSummary.bind(this.localizationManager);
    
    // Expose localization manager for other components
    window.localizationManager = this.localizationManager;
  }
}

/******************************************************************************
 * AUTO-INITIALIZATION
 *****************************************************************************/
document.addEventListener("DOMContentLoaded", function() {
  const formsBookingApp = new FormsBookingApp();
  formsBookingApp.initialize();
});