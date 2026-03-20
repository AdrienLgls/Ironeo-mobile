import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ShareCardStatsProps {
  pseudo: string;
  level: number;
  totalSessions: number;
  totalVolume: number;
  totalPRs: number;
  streak: number;
}

export interface ShareCardPRProps {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

export interface ShareCardAchievementProps {
  badgeName: string;
  description: string;
  level: number;
  streak: number;
}

export function ShareCardStats({
  pseudo,
  level,
  totalSessions,
  totalVolume,
  totalPRs,
  streak,
}: ShareCardStatsProps) {
  const volumeLabel =
    totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}t` : `${Math.round(totalVolume)}kg`;

  return (
    <View style={statsStyles.card}>
      <Text style={statsStyles.logo}>IRONEO</Text>

      <View style={statsStyles.userBlock}>
        <Text style={statsStyles.pseudo}>{pseudo}</Text>
        <View style={statsStyles.levelPill}>
          <Text style={statsStyles.levelText}>Niveau {level}</Text>
        </View>
      </View>

      <View style={statsStyles.grid}>
        <View style={statsStyles.cell}>
          <Text style={statsStyles.cellValue}>{totalSessions}</Text>
          <Text style={statsStyles.cellLabel}>Sessions</Text>
        </View>
        <View style={statsStyles.cell}>
          <Text style={statsStyles.cellValue}>{volumeLabel}</Text>
          <Text style={statsStyles.cellLabel}>Volume</Text>
        </View>
        <View style={statsStyles.cell}>
          <Text style={statsStyles.cellValue}>{totalPRs}</Text>
          <Text style={statsStyles.cellLabel}>PRs</Text>
        </View>
        <View style={statsStyles.cell}>
          <Text style={statsStyles.cellValue}>{streak}j</Text>
          <Text style={statsStyles.cellLabel}>Streak</Text>
        </View>
      </View>

      <Text style={statsStyles.footer}>ironeo.com</Text>
    </View>
  );
}

export function ShareCardPR({ exerciseName, weight, reps, date }: ShareCardPRProps) {
  return (
    <View style={prStyles.card}>
      <Text style={prStyles.trophy}>🏆</Text>
      <Text style={prStyles.label}>NOUVEAU RECORD</Text>
      <Text style={prStyles.exerciseName}>{exerciseName}</Text>
      <View style={prStyles.weightRow}>
        <Text style={prStyles.weight}>{weight}</Text>
        <Text style={prStyles.weightUnit}>kg</Text>
      </View>
      <Text style={prStyles.repsDate}>
        {reps} reps · {date}
      </Text>
      <Text style={prStyles.footer}>ironeo.com</Text>
    </View>
  );
}

export function ShareCardAchievement({
  badgeName,
  description,
  level,
  streak,
}: ShareCardAchievementProps) {
  return (
    <View style={achStyles.card}>
      <View style={achStyles.glowCircle} />
      <Text style={achStyles.badgeEmoji}>🏅</Text>
      <Text style={achStyles.label}>BADGE DÉBLOQUÉ</Text>
      <Text style={achStyles.badgeName}>{badgeName}</Text>
      <Text style={achStyles.description}>{description}</Text>
      <View style={achStyles.chips}>
        <View style={achStyles.chip}>
          <Text style={achStyles.chipText}>Niveau {level}</Text>
        </View>
        <View style={achStyles.chip}>
          <Text style={achStyles.chipText}>{streak}j streak</Text>
        </View>
      </View>
      <Text style={achStyles.footer}>ironeo.com</Text>
    </View>
  );
}

const CARD_W = 320;
const CARD_H = 480;
const BG = '#1A1A1A';
const GOLD = '#EFBF04';
const WHITE = '#FAFAFA';
const WHITE_40 = 'rgba(250,250,250,0.4)';
const WHITE_60 = 'rgba(250,250,250,0.6)';

const statsStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: BG,
    borderRadius: 20,
    padding: 28,
    justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'Quilon-Medium',
    fontSize: 18,
    color: GOLD,
    letterSpacing: 3,
  },
  userBlock: {
    alignItems: 'flex-start',
    gap: 8,
  },
  pseudo: {
    fontFamily: 'Quilon-Medium',
    fontSize: 28,
    color: WHITE,
  },
  levelPill: {
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  levelText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 13,
    color: '#0A0A0A',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: (CARD_W - 56 - 8) / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  cellValue: {
    fontFamily: 'Quilon-Medium',
    fontSize: 20,
    color: GOLD,
    marginBottom: 2,
  },
  cellLabel: {
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: WHITE_60,
  },
  footer: {
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: WHITE_40,
    textAlign: 'right',
  },
});

const prStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: BG,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  trophy: {
    fontSize: 72,
  },
  label: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: GOLD,
    letterSpacing: 2,
  },
  exerciseName: {
    fontFamily: 'Quilon-Medium',
    fontSize: 24,
    color: WHITE,
    textAlign: 'center',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  weight: {
    fontFamily: 'Quilon-Medium',
    fontSize: 48,
    color: GOLD,
    lineHeight: 56,
  },
  weightUnit: {
    fontFamily: 'Quilon-Medium',
    fontSize: 20,
    color: GOLD,
    paddingBottom: 6,
  },
  repsDate: {
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
    color: WHITE_60,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    right: 28,
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: WHITE_40,
  },
});

const achStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: BG,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239,191,4,0.08)',
    top: CARD_H / 2 - 100,
  },
  badgeEmoji: {
    fontSize: 64,
  },
  label: {
    fontFamily: 'Quilon-Medium',
    fontSize: 13,
    color: GOLD,
    letterSpacing: 2,
  },
  badgeName: {
    fontFamily: 'Quilon-Medium',
    fontSize: 22,
    color: WHITE,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: WHITE_60,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: 'rgba(239,191,4,0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: GOLD,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    right: 28,
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: WHITE_40,
  },
});
