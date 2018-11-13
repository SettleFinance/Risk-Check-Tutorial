import * as _ from 'underscore'

export default (value) => {
  var defaults = {
    delimiters: {
      thousands: ',',
      decimal: '.'
    },
    abbreviations: {
      // keys are for 10 to the power of n
      3: 'K',
      6: 'M',
      9: 'B',
      12: 'T',
      15: 'P',
      18: 'E',
      21: 'Z',
      24: 'Y'
    },
    currency: {
      symbol: '$'
    },
    formatNaN: '-',
    smallNumberThreshold: 1
  }

  var formatSettings = {
    abbreviate: true,
    delimitThousands: true,
    abbreviation: {
      decimalPlaces: 2,
      optionalDecimalPlaces: 0,
    },
    smallNumber: {
      decimalPlaces: 2,
      optionalDecimalPlaces: 3,
    },
    decimalPlaces: 2,
    optionalDecimalPlaces: 0,
    forceSign: false
  }

  var formatCurrencySettings = {
    abbreviate: true,
    delimitThousands: true,
    abbreviation: {
      decimalPlaces: 2,
      optionalDecimalPlaces: 0,
    },
    smallNumber: {
      decimalPlaces: 2,
      optionalDecimalPlaces: 3,
    },
    decimalPlaces: 2,
    optionalDecimalPlaces: 0,
    forceSign: false
  }

  var formatPercentSettings = {
    abbreviate: true,
    delimitThousands: true,
    abbreviation: {
      decimalPlaces: 0,
      optionalDecimalPlaces: 0,
    },
    smallNumber: {
      decimalPlaces: 2,
      optionalDecimalPlaces: 0,
    },
    decimalPlaces: 2,
    optionalDecimalPlaces: 0,
    forceSign: true
  }

  var isNegative = false

  if(value < 0) {
    isNegative = true
    value = Math.abs(value)
  }

  var CheckNaN = (value) => {
    return (isNaN(value) || value === null || value === undefined)
  }

  const AddSign = (value, settings) => {
    return isNegative ? '-' + value : (settings.forceSign && value > 0 ? '+' + value : value)
  }

  const FormatCurrency = (options = {}) => {
    var settings = {
      ...defaults,
      ...formatCurrencySettings,
      ...options
    }

    if(CheckNaN(value)) {
      return settings.formatNaN
    }

    return AddSign('$' + Format(settings), settings)
  }

  const FormatPercent = (options = {}) => {
    var settings = {
      ...defaults,
      ...formatPercentSettings,
      ...options
    }

    if(CheckNaN(value)) {
      return settings.formatNaN
    }

    return AddSign(Format(settings) + '%', settings)
  }

  const FormatSign = (options = {}) => {
    return AddSign(Format(options), options)
  }

  const Format = (options = {}) => {
    var settings = {
      ...defaults,
      ...formatSettings,
      ...options
    }

    if(CheckNaN(value)) {
      return settings.formatNaN
    }

    if(value < 0) {
      value = Math.abs(value)
      isNegative = true;
    }

    var Abbreviation = (value) => {
      return _.reduce(settings.abbreviations, (memo, abbreviation, key) => {
        if(value >= Math.pow(10, Number(key))) {
          return key
        } else {
          return memo
        }
      }, null)
    }

    var abbreviationKey = settings.abbreviate ? Abbreviation(value) : null

    if(abbreviationKey) {
      value = value / Math.pow(10, Number(abbreviationKey))

      settings = {
        ...settings,
        ...settings.abbreviation
      }
    } else if(value < settings.smallNumberThreshold) {
      settings = {
        ...settings,
        ...settings.smallNumber
      }
    }

    var FormatThousands = (string) => {
      return string.replace(/\B(?=(\d{3})+(?!\d))/g, settings.delimiters.thousands)
    }

    var FormatDecimal = (string) => {
      return string.replace(/0+$/g,'').padEnd(settings.decimalPlaces, '0')
    }

    var string = value.toFixed(settings.optionalDecimalPlaces + settings.decimalPlaces)

    string = string.split('.')

    var beforeDecimal = string[0]
    var afterDecimal = string.length > 1 ? FormatDecimal(string[1]) : ''

    var output = (settings.delimitThousands ? FormatThousands(beforeDecimal) : afterDecimal)

    if(afterDecimal.length) {
      output += settings.delimiters.decimal + afterDecimal
    }

    if(abbreviationKey) {
      output += ' ' + settings.abbreviations[abbreviationKey]
    }

    return output
  }

  return {
    Format: FormatSign,
    FormatCurrency,
    FormatPercent
  }
}
