import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'input' | 'textarea';
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  onChange,
  placeholder,
  className,
  type = 'input'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [lastSavedValue, setLastSavedValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync with prop value ONLY when it's different from our last saved value
  // and we are NOT currently focused (to avoid jumping)
  useEffect(() => {
    if (value !== lastSavedValue && !isFocused) {
      setLocalValue(value);
      setLastSavedValue(value);
    }
  }, [value, lastSavedValue, isFocused]);

  // Handle auto-save with debounce
  useEffect(() => {
    if (localValue === lastSavedValue) return;

    const timeoutId = setTimeout(() => {
      onSave(localValue);
      setLastSavedValue(localValue);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [localValue, onSave, lastSavedValue]);

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== lastSavedValue) {
      onSave(localValue);
      setLastSavedValue(localValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    if (onChange) {
      onChange(newVal);
    }
  };

  if (type === 'textarea') {
    return (
      <textarea
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default EditableField;

