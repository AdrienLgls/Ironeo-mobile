import React, { memo, useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Matches web PlateCalculator: 20kg bar, visual plate stack, per-side breakdown
// PlateCalculatorToggle: inline toggle button + calculator

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25] as const;
const BAR_WEIGHT = 20;

const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444',
  20: '#3b82f6',
  15: '#eab308',
  10: '#22c55e',
  5: 'rgba(255,255,255,0.30)',
  2.5: 'rgba(255,255,255,0.20)',
  1.25: 'rgba(255,255,255,0.10)',
};

function calculatePlates(targetWeight: number): number[] {
  if (targetWeight <= BAR_WEIGHT) return [];
  let remaining = (targetWeight - BAR_WEIGHT) / 2;
  const result: number[] = [];
  for (const plate of PLATES) {
    while (remaining >= plate - 0.001) {
      result.push(plate);
      remaining -= plate;
    }
  }
  return result;
}

interface PlateCalculatorProps {
  weight: number;
  onClose?: () => void;
}

const PlateCalculator = memo(function PlateCalculator({ weight, onClose }: PlateCalculatorProps) {
  const plates = useMemo(() => calculatePlates(weight || 0), [weight]);

  if (weight <= BAR_WEIGHT) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Barre seule ({BAR_WEIGHT}kg)</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Text style={styles.calcIcon}>⚖ </Text>
          {weight}kg — Plaques par côté
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Visual plate stack */}
      <View style={styles.plateStack}>
        {/* Bar */}
        <View style={styles.bar} />
        {/* Plates */}
        {plates.map((plate, i) => (
          <View
            key={i}
            style={[
              styles.plate,
              {
                backgroundColor: PLATE_COLORS[plate] ?? 'rgba(255,255,255,0.10)',
                height: 12 + plate * 1.2,
                width: Math.max(14, 8 + plate * 0.5),
              },
            ]}
          >
            {plate >= 5 && (
              <Text style={styles.plateText}>{plate}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>Barre {BAR_WEIGHT}kg</Text>
        {plates.length > 0 && (
          <Text style={styles.summaryText}>
            + {plates.map((p) => `${p}kg`).join(' + ')} par côté
          </Text>
        )}
      </View>
    </View>
  );
});

export const PlateCalculatorToggle = memo(function PlateCalculatorToggle({ weight }: { weight: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);

  if (!weight || weight <= 0) return null;

  return (
    <View>
      <TouchableOpacity onPress={toggle} style={styles.toggleBtn}>
        <Text style={[styles.toggleIcon, isOpen && styles.toggleIconActive]}>⚖</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.togglePanel}>
          <PlateCalculator weight={weight} onClose={toggle} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontFamily: 'Quilon-Medium',
    color: '#fafafa',
    flex: 1,
  },
  calcIcon: {
    color: '#EFBF04',
  },
  closeBtn: {
    fontSize: 14,
    color: '#a0a0a0',
    paddingLeft: 8,
  },
  plateStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  bar: {
    height: 12,
    width: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
  },
  plate: {
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#a0a0a0',
    fontFamily: 'Rowan-Regular',
  },
  toggleBtn: {
    padding: 10,
  },
  toggleIcon: {
    fontSize: 14,
    color: '#a0a0a0',
  },
  toggleIconActive: {
    color: '#EFBF04',
  },
  togglePanel: {
    marginTop: 8,
  },
});

export default PlateCalculator;
