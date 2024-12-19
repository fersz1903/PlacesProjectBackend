const Joi = require("joi");

const formSchema = Joi.object({
  // collective fields
  option: Joi.number().valid(0, 1).required().messages({
    "any.required": "option alanı zorunludur.",
    "any.only": "Option sadece 0 veya 1 olmalıdır.",
    "number.base": "Option sayısal bir değer olmalıdır.",
  }),
  formType: Joi.string().min(2).max(20).required().messages({
    "string.min": "formType en az {#limit} karakter olmalıdır.",
    "string.max": "fromType en fazla {#limit} karakter olmalıdır.",
    "any.required": "formType alanı zorunludur.",
  }),
  contact: Joi.object({
    companyName: Joi.string().min(2).max(100).messages({
      "string.min": "Firma adı en az {#limit} karakter olmalıdır.",
      "string.max": "Firma adı en fazla {#limit} karakter olmalıdır.",
    }),
    name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Ad en az {#limit} karakter olmalıdır.",
      "string.max": "Ad en fazla {#limit} karakter olmalıdır.",
      "any.required": "contact.name alanı zorunludur.",
    }),
    email: Joi.string().min(2).max(200).email().required().messages({
      "string.email": "Geçerli bir e-posta adresi giriniz.",
      "string.min": "email en az {#limit} karakter olmalıdır.",
      "string.max": "email en fazla {#limit} karakter olmalıdır.",
      "any.required": "contact.email alanı zorunludur.",
    }),
    phone: Joi.string().allow("").min(11).max(20).messages({
      "string.min": "Telefon en az {#limit} karakter olmalıdır.",
      "string.max": "Telefon en fazla {#limit} karakter olmalıdır.",
    }),
  })
    .required()
    .messages({
      "any.required": "contact alanı zorunludur.",
    }),

  // alternative fields
  additionalFields: Joi.alternatives().conditional("option", {
    is: 0, // if option 0
    then: Joi.object({
      dataType: Joi.string().min(2).max(255).required().messages({
        "string.min": "Veri türü en az {#limit} karakter olmalıdır.",
        "string.max": "Veri Türü en fazla {#limit} karakter olmalıdır.",
        "any.required": "dataType alanı zorunludur.",
      }),
      dataCount: Joi.number().min(1).max(10000).required().messages({
        "number.min": "Veri adedi en az {#limit} olmalıdır.",
        "number.max": "Veri adedi en fazla {#limit} olmalıdır.",
        "any.required": "dataCount alanı zorunludur.",
      }),
      dataSource: Joi.string().min(2).max(100).required().messages({
        "string.min": "Veri kaynağı en az {#limit} olmalıdır.",
        "string.max": "Veri kaynağı en fazla {#limit} olmalıdır.",
        "any.required": "dataSource alanı zorunludur.",
      }),
      analysis: Joi.string().max(1000).messages({
        "string.max": "Rapor detayı en fazla {#limit} karakter olmalıdır.",
      }),
    }),
    //if option 1
    otherwise: Joi.object({
      product: Joi.string().min(2).max(255).required().messages({
        "string.min": "Ürün en az {#limit} karakter olmalıdır.",
        "string.max": "Ürün en fazla {#limit} karakter olmalıdır.",
        "any.required": "product alanı zorunludur.",
      }),
      sellOrBuyPlace: Joi.string().min(2).max(255).messages({
        "string.min": "sellPlace en az {#limit} karakter olmalıdır.",
        "string.max": "sellPlace en fazla {#limit} karakter olmalıdır.",
      }),
      price: Joi.number()
        .positive()
        .precision(2)
        .min(1)
        .max(1000000000)
        .required()
        .messages({
          "number.base": "Fiyat sayısal bir değer olmalıdır.",
          "number.positive": "Fiyat pozitif bir değer olmalıdır.",
          "number.precision": "Fiyat en fazla 2 ondalık basamak içerebilir.",
          "number.min": "Fiyat en az {#limit} olmalıdır.",
          "number.max": "Fiyat en fazla {#limit} olmalıdır.",
          "any.required": "Fiyat alanı zorunludur.",
        }),
      currency: Joi.string().min(1).max(50).required().messages({
        "string.min": "Para birimi en az {#limit} karakter olmalıdır.",
        "string.max": "Para birimi en fazla {#limit} karakter olmalıdır.",
        "any.required": "currency alanı zorunludur.",
      }),
      details: Joi.string().max(1000).required().messages({
        "string.max": "Detay en fazla {#limit} karakter olmalıdır.",
        "any.required": "Detay alanı zorunludur.",
      }),
    }),
  }),
});

module.exports = { formSchema };
