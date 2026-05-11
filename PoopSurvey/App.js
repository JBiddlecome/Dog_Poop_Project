import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StartWalk from './screens/StartWalk';
import Survey from './screens/Survey';
import Summary from './screens/Summary';

export default function App() {
  const [screen, setScreen] = useState('start'); // 'start' | 'survey' | 'summary'
  const [walk, setWalk] = useState(null);

  function handleStart(newWalk) {
    setWalk(newWalk);
    setScreen('survey');
  }

  function handleEnd(finishedWalk) {
    setWalk(finishedWalk);
    setScreen('summary');
  }

  function handleNewWalk() {
    setWalk(null);
    setScreen('start');
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {screen === 'start' && <StartWalk onStart={handleStart} />}
      {screen === 'survey' && <Survey walk={walk} onEnd={handleEnd} />}
      {screen === 'summary' && <Summary walk={walk} onNewWalk={handleNewWalk} />}
    </SafeAreaProvider>
  );
}
