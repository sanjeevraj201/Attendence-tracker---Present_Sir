import React from 'react';
import {
  View, Text, TouchableOpacity,
  Platform, Dimensions, StyleSheet,
} from 'react-native';
import { Clock, Trash2, Plus, Coffee, Utensils, Apple, Pizza } from 'lucide-react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import Animated, {
  useAnimatedStyle, useSharedValue,
  withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { TimetableSlot, Subject } from '../types/attendance.types';
import { getSubjectIcon } from '../utils/subject.utils';
import { useColorScheme } from 'nativewind';

export interface CardLayout {
  touchX: number;
  touchY: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_W        = 80;
const SWIPE_THRESHOLD = -DELETE_W;

const TiffinBoxIcon = ({ color, size }: { color?: string; size?: number }) => (
  <Svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Handle */}
    <Path d="M9 5V3a3 3 0 0 1 6 0v2" />
    
    {/* Tier 1 */}
    <Path d="M5 5h14v2h-1v3H6V7H5z" />

    {/* Tier 2 */}
    <Path d="M5 11h14v2h-1v3H6v-3H5z" />

    {/* Tier 3 (Rounded Bottom) */}
    <Path d="M5 17h14v2h-1v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2H5z" />
  </Svg>
);

const getBreakIcon = (title?: string) => {
  if (!title) return Coffee;
  const lower = title.toLowerCase();
  if (lower.includes('lunch') || lower.includes('tiffin')) return TiffinBoxIcon;
  if (lower.includes('food') || lower.includes('dinner') || lower.includes('breakfast')) return Utensils;
  if (lower.includes('snack') || lower.includes('fruit')) return Apple;
  if (lower.includes('pizza') || lower.includes('junk')) return Pizza;
  return Coffee;
};

interface TimetableSlotCardProps {
  slot: TimetableSlot;
  subject?: Subject;
  onDelete: (id: string) => void;
  onPressSubject: (id: string) => void;
  onPressTime: (id: string) => void;
  isActive?: boolean;
}

export const TimetableSlotCard = ({
  slot,
  subject,
  onDelete,
  onPressSubject,
  onPressTime,
  isActive = false,
}: TimetableSlotCardProps) => {
  const translateX = useSharedValue(0);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ── Swipe to delete ───────────────────────────────────────────
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate(e => {
      if (e.translationX < 0) translateX.value = e.translationX;
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(
          -SCREEN_WIDTH, { duration: 240 },
          done => { if (done) runOnJS(onDelete)(slot.id); },
        );
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 300 });
      }
    });

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const deleteAnim = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / DELETE_W),
  }));

  // ── Theme ─────────────────────────────────────────────────────
  const cardBg      = isDark ? '#1C1C1E' : '#FFFFFF';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const badgeBg     = isDark ? '#2C2C2E' : '#F3F4F6';
  const badgeBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';
  const numColor    = isDark ? '#9CA3AF' : '#6B7280';
  const nameColor   = isDark ? '#F1F5F9' : '#111827';
  const emptyColor  = isDark ? '#6B7280' : '#9CA3AF';
  const timeColor   = isDark ? '#6B7280' : '#9CA3AF';

  const elevation = !isDark
    ? Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 }
      : { elevation: 3 }
    : {};

  const periodLabel = slot.periodIndex + 1; // 1-based

  return (
    <View style={styles.wrapper}>

      {/* ── Red delete box — revealed on swipe ── */}
      <Animated.View style={[styles.deleteBox, deleteAnim]}>
        <Trash2 color="#FFF" size={22} />
      </Animated.View>

      {/* ── Sliding card ── */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[elevation, cardAnim]}>
          {/*
           * ALL layout-critical styles MUST be inline here.
           * Do NOT move flexDirection/width/padding into StyleSheet —
           * Animated.View sometimes ignores cached StyleSheet layout props.
           */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: '100%',
              backgroundColor: cardBg,
              borderColor: isActive ? '#FF5E00' : cardBorder,
              borderWidth: isActive ? 1.5 : 1,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            {/* ── Left side: icon (assigned), Free Period (break), OR period badge + plus (unassigned) ── */}
            {slot.isBreak ? (
              /* Free Period icon */
              <TouchableOpacity
                onPress={() => onPressSubject(slot.id)}
                activeOpacity={0.7}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(() => {
                  const BreakIcon = getBreakIcon(slot.title);
                  return <BreakIcon color={numColor} size={22} />;
                })()}
              </TouchableOpacity>
            ) : subject ? (
              /* Subject icon — replaces period number, no + button */
              <TouchableOpacity
                onPress={() => onPressSubject(slot.id)}
                activeOpacity={0.7}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255,94,0,0.15)' : 'rgba(255,94,0,0.10)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(() => { const Icon = getSubjectIcon(subject.name); return <Icon color="#FF5E00" size={22} />; })()}
              </TouchableOpacity>
            ) : (
              /* Period number badge + + button — only when unassigned */
              <>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: badgeBg,
                    borderWidth: 1,
                    borderColor: badgeBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: numColor }}>
                    {periodLabel}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onPressSubject(slot.id)}
                  activeOpacity={0.6}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: badgeBg,
                    borderWidth: 1,
                    borderColor: badgeBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 8,
                  }}
                >
                  <Plus size={15} color={numColor} />
                </TouchableOpacity>
              </>
            )}

            {/* Subject name + faculty + time */}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <TouchableOpacity onPress={() => onPressSubject(slot.id)} activeOpacity={0.7}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    letterSpacing: -0.1,
                    color: slot.isBreak ? nameColor : subject ? nameColor : emptyColor,
                  }}
                >
                  {slot.isBreak ? (slot.title || 'Free Period') : subject ? subject.name : 'Tap & hold to assign'}
                </Text>
              </TouchableOpacity>

              {/* Maintain uniform height for all cards by rendering an empty line if no faculty is present */}
              {subject?.faculty ? (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 12, fontWeight: '500', color: timeColor, marginTop: 2 }}
                >
                  {subject.faculty}
                </Text>
              ) : (
                <View style={{ height: 16, marginTop: 2 }} />
              )}

              <TouchableOpacity
                onPress={() => onPressTime(slot.id)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}
              >
                <Clock size={12} color={isActive ? '#FF5E00' : timeColor} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: isActive ? '#FF5E00' : timeColor, marginLeft: 4 }}>
                  {slot.startTime} – {slot.endTime}
                </Text>
                {isActive && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, backgroundColor: 'rgba(255,94,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF5E00', marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF5E00', textTransform: 'uppercase' }}>Live</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Assign / Assigned pill */}
            <TouchableOpacity
              onPress={() => onPressSubject(slot.id)}
              activeOpacity={0.7}
              style={{
                marginLeft: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: slot.isBreak
                  ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')
                  : subject
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(255,94,0,0.12)',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: slot.isBreak
                    ? numColor
                    : subject ? '#10B981' : '#FF5E00',
                }}
              >
                {slot.isBreak ? 'Break' : subject ? 'Assigned' : 'Assign'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>

    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
  },
  deleteBox: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_W,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
