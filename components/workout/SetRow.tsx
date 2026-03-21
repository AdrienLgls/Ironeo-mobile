import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import type { WorkoutSet, SetType } from '../../types/workout';

interface Props {
  set: WorkoutSet;
  index: number;
  isCurrent: boolean;
  onComplete: (weight: number, reps: number, rpe: number) => void;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
}

const SET_TYPE_LABELS: Record<SetType, string> = {
  Normal: 'Working',
  Warmup: 'Warmup',
  Dropset: 'Drop Set',
};

const SET_TYPE_COLORS: Record<SetType, string> = {
  Normal: '#EFBF04',
  Warmup: '#6B7280',
  Dropset: '#8B5CF6',
};

const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export default function SetRow({ set, index, isCurrent, onComplete, onUpdate }: Props) {
  const [weight, setWeight] = useState(set.weight != null ? String(set.weight) : '');
  const [reps, setReps] = useState(set.reps > 0 ? String(set.reps) : '');
  const [selectedRpe, setSelectedRpe] = useState<number>(set.rpe ?? 8);
  const type: SetType = (set.type as SetType) ?? 'Normal';

  const typeColor = SET_TYPE_COLORS[type];
  const typeLabel = SET_TYPE_LABELS[type];

  function handleComplete() {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;
    onComplete(w, r, selectedRpe);
  }

  if (set.completed) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 12,
          backgroundColor: 'rgba(239, 191, 4, 0.08)',
          borderRadius: 10,
          marginBottom: 6,
          opacity: 0.7,
        }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#EFBF04', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>✓</Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Rowan-Regular', fontSize: 13, flex: 1 }}>
          Set {index + 1}
          {set.weight ? `  ·  ${set.weight} kg` : ''}
          {set.reps ? `  ·  ${set.reps} reps` : ''}
          {set.rpe ? `  ·  @${set.rpe}` : ''}
        </Text>
        <View style={{ backgroundColor: `${typeColor}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: typeColor, fontFamily: 'Rowan-Regular', fontSize: 10 }}>{typeLabel}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: isCurrent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: isCurrent ? 1 : 0,
        borderColor: isCurrent ? 'rgba(239,191,4,0.3)' : 'transparent',
      }}
    >
      {/* Row header: Set # + type badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 11 }}>{index + 1}</Text>
        </View>
        <View style={{ backgroundColor: `${typeColor}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: typeColor, fontFamily: 'Rowan-Regular', fontSize: 10 }}>{typeLabel}</Text>
        </View>
      </View>

      {/* Weight + Reps inputs */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 10, marginBottom: 4 }}>POIDS (kg)</Text>
          <TextInput
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: '#fff',
              fontFamily: 'Rowan-Regular',
              fontSize: 16,
              textAlign: 'center',
            }}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="—"
            placeholderTextColor="rgba(255,255,255,0.2)"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 10, marginBottom: 4 }}>REPS</Text>
          <TextInput
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: '#fff',
              fontFamily: 'Rowan-Regular',
              fontSize: 16,
              textAlign: 'center',
            }}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="—"
            placeholderTextColor="rgba(255,255,255,0.2)"
          />
        </View>
      </View>

      {/* RPE Selector */}
      {isCurrent && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 10, marginBottom: 6 }}>
            RPE (effort perçu)
          </Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {RPE_VALUES.map((rpe) => (
              <TouchableOpacity
                key={rpe}
                onPress={() => setSelectedRpe(rpe)}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: selectedRpe === rpe ? '#EFBF04' : 'rgba(255,255,255,0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: selectedRpe === rpe ? '#000' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Rowan-Regular',
                  fontSize: 10,
                  fontWeight: selectedRpe === rpe ? '700' : '400',
                }}>
                  {rpe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Complete button (current set only) */}
      {isCurrent && (
        <TouchableOpacity
          onPress={handleComplete}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#EFBF04',
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#000', fontFamily: 'Quilon-Medium', fontSize: 15 }}>
            Valider le set ✓
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
