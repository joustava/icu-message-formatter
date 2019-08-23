
ICU Message Formatter
=====================

[![Build Status](https://travis-ci.org/ultraq/icu-message-formatter.svg?branch=master)](https://travis-ci.org/ultraq/icu-message-formatter)
[![Coverage Status](https://coveralls.io/repos/github/ultraq/icu-message-formatter/badge.svg?branch=master)](https://coveralls.io/github/ultraq/icu-message-formatter?branch=master)
[![npm](https://img.shields.io/npm/v/@ultraq/icu-message-formatter.svg?maxAge=3600)](https://www.npmjs.com/package/@ultraq/icu-message-formatter)
[![License](https://img.shields.io/github/license/ultraq/icu-message-formatter.svg?maxAge=2592000)](https://github.com/ultraq/icu-message-formatter/blob/master/LICENSE.txt)

Format [ICU message syntax strings](https://formatjs.io/guides/message-syntax/)
from supplied parameters and your own configurable types.

This is a low-level API alternative to string formatting libraries like
`intl-messageformat` (the underlying library behind `react-intl`) which often
blow out bundle sizes because of the sheer amount of formatting capabilities
included.  With this library, you add/configure your own formatters to keep your
bundle size as light as it can possibly be.

Out of the box, the only formatting this library does is basic replacement of
`{tokens}` with strings.  Some features are part of this library, but must
explicitly be configured.  Everything else is BYO formatter (some examples
below).


Installation
------------

```
npm install @ultraq/icu-message-formatter.git
```


Usage
-----

Create a new `MessageFormatter` instance and configure it with any type handlers
that you know you'll encounter in your format strings.  Then, call `format` to
process whatever string and data you throw at it for the locale you want it in:

```javascript
import MessageFormatter from '@ultraq/icu-message-formatter';
import {toCurrencyString} from 'my-custom-currency-library';

let formatter = new MessageFormatter({
  currency: ({value, currency}, options, values, locale) => toCurrencyString(value, currency, locale)
});

let message = formatter.format('Hey {name}, that\'s gonna cost you {amount, currency}!', {
  name: 'Emanuel',
  amount: {
    value: 2,
    currency: 'GBP'
  }
}, 'en-NZ');

console.log(message); // "Hey Emanuel, that's gonna cost you £2.00!"
```


API
---

### MessageFormatter

```javascript
import MessageFormatter from 'icu-message-formatter';
```

The main class for formatting messages.

#### new MessageFormatter(typeHandlers = {})

Creates a new formatter that can work using any of the custom type handlers you
register.

 - **typeHandlers**: optional object where the keys are the names of the types
   to register, their values being the functions that will return a nicely
   formatted string for the data and locale they are given.  Type handlers are
   passed 5 parameters:
    - the object which matched the key of the block being processed
    - any format options associated with the block being processed
    - the object of placeholder data given to the original `format` call
    - the locale to use for formatting
    - and the `format` function itself (see below) so that sub-messages can be
      processed by type handlers

#### format(message, values = {}, locale)

Formats an ICU message syntax string using `values` for placeholder data and any
currently-registered type handlers.

 - **message**: the ICU message string to format
 - **values**: object of placeholder data to fill out the message
 - **locale**: the locale to use for formatting


### Type handlers available in this library

### pluralTypeHandler

```javascript
import pluralTypeHandler from 'icu-message-formatter/lib/pluralTypeHandler';
```

Handler for `plural` statements within ICU message syntax strings.  See
https://formatjs.io/guides/message-syntax/#select-format for more details on how
the `plural` statement works.

For the special `#` placeholder, it will be processed as if it were
`{key, number}`, using the `number` handler that has been registered with the
current message formatter instance.  If none has been registered, then the
fallback behaviour will be invoked (which is to emit the value of `key`).

#### selectTypeHandler

```javascript
import selectTypeHandler from 'icu-message-formatter/lib/selectTypeHandler';
```

Handler for `select` statements within ICU message syntax strings.  See
https://formatjs.io/guides/message-syntax/#select-format for more details on how
the `select` statement works.


### Other exported utilities

#### findClosingBracket(string, fromIndex)

```javascript
import {findClosingBracket} from 'icu-message-formatter/lib/utilities';
```

Finds the index of the next closing curly bracket, `}`, including in strings
that could have nested brackets.  Returns the index of the matching closing
bracket, or -1 if no closing bracket could be found.

 - **string**:
 - **fromIndex**:

#### splitFormattedArgument(block)

```javascript
import {splitFormattedArgument} from 'icu-message-formatter/lib/utilities';
```

Split a `{key, type, format}` block into those 3 parts, taking into account
nested message syntax that can exist in the `format` part.  Returns an array
with `key`, `type`, and `format` items in that order, if present in the
formatted argument block.

 - **block**:
