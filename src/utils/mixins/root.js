import Theme from '../theme';
import Locale from '../locale';
import { isObject, isDate } from '../_';
import { Attribute } from '../attribute';
import { locales, getDefault } from '../defaults';

export const rootMixin = {
  props: {
    color: {
      type: String,
      default: () => getDefault('color'),
    },
    isDark: {
      type: Boolean,
      default: () => getDefault('isDark'),
    },
    firstDayOfWeek: Number,
    masks: Object,
    locale: [String, Object],
    timezone: String,
    minDate: null,
    maxDate: null,
    minDateExact: null,
    maxDateExact: null,
    disabledDates: null,
    availableDates: null,
    theme: null,
  },
  computed: {
    $theme() {
      // Return the theme prop if it is an instance of the Theme class
      if (this.theme instanceof Theme) return this.theme;
      // Create the theme
      return new Theme({
        color: this.color,
        isDark: this.isDark,
      });
    },
    $locale() {
      // Return the locale prop if it is an instance of the Locale class
      if (this.locale instanceof Locale) return this.locale;
      // Build up a base config from component props
      const config = isObject(this.locale)
        ? this.locale
        : {
            id: this.locale,
            firstDayOfWeek: this.firstDayOfWeek,
            masks: this.masks,
          };
      // Return new locale
      return new Locale(config, {
        locales: locales.value,
        timezone: this.timezone,
      });
    },
    disabledDates_() {
      const dates = this.normalizeDates(this.disabledDates);
      const { minDate, minDateExact, maxDate, maxDateExact } = this;
      // Add disabled range for min date
      if (minDateExact || minDate) {
        const end = minDateExact
          ? this.normalizeDate(minDateExact)
          : this.normalizeDate(minDate, { time: '00:00:00' });
        dates.push({
          start: null,
          end: new Date(end.getTime() - 1000),
        });
      }
      // Add disabled range for min date
      if (maxDateExact || maxDate) {
        const start = maxDateExact
          ? this.normalizeDate(maxDateExact)
          : this.normalizeDate(maxDate, { time: '23:59:59' });
        dates.push({
          start: new Date(start.getTime() + 1000),
          end: null,
        });
      }
      return dates;
    },
    availableDates_() {
      return this.normalizeDates(this.availableDates);
    },
    disabledAttribute() {
      return new Attribute(
        {
          key: 'disabled',
          dates: this.disabledDates_,
          excludeDates: this.availableDates_,
          excludeMode: 'includes',
          order: 100,
        },
        this.$theme,
        this.$locale,
      );
    },
  },
  methods: {
    formatDate(date, mask) {
      return this.$locale ? this.$locale.formatDate(date, mask) : '';
    },
    parseDate(text, mask) {
      if (!this.$locale) return null;
      const value = this.$locale.parse(text, mask);
      return isDate(value) ? value : null;
    },
    normalizeDate(date, config) {
      return this.$locale ? this.$locale.normalizeDate(date, config) : date;
    },
    normalizeDates(dates) {
      return this.$locale.normalizeDates(dates, {
        isAllDay: true,
      });
    },
  },
};
