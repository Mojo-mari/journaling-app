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
    // onChangeが提供されている場合（リアルタイム更新時）は、valueがlocalValueに追従しているため
    // 単純な比較では変更を検知できない。そのため、常にonSaveを呼び出し、保存の判断は親に委ねる。
    if (localValue !== value || onChange) {
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

