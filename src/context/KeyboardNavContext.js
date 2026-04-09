import React, { createContext, useContext, useState } from 'react';

const KeyboardNavContext = createContext();

export const KeyboardNavProvider = ({ children }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeOption, setActiveOption] = useState({});

  const value = {
    activeStep,
    setActiveStep,
    activeOption,
    setActiveOption,
  };

  return (
    <KeyboardNavContext.Provider value={value}>
      {children}
    </KeyboardNavContext.Provider>
  );
};

export const useKeyboardNav = () => useContext(KeyboardNavContext);