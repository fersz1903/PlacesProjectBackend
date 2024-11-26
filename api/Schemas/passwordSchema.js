const Joi = require("joi");

const passwordSchema = Joi.object({
  password: Joi.string()
    .min(8) // En az 8 karakter uzunluğunda olmalı
    .messages({
      "string.min": "Şifre en az {#limit} karakter uzunluğunda olmalıdır.",
      "string.pattern.base":
        "Şifre en az bir büyük harf ve bir küçük harf içermelidir.",
    })
    .pattern(new RegExp("(?=.*[A-Z])")) // En az bir büyük harf içermeli
    .pattern(new RegExp("(?=.*[a-z])")) // En az bir küçük harf içermeli
    .pattern(new RegExp("(?=.*\\d)")) // En az bir rakam içermeli
    .rule({ message: "Şifre en az bir rakam içermelidir." }),
});

module.exports = { passwordSchema };
