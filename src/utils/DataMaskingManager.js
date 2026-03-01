/**
 * Functional Fragments: Pure masking strategies.
 */
export const MASKING_STRATEGIES = {
  credit_card: (value, rule) => {
    const clean = value.replace(/\D/g, '');
    if (rule.preserveLength) {
      return value.replace(/\d/g, (match, offset) => {
        const digitIndex = value.substring(0, offset).replace(/\D/g, '').length;
        return digitIndex < clean.length - 4 ? rule.maskChar : match;
      });
    }
    return `${rule.maskChar.repeat(4)}-${rule.maskChar.repeat(4)}-${rule.maskChar.repeat(4)}-${clean.slice(-4)}`;
  },

  ssn: (value, rule) => {
    const clean = value.replace(/\D/g, '');
    if (rule.preserveLength) {
      return value.replace(/\d/g, (match, offset) => {
        const digitIndex = value.substring(0, offset).replace(/\D/g, '').length;
        return digitIndex < clean.length - 4 ? rule.maskChar : match;
      });
    }
    return `***-**-${clean.slice(-4)}`;
  },

  email: (value, rule) => {
    const atIndex = value.indexOf('@');
    if (atIndex <= 0) return MASKING_STRATEGIES.default(value, rule);

    const username = value.substring(0, atIndex);
    const domain = value.substring(atIndex);

    if (rule.preserveLength) {
      const maskedUsername = username.length > 1
        ? username.charAt(0) + rule.maskChar.repeat(username.length - 1)
        : rule.maskChar.repeat(username.length);
      return maskedUsername + domain;
    }
    return `${username.charAt(0)}***${domain}`;
  },

  phone: (value, rule) => {
    const clean = value.replace(/\D/g, '');
    if (rule.preserveLength) {
      return value.replace(/\d/g, (match, offset) => {
        const digitIndex = value.substring(0, offset).replace(/\D/g, '').length;
        return digitIndex < clean.length - 4 ? rule.maskChar : match;
      });
    }
    return `${rule.maskChar.repeat(3)}-${rule.maskChar.repeat(3)}-${clean.slice(-4)}`;
  },

  secret: (value, rule) => {
    if (rule.preserveLength) return rule.maskChar.repeat(value.length);
    return rule.maskChar.repeat(8);
  },

  custom: (value, rule) => {
    return typeof rule.customMask === 'function' ? rule.customMask(value) : value;
  },

  default: (value, rule) => {
    if (rule.preserveLength) return rule.maskChar.repeat(value.length);
    return rule.maskChar.repeat(Math.min(value.length, 8));
  }
};

// Compatibility Aliases
MASKING_STRATEGIES.password = MASKING_STRATEGIES.secret;
MASKING_STRATEGIES.token = MASKING_STRATEGIES.secret;

export const MaskingStrategy = {
  CREDIT_CARD: 'credit_card',
  SSN: 'ssn',
  EMAIL: 'email',
  PHONE: 'phone',
  PASSWORD: 'password',
  TOKEN: 'token',
  CUSTOM: 'custom'
};

/**
 * DataMaskingManager - PII Obfuscation Engine.
 * Implements Strategy Pattern (SOLID: OCP).
 */
export class DataMaskingManager {
  constructor(options = {}) {
    this.maskChar = options.maskChar || '*';
    this.preserveLength = options.preserveLength !== false;
    this.rules = [];
    this.strategies = new Map(Object.entries(MASKING_STRATEGIES));

    // ANSI escape code regex (intentional control chars for stripping terminal codes)
    // eslint-disable-next-line no-control-regex
    this.ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

    if (options.enableDefaultRules !== false) {
      this.addDefaultRules();
    }

    if (options.rules) {
      options.rules.forEach(rule => this.addRule(rule));
    }
  }

  addDefaultRules() {
    const defaultRules = [
      { pattern: /credit_card|card_number|payment_number/i, strategy: MaskingStrategy.CREDIT_CARD },
      { pattern: /ssn|social_security|security_number/i, strategy: MaskingStrategy.SSN },
      { pattern: /email/i, strategy: MaskingStrategy.EMAIL },
      { pattern: /phone|phone_number|mobile_number/i, strategy: MaskingStrategy.PHONE },
      { pattern: /password|pass|pwd|secret|api_key|token|auth_token|jwt|bearer/i, strategy: MaskingStrategy.PASSWORD }
    ];

    defaultRules.forEach(rule => this.addRule(rule));
  }

  addRule(rule) {
    this.rules.push({
      ...rule,
      _compiledPattern: typeof rule.pattern === 'string' ? new RegExp(rule.pattern, 'i') : rule.pattern,
      preserveLength: rule.preserveLength ?? this.preserveLength,
      maskChar: rule.maskChar ?? this.maskChar
    });
  }

  registerStrategy(name, strategyFn) {
    if (typeof strategyFn === 'function') {
      this.strategies.set(name, strategyFn);
    }
  }

  process(data) {
    if (data === null || data === undefined) return data;

    const processors = {
      string: (val) => val.replace(this.ansiRegex, ''),
      object: (val) => {
        if (Array.isArray(val)) return val.map(item => this.process(item));
        if (val && val.constructor === Object) return this.maskObject(val);
        return val;
      }
    };

    return (processors[typeof data] || ((v) => v))(data);
  }

  maskObject(data) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = this.maskValue(key, value);
      return acc;
    }, {});
  }

  maskValue(key, value) {
    if (typeof value !== 'string') return this.process(value);

    const rule = this.rules.find(r => r._compiledPattern?.test(key));
    return rule ? this.applyStrategy(value, rule) : value.replace(this.ansiRegex, '');
  }

  applyStrategy(value, rule) {
    const strategy = this.strategies.get(rule.strategy) || this.strategies.get('default');
    return strategy(value, rule);
  }
}

export const dataMaskingManager = new DataMaskingManager();
