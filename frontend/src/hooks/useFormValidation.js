// ============================================================
// useFormValidation - Hook reutilizable para validaciones (RNF-F05)
// Valida en tiempo real al perder el foco (onBlur)
// Muestra borde rojo y mensaje descriptivo al perder el foco
// ============================================================

import { useState, useCallback } from 'react';

/**
 * @param {Object} initialValues  - Valores iniciales del formulario
 * @param {Object} rules          - { fieldName: (value, values) => 'mensaje de error' | '' }
 */
const useFormValidation = (initialValues, rules) => {
  const [values, setValues]   = useState(initialValues);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value, currentValues) => {
    if (!rules[name]) return '';
    return rules[name](value, currentValues || values) || '';
  }, [rules, values]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => {
      const next = { ...prev, [name]: value };
      // Re-validate field in real-time if it was already touched
      if (touched[name]) {
        setErrors(err => ({ ...err, [name]: validateField(name, value, next) }));
      }
      return next;
    });
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  // Validate all fields before submit; returns true if form is valid
  const validateAll = useCallback(() => {
    const newErrors = {};
    const allTouched = {};
    let valid = true;
    Object.keys(rules).forEach(field => {
      const err = validateField(field, values[field]);
      newErrors[field] = err;
      allTouched[field] = true;
      if (err) valid = false;
    });
    setErrors(newErrors);
    setTouched(allTouched);
    return valid;
  }, [rules, values, validateField]);

  const resetForm = useCallback((newValues) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Helper: CSS class for an input field
  const fieldClass = (name) =>
    `input-field ${errors[name] && touched[name] ? 'input-error' : ''}`;

  return { values, errors, touched, handleChange, handleBlur, validateAll, resetForm, setValues, fieldClass };
};

export default useFormValidation;
