import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, useSharedValue, useFrame, Skia, Shader, RoundedRect, vec } from '@shopify/react-native-skia';

import { useThemeStore } from '@/lib/stores/themeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ShaderBackgroundProps {
  children: React.ReactNode;
  shaderType?: 'cyberpunk' | 'matrix' | 'wave' | 'plasma';
  primaryColor?: string;
  secondaryColor?: string;
  intensity?: number;
  animationSpeed?: number;
  onIntensityChange?: (intensity: number) => void;
  onColorChange?: (color: string) => void;
}

const ShaderComponent = ({ shaderType, primaryColor, secondaryColor, intensity, animationSpeed }: {
  shaderType: string;
  primaryColor: string;
  secondaryColor: string;
  intensity: number;
  animationSpeed: number;
}) => {
  const time = useSharedValue(0);

  useFrame((deltaTime) => {
    time.value += deltaTime * animationSpeed;
  });

  const getShaderSource = (type: string) => {
    switch (type) {
      case 'cyberpunk':
        return Skia.RuntimeEffect.Make(`
          uniform float u_time;
          uniform float u_intensity;
          uniform vec3 u_primaryColor;
          uniform vec3 u_secondaryColor;
          uniform vec2 u_resolution;
          
          vec4 main(vec2 fragCoord) {
            vec2 uv = fragCoord / u_resolution;
            
            // Animated grid lines
            float grid = 0.0;
            for (float i = 0.0; i < 20.0; i++) {
              float pos = mod(u_time + i * 0.5, 2.0);
              float line = smoothstep(0.48, 0.52, uv.x + pos);
              grid += line * smoothstep(0.48, 0.52, uv.y + pos);
            }
            
            // Glow effect
            float glow = exp(-distance(uv, vec2(0.5)) * 3.0) * u_intensity;
            
            vec3 color = mix(u_primaryColor, u_secondaryColor, sin(u_time * 2.0) * 0.5 + 0.5);
            
            return vec4(color * (0.3 + grid * 0.7 + glow), 1.0);
          }
        `);
      
      case 'matrix':
        return Skia.RuntimeEffect.Make(`
          uniform float u_time;
          uniform float u_intensity;
          uniform vec3 u_primaryColor;
          uniform vec2 u_resolution;
          
          vec4 main(vec2 fragCoord) {
            vec2 uv = fragCoord / u_resolution;
            
            // Matrix rain effect
            float rain = 0.0;
            for (float i = 0.0; i < 30.0; i++) {
              float y = mod(u_time * 0.3 + i * 0.1, 1.0);
              float line = smoothstep(uv.y - y - 0.02, uv.y - y, 0.02);
              float x = mod(u_time + i * 0.137, 1.0);
              rain += line * smoothstep(x - 0.01, x + 0.01, uv.x);
            }
            
            vec3 color = u_primaryColor * (0.5 + rain * 0.5);
            
            return vec4(color * u_intensity, 1.0);
          }
        `);
      
      case 'wave':
        return Skia.RuntimeEffect.Make(`
          uniform float u_time;
          uniform float u_intensity;
          uniform vec3 u_primaryColor;
          uniform vec3 u_secondaryColor;
          uniform vec2 u_resolution;
          
          vec4 main(vec2 fragCoord) {
            vec2 uv = fragCoord / u_resolution;
            
            // Wave effect
            float wave1 = sin(uv.x * 10.0 + u_time) * 0.1;
            float wave2 = sin(uv.y * 8.0 + u_time * 0.8) * 0.1;
            float combined = wave1 + wave2;
            
            // Gradient
            vec3 color = mix(u_primaryColor, u_secondaryColor, uv.y + combined);
            
            // Glow
            float glow = exp(-distance(uv, vec2(0.5, 0.5)) * 2.0) * u_intensity;
            
            return vec4(color + glow, 1.0);
          }
        `);
      
      case 'plasma':
        return Skia.RuntimeEffect.Make(`
          uniform float u_time;
          uniform float u_intensity;
          uniform vec3 u_primaryColor;
          uniform vec3 u_secondaryColor;
          uniform vec2 u_resolution;
          
          vec4 main(vec2 fragCoord) {
            vec2 uv = fragCoord / u_resolution;
            
            // Plasma effect
            float v1 = sin(uv.x * 10.0 + u_time);
            float v2 = sin(uv.y * 10.0 + u_time * 0.7);
            float v3 = sin((uv.x + uv.y) * 10.0 + u_time * 0.3);
            float v = (v1 + v2 + v3) / 3.0;
            
            vec3 color = mix(u_primaryColor, u_secondaryColor, v);
            
            return vec4(color * u_intensity, 1.0);
          }
        `);
      
      default:
        return Skia.RuntimeEffect.Make(`
          uniform float u_time;
          uniform float u_intensity;
          uniform vec3 u_primaryColor;
          uniform vec2 u_resolution;
          
          vec4 main(vec2 fragCoord) {
            return vec4(u_primaryColor * u_intensity, 1.0);
          }
        `);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 1, b: 1 };
  };

  const shader = getShaderSource(shaderType);
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  if (!shader) return null;

  return (
    <RoundedRect
      x={0}
      y={0}
      width={screenWidth}
      height={screenHeight}
      color="white"
    >
      <Shader
        source={shader}
        uniforms={{
          u_time: time,
          u_intensity: intensity,
          u_primaryColor: vec(primaryRgb.r, primaryRgb.g, primaryRgb.b),
          u_secondaryColor: vec(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
          u_resolution: vec(screenWidth, screenHeight),
        }}
      />
    </RoundedRect>
  );
};

export const ShaderBackground: React.FC<ShaderBackgroundProps> = ({
  children,
  shaderType = 'cyberpunk',
  primaryColor = '#00ffff',
  secondaryColor = '#ff00ff',
  intensity = 0.7,
  animationSpeed = 1,
  onIntensityChange,
  onColorChange,
}) => {
  const { themeMode } = useThemeStore();

  useEffect(() => {
    onIntensityChange?.(intensity);
    onColorChange?.(primaryColor);
  }, [intensity, primaryColor, onIntensityChange, onColorChange]);

  return (
    <View style={styles.container}>
      <Canvas style={{ flex: 1 }}>
        <ShaderComponent
          shaderType={shaderType}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          intensity={intensity}
          animationSpeed={animationSpeed}
        />
      </Canvas>
      
      <View style={styles.contentOverlay}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    zIndex: 10,
    pointerEvents: 'none',
  },
});
