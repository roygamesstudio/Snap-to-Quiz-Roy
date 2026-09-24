const currencyDefinitions = {
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'USD',
    amount: 5,
    subunit: 500,
    planCode: null,
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    label: 'NGN',
    amount: 3000,
    subunit: 300000,
    planCode: null,
  },
  GHS: {
    code: 'GHS',
    symbol: 'GH₵',
    label: 'GHS',
    amount: 75,
    subunit: 7500,
    planCode: null,
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    label: 'ZAR',
    amount: 90,
    subunit: 9000,
    planCode: null,
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    label: 'KES',
    amount: 650,
    subunit: 65000,
    planCode: null,
  },
}

export const CURRENCIES = Object.fromEntries(
  Object.keys(currencyDefinitions).map((code) => [code, currencyDefinitions[code]])
)
