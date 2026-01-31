import { Pipe, PipeTransform } from '@angular/core';
import { Currency, CURRENCY_SYMBOLS } from '@core/models';

/**
 * Currency Format Pipe - Formats amounts with currency symbol
 */
@Pipe({
  name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    currency: Currency = 'EGP',
    showSymbol = true,
    decimals = 2
  ): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const formattedNumber = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    if (showSymbol) {
      const symbol = CURRENCY_SYMBOLS[currency] || currency;
      return `${symbol}${formattedNumber}`;
    }

    return formattedNumber;
  }
}
