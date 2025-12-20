import React, { useState, useEffect } from 'react';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'input' | 'textarea';
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
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

  if (type === 'textarea') {
    return (
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
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
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default EditableField;

