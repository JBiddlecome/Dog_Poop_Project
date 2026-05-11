import React, { useState } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StartWalk from './screens/StartWalk';
import Survey from './screens/Survey';
import Summary from './screens/Summary';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

export default function App() {
  const [screen, setScreen] = useState('start');
  const [walk, setWalk] = useState(null);

  function handleStart(newWalk) { setWalk(newWalk); setScreen('survey'); }
  function handleEnd(finishedWalk) { setWalk(finishedWalk); setScreen('summary'); }
  function handleNewWalk() { setWalk(null); setScreen('start'); }

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      {/* Single top padding applied once at root — pushes all screens below the status bar */}
      <View style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT, backgroundColor: '#fff' }}>
        {screen === 'start' && <StartWalk onStart={handleStart} />}
        {screen === 'survey' && <Survey walk={walk} onEnd={handleEnd} />}
        {screen === 'summary' && <Summary walk={walk} onNewWalk={handleNewWalk} />}
      </View>
    </SafeAreaProvider>
  );
}
