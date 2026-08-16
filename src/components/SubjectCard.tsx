import React from 'react';
import {
  View, Text, TouchableOpacity,
  Platform, StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle, withSpring, useSharedValue,
} from 'react-native-reanimated';
import { Subject, AttendanceType } from '../types/attendance.types';
import { AttendancePctRing } from './AttendancePctRing';
import { MarkButton } from './MarkButton';
import { computeStats, getAttendanceStatusMessage } from '../utils/attendance.utils';
import { getSubjectIcon } from '../utils/subject.utils';
import { User, TriangleAlert, CheckCircle2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface SubjectCardProps {
  subject: Subject;
  onMarkAttendance: (type: AttendanceType) => void;
  onLongPress?: () => void;
  isLocked?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const SubjectCard = ({
  subject,
  onMarkAttendance,
  onLongPress,
  isLocked = false,
}: SubjectCardProps) => {
  const stats    = computeStats(subject);
  const statusMsg = getAttendanceStatusMessage(subject.attended, subject.total);
  const Icon     = getSubjectIcon(subject.name);
  const scale    = useSharedValue(1);
  const { colorScheme } = useColorScheme();
  const isDark   = colorScheme === 'dark';

  // ── Colours ───────────────────────────────────────────────────
  const cardBg      = isDark ? '#1A1A2E' : '#FFFFFF';
  const cardBorder  = isDark ? 'rgba(255,94,0,0.14)' : 'rgba(0,0,0,0.07)';
  const iconBg      = isDark ? '#12122A' : '#FFF4EE';
  const codePillBg  = isDark ? 'rgba(255,94,0,0.18)' : 'rgba(255,94,0,0.10)';
  const textPrimary = isDark ? '#F1F5F9' : '#111827';
  const textMuted   = '#9CA3AF';
  const dividerColor= isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const bannerBg    = isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB';
  const bannerBorder= isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const statusColor =
    statusMsg.status === 'safe'       ? '#10B981' :
    statusMsg.status === 'borderline' ? '#F59E0B' : '#EF4444';

  const elevation = Platform.OS === 'ios' && !isDark
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14 }
    : !isDark ? { elevation: 3 } : {};

  const rStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedTouchable
      activeOpacity={0.95}
      onLongPress={onLongPress}
      onPressIn={() => { scale.value = withSpring(0.975, { damping: 18, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1,     { damping: 18, stiffness: 300 }); }}
      style={[elevation, rStyle, { marginBottom: 14 }]}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

        {/* ════════════════════════════════════════
            ROW 1 — Icon | Info | Ring
        ════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>

          {/* Subject icon */}
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Icon color="#FF5E00" size={22} />
          </View>

          {/* Code + Name + Faculty */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Code pill */}
            <View style={[styles.codePill, { backgroundColor: codePillBg }]}>
              <Text style={styles.codeText}>{subject.code}</Text>
            </View>

            <Text style={[styles.subjectName, { color: textPrimary }]} numberOfLines={2}>
              {subject.name}
            </Text>

            {subject.faculty ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <User size={12} color={textMuted} />
                <Text style={[styles.facultyText, { marginLeft: 5 }]}>{subject.faculty}</Text>
              </View>
            ) : null}
          </View>

          {/* Attendance ring */}
          <View style={{ width: 58, height: 58, marginLeft: 12 }}>
            <AttendancePctRing percentage={stats.percentage} size={58} strokeWidth={6} />
            <View style={StyleSheet.absoluteFill}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.ringPct, { color: textPrimary }]}>
                  {stats.percentage === -1 ? '–' : `${Math.round(stats.percentage)}%`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ════════════════════════════════════════
            ROW 2 — Total | Attended (same line)
        ════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={styles.statText}>
            <Text style={[styles.statLabel, { color: textMuted }]}>Total  </Text>
            <Text style={[styles.statNum, { color: textPrimary }]}>{stats.total}</Text>
          </Text>
          <Text style={styles.statText}>
            <Text style={[styles.statLabel, { color: textMuted }]}>Attended  </Text>
            <Text style={[styles.statNum, { color: textPrimary }]}>{stats.attended}</Text>
          </Text>
        </View>

        {/* ════════════════════════════════════════
            ROW 3 — Action buttons
        ════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isLocked ? 8 : 0 }}>
          <MarkButton label="P"  type="PRESENT" isSelected={false} disabled={isLocked} onPress={onMarkAttendance} />
          <MarkButton label="A"  type="ABSENT"  isSelected={false} disabled={isLocked} onPress={onMarkAttendance} />
          <MarkButton label="OD" type="OD"      isSelected={false} disabled={false}    onPress={onMarkAttendance} />
          <MarkButton label="ML" type="ML"      isSelected={false} disabled={false}    onPress={onMarkAttendance} />
        </View>

        {/* Locked hint */}
        {isLocked ? (
          <Text style={[styles.lockedHint, { marginTop: 6 }]}>
            No more scheduled sessions to mark today.
          </Text>
        ) : null}

        {/* ════════════════════════════════════════
            ROW 4 — Status banner
        ════════════════════════════════════════ */}
        {stats.total > 0 ? (
          <View style={[styles.statusBanner, { backgroundColor: bannerBg, borderColor: bannerBorder, marginTop: 14 }]}>
            {statusMsg.status === 'safe'
              ? <CheckCircle2 size={15} color="#10B981" />
              : <TriangleAlert size={15} color={statusColor} />}
            <Text style={[styles.statusLabel, { color: statusColor, marginLeft: 8 }]}>
              {statusMsg.status === 'safe' ? 'Safe' : statusMsg.status === 'borderline' ? 'Borderline' : 'Critical'}
              {'  '}
              <Text style={{ fontWeight: '400', color: textMuted }}>{statusMsg.text}</Text>
            </Text>
          </View>
        ) : null}

      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  codePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  codeText: {
    color: '#FF5E00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },

  subjectName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
  },

  facultyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  ringPct: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  divider: {
    height: 1,
  },

  statText: {
    fontSize: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  lockedHint: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
  },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
});
