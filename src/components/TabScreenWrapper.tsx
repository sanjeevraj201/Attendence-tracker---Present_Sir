import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { usePathname, router, useSegments } from 'expo-router';
import Animated, { useAnimatedStyle, withTiming, Easing, useSharedValue, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';

interface TabScreenWrapperProps {
  children: React.ReactNode;
  name: string;
}

const TABS = ['today', 'subjects', 'timetable', 'profile'];

export const TabScreenWrapper = ({ children, name }: TabScreenWrapperProps) => {
  const pathname = usePathname();
  const segments = useSegments();
  
  // Check if this tab is currently the active route
  const isFocused = pathname.endsWith(`/${name}`) || pathname === `/${name}` || (name === 'today' && pathname === '/');
  
  // Use shared value for pure UI thread animation (prevents JS thread blocking/freezing)
  const focusAnim = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusAnim.value = withTiming(isFocused ? 1 : 0, { 
      duration: 300,
      easing: Easing.out(Easing.cubic)
    });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: focusAnim.value,
      transform: [
        { 
          // Starts slightly lower (15px) and moves up to 0 as it focuses
          translateY: 15 * (1 - focusAnim.value) 
        }
      ]
    };
  });

  const navigateTab = (direction: 1 | -1) => {
    const currentIndex = TABS.indexOf(name);
    if (currentIndex === -1) return;
    
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < TABS.length) {
      const nextTab = TABS[nextIndex];
      // Determine base route from segments e.g. /(student) or /(faculty)
      const baseRoute = segments[0] || '(student)';
      
      // If it's today, we might navigate to / or /today depending on layout, but let's just use the exact path
      const path = `/${baseRoute}/${nextTab}`;
      router.replace(path as any);
    }
  };

  // Fling Left (Swiping from right to left) -> Go to next tab
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      runOnJS(navigateTab)(1);
    });

  // Fling Right (Swiping from left to right) -> Go to prev tab
  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      runOnJS(navigateTab)(-1);
    });

  const composedGestures = Gesture.Simultaneous(flingLeft, flingRight);

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View 
        style={[styles.container, animatedStyle]} 
        pointerEvents={isFocused ? 'auto' : 'none'}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
