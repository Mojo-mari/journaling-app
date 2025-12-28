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

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
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
      placeholder={placeholder}
      className={className}
    />
  );
};

export default EditableField;

