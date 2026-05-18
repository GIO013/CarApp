import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Line, Text as SvgText, Image as SvgImage } from 'react-native-svg';

const ROUND_BG = require('../../assets/images/round.png');

const majorTickValues = [0, 30, 60];
const minorTickValues = [15, 45, 75];

const Gauge = ({
  value,
  color = 'rgb(0, 255, 136)',
  title = 'PITCH',
  carImage,
  isLandscape,
  screenWidth,
  screenHeight,
  compact = false,
}) => {
  const size = isLandscape
    ? Math.min(screenHeight * 0.65, screenWidth * 0.38)
    : compact
      ? Math.min(screenWidth * 0.46, screenHeight * 0.22)
      : Math.min(screenWidth * 0.48, screenHeight * 0.35);

  const center = size / 2;
  const radius = size * 0.36;

  const carTilt = value * 1.5;

  const tickInnerRadius = size * 0.40;
  const tickOuterRadius = size * 0.44;
  const labelRadius = size * 0.48;

  const titleFontSize = isLandscape ? Math.max(14, size * 0.1) : Math.max(12, size * 0.09);
  const tickFontSize = Math.max(8, size * 0.055);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[styles.gaugeTitle, { color, fontSize: titleFontSize }]}>
        {value > 0 ? '+' : ''}{Math.round(value)}° {title}
      </Text>

      <View style={{ position: 'relative', width: size, height: size }}>
        <Image
          source={ROUND_BG}
          style={{ position: 'absolute', width: size, height: size, opacity: 0.9 }}
          resizeMode="contain"
        />

        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {[...majorTickValues, ...minorTickValues].map((tickValue) => {
            const isMajor = majorTickValues.includes(tickValue);
            const innerR = isMajor ? tickInnerRadius - 2 : tickInnerRadius;
            const outerR = isMajor ? tickOuterRadius + 2 : tickOuterRadius;

            const positions = [
              { angle: 180 + tickValue, label: tickValue === 0 ? '0°' : `+${tickValue}°` },
              { angle: 360 - tickValue, label: tickValue === 0 ? '0°' : `+${tickValue}°` },
              { angle: 180 - tickValue, label: tickValue === 0 ? '0°' : `-${tickValue}°` },
              { angle: tickValue,       label: tickValue === 0 ? '0°' : `-${tickValue}°` },
            ];

            return positions.map((pos, idx) => {
              const rad = (pos.angle * Math.PI) / 180;
              const x1 = center + innerR * Math.cos(rad);
              const y1 = center + innerR * Math.sin(rad);
              const x2 = center + outerR * Math.cos(rad);
              const y2 = center + outerR * Math.sin(rad);
              const labelX = center + labelRadius * Math.cos(rad);
              const labelY = center + labelRadius * Math.sin(rad);

              const showLabel = isMajor && tickValue !== 0;

              return (
                <React.Fragment key={`tick-${tickValue}-${idx}`}>
                  <Line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={color}
                    strokeWidth={isMajor ? 2.5 : 1.5}
                    opacity={isMajor ? 0.9 : 0.5}
                  />
                  {showLabel && (
                    <SvgText
                      x={labelX} y={labelY}
                      fontSize={tickFontSize}
                      fill={color}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      opacity={0.8}
                      fontWeight="500"
                    >
                      {pos.label}
                    </SvgText>
                  )}
                </React.Fragment>
              );
            });
          })}

          <SvgImage
            href={carImage}
            x={center - size * 0.44}
            y={center - size * 0.44}
            width={size * 0.9}
            height={size * 0.9}
            preserveAspectRatio="xMidYMid meet"
            transform={`rotate(${carTilt} ${center} ${center})`}
          />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gaugeTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
});

export default Gauge;
