"use client";

import styled from "styled-components";

export default function RotatingCube({ size = 400, sidebar = false }) {
  // Calculate specific values based on size to maintain proportions
  const halfSize = size / 2;
  const perspective = size * 10;
  const containerSize = size * 2;
  const borderSize = Math.max(1, Math.round(size / 50));
  const glowSize = Math.max(5, Math.round(size / 8));

  return (
    <CubeContainer
      $size={containerSize}
      $perspective={perspective}
      $sidebar={sidebar}
    >
      <Cube $size={size}>
        <CubeFace className="front" $size={size} $z={halfSize} $border={borderSize} $glow={glowSize}><img src="/pixel.jpg" alt="Pixel Logo" /></CubeFace>
        <CubeFace className="back" $size={size} $z={halfSize} $border={borderSize} $glow={glowSize}><img src="/pixel.jpg" alt="Pixel Logo" /></CubeFace>
        <CubeFace className="left" $size={size} $z={halfSize} $border={borderSize} $glow={glowSize}><img src="/pixel.jpg" alt="Pixel Logo" /></CubeFace>
        <CubeFace className="right" $size={size} $z={halfSize} $border={borderSize} $glow={glowSize}>
          <img src="/pixel.jpg" alt="Pixel Logo" />
        </CubeFace>
        <CubeFace className="top" $size={size} $z={halfSize} $border={borderSize} $glow={glowSize}><img src="/pixel.jpg" alt="Pixel Logo" /></CubeFace>
        <CubeFace className="bottom" $size={size} $z={halfSize} $border={borderSize} $glow={glowSize}><img src="/pixel.jpg" alt="Pixel Logo" /></CubeFace>
      </Cube>
    </CubeContainer>
  );
}

const CubeContainer = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  perspective: ${({ $perspective }) => $perspective}px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease-in-out;

  /* Slightly scale when sidebar expands */
  transform: ${({ $sidebar }) => ($sidebar ? "scale(1.1)" : "scale(1)")};
`;

const Cube = styled.div`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  position: relative;
  transform-style: preserve-3d;
  animation: rotate3D 10s infinite linear;
  transform-origin: center;

  @keyframes rotate3D {
    from { transform: rotateY(0deg); }
    to { transform: rotateY(360deg); }
  }
`;

const CubeFace = styled.div`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  background: rgba(0, 0, 0, 0.95);
  border: ${({ $border }) => $border}px solid #FF1493;
  box-shadow: 0px 0px ${({ $glow }) => $glow}px ${({ $glow }) => $glow / 4}px rgba(255, 20, 147, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: colorCycle 10s infinite alternate;

  /* Face positions scale with size ($z = size / 2) */
  &.front  { transform: translateZ(${({ $z }) => $z}px); } 
  &.back   { transform: rotateY(180deg) translateZ(${({ $z }) => $z}px); }
  &.left   { transform: rotateY(-90deg) translateZ(${({ $z }) => $z}px); }
  &.right  { transform: rotateY(90deg) translateZ(${({ $z }) => $z}px); }
  &.top    { transform: rotateX(90deg) translateZ(${({ $z }) => $z}px); }
  &.bottom { transform: rotateX(-90deg) translateZ(${({ $z }) => $z}px); }

  img {
    width: 90%;
    height: 90%;
    object-fit: contain;
  }

  @keyframes colorCycle {
    0% { border-color: #FF1493; color: #FF1493; }
    50% { border-color: #00FFFF; color: #00FFFF; }
    100% { border-color: #FF1493; color: #FF1493; }
  }
`;