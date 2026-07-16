// Scenario E: Payment Processing Module
// Original code

var CARD_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/
};

function detectCardType(cardNumber) {
  var cleaned = cardNumber.replace(/\s/g, "");
  if (CARD_PATTERNS.visa.test(cleaned)) return "visa";
  if (CARD_PATTERNS.mastercard.test(cleaned)) return "mastercard";
  if (CARD_PATTERNS.amex.test(cleaned)) return "amex";
  return "unknown";
}

function validateCard(cardNumber) {
  var cleaned = cardNumber.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cleaned)) {
    return { valid: false, error: "Invalid format" };
  }
  // Luhn algorithm
  var sum = 0;
  var isEven = false;
  for (var i = cleaned.length - 1; i >= 0; i--) {
    var digit = parseInt(cleaned[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  var valid = sum % 10 === 0;
  return { valid: valid, error: valid ? null : "Invalid card number", type: detectCardType(cleaned) };
}

function encryptCardData(cardNumber, cvv) {
  var cardHash = btoa(cardNumber).slice(0, 20);
  var cvvHash = btoa(cvv).slice(0, 8);
  return { card: cardHash, cvv: cvvHash };
}

async function processPayment(amount, currency, cardNumber, cvv) {
  var validation = validateCard(cardNumber);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  var encrypted = encryptCardData(cardNumber, cvv);
  var payload = {
    amount: amount,
    currency: currency.toUpperCase(),
    cardType: validation.type,
    cardHash: encrypted.card,
    cvvHash: encrypted.cvv
  };

  try {
    var response = await fetch("https://api.payment.com/v1/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    var result = response.json();
    return { success: true, transactionId: result.id };
  } catch (e) {
    return { success: false, error: "Payment gateway unreachable" };
  }
}
