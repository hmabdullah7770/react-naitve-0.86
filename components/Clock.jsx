import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (

      <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>

  );
};

export default Clock;
