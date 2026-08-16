import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import type { CardLayout } from '../TimetableSlotCard';

interface SlotBubbleMenuProps {
  visible: boolean;
  cardLayout: CardLayout | null;
  subjectName?: string;
  onEdit: () => void;
  onDelete: () => void;
  onDismiss: () => void;
}

const BUBBLE_SIZE = 56;
const BUBBLE_GAP  = 20;
const { width: SW, height: SH } = Dimensions.get('window');

export const SlotBubbleMenu: React.FC<SlotBubbleMenuProps> = ({
  visible,
  cardLayout,
  subjectName,
  onEdit,
  onDelete,
  onDismiss,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backdropOpacity = useSharedValue(0);
  const editScale       = useSharedValue(0);
  const deleteScale     = useSharedValue(0);
  const editOpacity     = useSharedValue(0);
  const deleteOpacity   = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      editScale.value       = withSpring(1, { damping: 12, stiffness: 260 });
      editOpacity.value     = withTiming(1, { duration: 160 });
      deleteScale.value     = withDelay(70, withSpring(1, { damping: 12, stiffness: 260 }));
      deleteOpacity.value   = withDelay(70, withTiming(1, { duration: 160 }));
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      editScale.value       = withTiming(0, { duration: 130, easing: Easing.in(Easing.ease) });
      deleteScale.value     = withTiming(0, { duration: 130, easing: Easing.in(Easing.ease) });
      editOpacity.value     = withTiming(0, { duration: 130 });
      deleteOpacity.value   = withTiming(0, { duration: 130 });
    }
  }, [visible]);

  // ── Position bubbles centred on the touch point ──────────────
  // Total row width: bubble + gap + bubble
  const totalW = BUBBLE_SIZE * 2 + BUBBLE_GAP;

  const touchX = cardLayout?.touchX ?? SW / 2;
  const touchY = cardLayout?.touchY ?? SH / 2;

  // Center the pair around the exact touch X
  let rowLeft = touchX - totalW / 2;
  // Clamp so bubbles never clip off-screen edges
  rowLeft = Math.max(16, Math.min(rowLeft, SW - totalW - 16));

  // Place bubbles ABOVE the finger (80px above touch point)
  const OFFSET_ABOVE = 90;
  let rowTop = touchY - OFFSET_ABOVE;
  // Never go above the status bar area
  rowTop = Math.max(80, rowTop);

  const hintTop = rowTop - 28;

  const backdropStyle  = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const editBubStyle   = useAnimatedStyle(() => ({ opacity: editOpacity.value,   transform: [{ scale: editScale.value }] }));
  const deleteBubStyle = useAnimatedStyle(() => ({ opacity: deleteOpacity.value, transform: [{ scale: deleteScale.value }] }));

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>

      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Hint label */}
      <Animated.View
        style={[styles.hintWrap, editBubStyle, { top: hintTop, left: rowLeft, width: totalW }]}
        pointerEvents="none"
      >
        <Text style={styles.hintText} numberOfLines={1}>
          {subjectName || 'Options'}
        </Text>
      </Animated.View>

      {/* ── Edit bubble (left) ── */}
      <Animated.View style={[styles.bubbleWrap, editBubStyle, { top: rowTop, left: rowLeft }]}>
        <TouchableOpacity
          style={[styles.bubble, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={onEdit}
          activeOpacity={0.75}
        >
          <Pencil color="#3B82F6" size={22} />
        </TouchableOpacity>
        <Text style={[styles.bubbleLabel, { color: 'rgba(255,255,255,0.8)' }]}>Edit</Text>
      </Animated.View>

      {/* ── Delete bubble (right) ── */}
      <Animated.View style={[styles.bubbleWrap, deleteBubStyle, { top: rowTop, left: rowLeft + BUBBLE_SIZE + BUBBLE_GAP }]}>
        <TouchableOpacity
          style={[styles.bubble, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={onDelete}
          activeOpacity={0.75}
        >
          <Trash2 color="#EF4444" size={22} />
        </TouchableOpacity>
        <Text style={[styles.bubbleLabel, { color: 'rgba(255,255,255,0.8)' }]}>Delete</Text>
      </Animated.View>

    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  hintWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.1,
  },
  bubbleWrap: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    alignItems: 'center',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  bubbleLabel: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
