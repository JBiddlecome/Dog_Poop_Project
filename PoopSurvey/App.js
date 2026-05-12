import React, { useState } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import StartWalk from './screens/StartWalk';
import Survey from './screens/Survey';
import WalkMap from './screens/WalkMap';
import Summary from './screens/Summary';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

export default function App() {
  const [screen, setScreen] = useState('start'); // 'start' | 'survey' | 'map' | 'summary'
  const [walk, setWalk] = useState(null);
  const [prevScreen, setPrevScreen] = useState(null); // to know where to return from map

  function handleStart(newWalk) { setWalk(newWalk); setScreen('survey'); }
  function handleEnd(finishedWalk) { setWalk(finishedWalk); setScreen('summary'); }
  function handleNewWalk() { setWalk(null); setScreen('start'); }

  function handleViewMap(currentWalk) {
    setWalk(currentWalk);
    setPrevScreen(screen);
    setScreen('map');
  }

  function handleBackFromMap() {
    setScreen(prevScreen ?? 'survey');
  }

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={{ flex: 1, paddingTop: STATUS_BAR_HEIGHT, backgroundColor: '#fff' }}>
        {screen === 'start'   && <StartWalk onStart={handleStart} />}
        {screen === 'survey'  && <Survey walk={walk} onEnd={handleEnd} onViewMap={handleViewMap} />}
        {screen === 'map'     && <WalkMap walk={walk} onBack={handleBackFromMap} />}
        {screen === 'summary' && <Summary walk={walk} onNewWalk={handleNewWalk} onViewMap={handleViewMap} />}
      </View>
    </SafeAreaProvider>
  );
}
